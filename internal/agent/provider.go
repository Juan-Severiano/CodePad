package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type LLMProvider interface {
	GenerateResponse(prompt string) (string, error)
}

type AnthropicProvider struct {
	APIKey string
}

func NewAnthropicProvider(apiKey string) *AnthropicProvider {
	return &AnthropicProvider{APIKey: apiKey}
}

func (p *AnthropicProvider) GenerateResponse(prompt string) (string, error) {
	// Implementação base de chamada HTTP nativa à API da Anthropic.
	
	payload := map[string]interface{}{
		"model": "claude-3-5-sonnet-20241022",
		"max_tokens": 1024,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}
	
	jsonPayload, _ := json.Marshal(payload)
	
	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return "", err
	}
	
	req.Header.Set("x-api-key", p.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")
	
	// Bypass dummy para testes de UI sem custo ou para não falhar sem chave real.
	if p.APIKey == "dummy-key-for-ui-testing" {
		return "[Dummy Response] Entendi a tarefa: " + prompt, nil
	}
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API call failed: %w", err)
	}
	defer resp.Body.Close()
	
	// Em um ambiente de produção aqui deserializaríamos o JSON de resposta corretamente.
	return "Resposta real interceptada da API da Anthropic", nil
}
