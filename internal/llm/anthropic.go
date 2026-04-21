package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const defaultAnthropicBase = "https://api.anthropic.com"
const defaultAnthropicModel = "claude-sonnet-4-6"

type AnthropicProvider struct {
	apiKey  string
	baseURL string // e.g. "https://api.anthropic.com" or custom proxy
	model   string
}

// NewAnthropicProvider creates a provider with default base URL.
func NewAnthropicProvider(apiKey, model string) *AnthropicProvider {
	return NewAnthropicProviderFull(apiKey, "", model)
}

// NewAnthropicProviderFull creates a provider with explicit base URL.
// baseURL defaults to "https://api.anthropic.com" if empty.
func NewAnthropicProviderFull(apiKey, baseURL, model string) *AnthropicProvider {
	if model == "" {
		model = defaultAnthropicModel
	}
	if baseURL == "" {
		baseURL = defaultAnthropicBase
	}
	baseURL = strings.TrimRight(baseURL, "/")
	return &AnthropicProvider{apiKey: apiKey, baseURL: baseURL, model: model}
}

// setAuthHeaders sets the correct auth header.
// API keys start with "sk-ant-"; other values are treated as Bearer tokens
// (e.g. Claude CLI OAuth tokens or gateway keys).
func (p *AnthropicProvider) setAuthHeaders(req *http.Request) {
	if p.apiKey != "" {
		req.Header.Set("x-api-key", p.apiKey)
		// We can also set Authorization Bearer for gateways, but x-api-key is strictly required by anthropic.
		if !strings.HasPrefix(p.apiKey, "sk-ant-") && !strings.HasPrefix(p.apiKey, "sk-") {
			req.Header.Set("Authorization", "Bearer "+p.apiKey)
		}
	}
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")
}

func (p *AnthropicProvider) TestConnection() error {
	body := []byte(`{"model":"claude-haiku-4-5","max_tokens":1,"messages":[{"role":"user","content":"Hi"}]}`)
	req, err := http.NewRequest("POST", p.baseURL+"/v1/messages", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	p.setAuthHeaders(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(raw))
	}
	return nil
}

func (p *AnthropicProvider) StreamChat(ctx context.Context, messages []Message, tools []ToolDefinition, opts StreamOptions) (<-chan StreamEvent, error) {
	eventChan := make(chan StreamEvent)

	go func() {
		defer close(eventChan)

		model := opts.Model
		if model == "" {
			model = p.model
		}
		maxTokens := opts.MaxTokens
		if maxTokens == 0 {
			maxTokens = 8192
		}

		reqBody := map[string]interface{}{
			"model":      model,
			"max_tokens": maxTokens,
			"messages":   messages,
			"stream":     true,
		}

		if opts.SystemPrompt != "" {
			reqBody["system"] = opts.SystemPrompt
		}

		if len(tools) > 0 {
			toolsData := make([]map[string]interface{}, len(tools))
			for i, t := range tools {
				toolsData[i] = map[string]interface{}{
					"name":         t.Name,
					"description":  t.Description,
					"input_schema": t.InputSchema,
				}
			}
			reqBody["tools"] = toolsData
		}

		if opts.Temperature > 0 {
			reqBody["temperature"] = opts.Temperature
		}

		bodyBytes, err := json.Marshal(reqBody)
		if err != nil {
			eventChan <- StreamEvent{Type: "error", Error: err.Error()}
			return
		}

		req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/v1/messages", bytes.NewBuffer(bodyBytes))
		if err != nil {
			eventChan <- StreamEvent{Type: "error", Error: err.Error()}
			return
		}
		p.setAuthHeaders(req)

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			if ctx.Err() != nil {
				return // cancelled
			}
			eventChan <- StreamEvent{Type: "error", Error: err.Error()}
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			raw, _ := io.ReadAll(resp.Body)
			eventChan <- StreamEvent{Type: "error", Error: fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(raw))}
			return
		}

		// Track tool_use accumulation across blocks
		type toolAccum struct {
			id    string
			name  string
			input strings.Builder
		}
		var currentTool *toolAccum

		scanner := bufio.NewScanner(resp.Body)
		scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

		for scanner.Scan() {
			select {
			case <-ctx.Done():
				return
			default:
			}

			line := scanner.Text()
			if !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				break
			}

			var ev map[string]interface{}
			if err := json.Unmarshal([]byte(data), &ev); err != nil {
				continue
			}

			evType, _ := ev["type"].(string)
			switch evType {

			case "content_block_start":
				cb, _ := ev["content_block"].(map[string]interface{})
				if cbType, _ := cb["type"].(string); cbType == "tool_use" {
					currentTool = &toolAccum{
						id:   cb["id"].(string),
						name: cb["name"].(string),
					}
				}

			case "content_block_delta":
				delta, _ := ev["delta"].(map[string]interface{})
				deltaType, _ := delta["type"].(string)

				switch deltaType {
				case "text_delta":
					if text, ok := delta["text"].(string); ok {
						eventChan <- StreamEvent{Type: "text", Content: text}
					}
				case "input_json_delta":
					if currentTool != nil {
						if partial, ok := delta["partial_json"].(string); ok {
							currentTool.input.WriteString(partial)
						}
					}
				}

			case "content_block_stop":
				if currentTool != nil {
					eventChan <- StreamEvent{
						Type:    "tool_use",
						ToolID:  currentTool.id,
						ToolName: currentTool.name,
						Content: currentTool.input.String(),
					}
					currentTool = nil
				}

			case "message_delta":
				usage, _ := ev["usage"].(map[string]interface{})
				if usage != nil {
					out, _ := usage["output_tokens"].(float64)
					// input_tokens is on message_start, not message_delta
					eventChan <- StreamEvent{
						Type: "done",
						Usage: &Usage{
							OutputTokens: int(out),
						},
					}
				}

			case "message_start":
				msg, _ := ev["message"].(map[string]interface{})
				if usage, _ := msg["usage"].(map[string]interface{}); usage != nil {
					in, _ := usage["input_tokens"].(float64)
					eventChan <- StreamEvent{
						Type: "usage",
						Usage: &Usage{InputTokens: int(in)},
					}
				}
			}
		}
	}()

	return eventChan, nil
}
