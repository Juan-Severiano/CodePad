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

type OpenAIProvider struct {
	apiKey  string
	baseURL string
	model   string
}

func NewOpenAIProvider(apiKey, baseURL, model string) *OpenAIProvider {
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	if model == "" {
		model = "gpt-4o"
	}
	return &OpenAIProvider{apiKey: apiKey, baseURL: baseURL, model: model}
}

func (p *OpenAIProvider) TestConnection() error {
	client := &http.Client{}
	req, _ := http.NewRequest("POST", p.baseURL+"/chat/completions", bytes.NewBuffer([]byte(`{
		"model": "gpt-4o",
		"messages": [{"role": "user", "content": "Hi"}],
		"max_tokens": 100
	}`)))
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("content-type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openai API error: %s", string(body))
	}
	return nil
}

func (p *OpenAIProvider) StreamChat(ctx context.Context, messages []Message, tools []ToolDefinition, opts StreamOptions) (<-chan StreamEvent, error) {
	eventChan := make(chan StreamEvent)

	go func() {
		defer close(eventChan)

		// Convert ToolDefinition to OpenAI format
		toolsData := make([]map[string]interface{}, len(tools))
		for i, t := range tools {
			toolsData[i] = map[string]interface{}{
				"type": "function",
				"function": map[string]interface{}{
					"name":        t.Name,
					"description": t.Description,
					"parameters": t.InputSchema,
				},
			}
		}

		reqBody := map[string]interface{}{
			"model":    opts.Model,
			"messages": messages,
			"stream":   true,
		}

		if opts.MaxTokens > 0 {
			reqBody["max_tokens"] = opts.MaxTokens
		}

		if opts.Temperature > 0 {
			reqBody["temperature"] = opts.Temperature
		}

		if len(tools) > 0 {
			reqBody["tools"] = toolsData
		}

		bodyBytes, _ := json.Marshal(reqBody)

		client := &http.Client{}
		req, _ := http.NewRequest("POST", p.baseURL+"/chat/completions", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Authorization", "Bearer "+p.apiKey)
		req.Header.Set("content-type", "application/json")

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

			if data == "[DONE]" {
				break
			}

			var event map[string]interface{}
			if err := json.Unmarshal([]byte(data), &event); err != nil {
				continue
			}

			choices, ok := event["choices"].([]interface{})
			if !ok || len(choices) == 0 {
				continue
			}

			choice := choices[0].(map[string]interface{})
			delta, ok := choice["delta"].(map[string]interface{})
			if !ok {
				continue
			}

			// Text delta
			if content, ok := delta["content"].(string); ok {
				eventChan <- StreamEvent{Type: "text", Content: content}
			}

			// Tool use
			if toolUse, ok := delta["tool_calls"].([]interface{}); ok && len(toolUse) > 0 {
				tc := toolUse[0].(map[string]interface{})
				if fn, ok := tc["function"].(map[string]interface{}); ok {
					toolName, _ := fn["name"].(string)
					toolInput, _ := fn["arguments"].(string)
					eventChan <- StreamEvent{
						Type: "tool_use",
						ToolUse: &ToolUseEvent{
							Name:  toolName,
							Input: []byte(toolInput),
						},
					}
				}
			}

			// Usage
			if usage, ok := event["usage"].(map[string]interface{}); ok {
				input, _ := usage["prompt_tokens"].(float64)
				output, _ := usage["completion_tokens"].(float64)
				eventChan <- StreamEvent{
					Type: "done",
					Usage: &Usage{
						InputTokens:  int(input),
						OutputTokens: int(output),
					},
				}
			}
		}
	}()

	return eventChan, nil
}
