package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type OllamaProvider struct {
	baseURL string
	model   string
}

func NewOllamaProvider(baseURL, model string) *OllamaProvider {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	if model == "" {
		model = "mistral"
	}
	return &OllamaProvider{baseURL: baseURL, model: model}
}

func (p *OllamaProvider) TestConnection() error {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", p.baseURL+"/api/tags", nil)

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ollama not available at %s", p.baseURL)
	}
	return nil
}

func (p *OllamaProvider) StreamChat(ctx context.Context, messages []Message, tools []ToolDefinition, opts StreamOptions) (<-chan StreamEvent, error) {
	eventChan := make(chan StreamEvent)

	go func() {
		defer close(eventChan)

		reqBody := map[string]interface{}{
			"model":    opts.Model,
			"messages": messages,
			"stream":   true,
		}

		bodyBytes, _ := json.Marshal(reqBody)

		client := &http.Client{}
		req, _ := http.NewRequest("POST", p.baseURL+"/api/chat", bytes.NewBuffer(bodyBytes))
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

		// Parse newline-delimited JSON
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			var event map[string]interface{}
			if err := json.Unmarshal(scanner.Bytes(), &event); err != nil {
				continue
			}

			if message, ok := event["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok && content != "" {
					eventChan <- StreamEvent{Type: "text", Content: content}
				}
			}

			if done, ok := event["done"].(bool); ok && done {
				eventChan <- StreamEvent{Type: "done"}
				break
			}
		}
	}()

	return eventChan, nil
}
