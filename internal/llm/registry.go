package llm

import "fmt"

func NewProvider(providerName, apiKey, baseURL, model string) (Provider, error) {
	switch providerName {
	case "anthropic":
		if apiKey == "" {
			return nil, fmt.Errorf("anthropic provider requires API key")
		}
		return NewAnthropicProvider(apiKey, model), nil

	case "openai":
		if apiKey == "" {
			return nil, fmt.Errorf("openai provider requires API key")
		}
		return NewOpenAIProvider(apiKey, baseURL, model), nil

	case "ollama":
		if baseURL == "" {
			baseURL = "http://localhost:11434"
		}
		return NewOllamaProvider(baseURL, model), nil

	default:
		return nil, fmt.Errorf("unknown provider: %s", providerName)
	}
}
