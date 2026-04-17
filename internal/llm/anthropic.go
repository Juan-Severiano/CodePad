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

type AnthropicProvider struct {
	apiKey string
	model  string
}

func NewAnthropicProvider(apiKey, model string) *AnthropicProvider {
	if model == "" {
		model = "claude-3-5-sonnet-20241022"
	}
	return &AnthropicProvider{apiKey: apiKey, model: model}
}

func (p *AnthropicProvider) TestConnection() error {
	client := &http.Client{}
	req, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer([]byte(`{
		"model": "claude-3-5-sonnet-20241022",
		"max_tokens": 100,
		"messages": [{"role": "user", "content": "Hi"}]
	}`)))
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("anthropic API error: %s", string(body))
	}
	return nil
}

func (p *AnthropicProvider) StreamChat(ctx context.Context, messages []Message, tools []ToolDefinition, opts StreamOptions) (<-chan StreamEvent, error) {
	eventChan := make(chan StreamEvent)

	go func() {
		defer close(eventChan)

		// Build request body
		reqBody := map[string]interface{}{
			"model":       opts.Model,
			"max_tokens":  opts.MaxTokens,
			"messages":    messages,
		}

		if opts.SystemPrompt != "" {
			reqBody["system"] = opts.SystemPrompt
		}

		if len(tools) > 0 {
			toolsData := make([]map[string]interface{}, len(tools))
			for i, t := range tools {
				toolsData[i] = map[string]interface{}{
					"name":        t.Name,
					"description": t.Description,
					"input_schema": t.InputSchema,
				}
			}
			reqBody["tools"] = toolsData
		}

		if opts.Temperature > 0 {
			reqBody["temperature"] = opts.Temperature
		}

		bodyBytes, _ := json.Marshal(reqBody)

		client := &http.Client{}
		req, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(bodyBytes))
		req.Header.Set("x-api-key", p.apiKey)
		req.Header.Set("anthropic-version", "2023-06-01")
		req.Header.Set("content-type", "application/json")
		req.Header.Set("stream", "true")

		resp, err := client.Do(req)
		if err != nil {
			eventChan <- StreamEvent{Type: "error", Error: err.Error()}
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			eventChan <- StreamEvent{Type: "error", Error: fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))}
			return
		}

		// Parse SSE stream
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()

			if !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")

			var event map[string]interface{}
			if err := json.Unmarshal([]byte(data), &event); err != nil {
				continue
			}

			eventType, ok := event["type"].(string)
			if !ok {
				continue
			}

			switch eventType {
			case "content_block_start":
				// Can check content_block type here
			case "content_block_delta":
				delta, ok := event["delta"].(map[string]interface{})
				if !ok {
					continue
				}
				deltaType, ok := delta["type"].(string)
				if !ok {
					continue
				}

				if deltaType == "text_delta" {
					if text, ok := delta["text"].(string); ok {
						eventChan <- StreamEvent{Type: "text", Content: text}
					}
				}

			case "message_delta":
				usage, ok := event["usage"].(map[string]interface{})
				if ok {
					input, _ := usage["input_tokens"].(float64)
					output, _ := usage["output_tokens"].(float64)
					eventChan <- StreamEvent{
						Type: "done",
						Usage: &Usage{
							InputTokens:  int(input),
							OutputTokens: int(output),
						},
					}
				}
			}
		}
	}()

	return eventChan, nil
}
