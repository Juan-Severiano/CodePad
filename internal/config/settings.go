package config

import (
	"os"
)

type Settings struct {
	APIKey   string
	Provider string
}

func LoadSettings() *Settings {
	// Num cenário real, carregaria de um keyring do SO ou arquivo seguro.
	// Para o escopo deste MVP, vamos buscar do ENV padrão.
	
	key := os.Getenv("OPENAGENT_API_KEY")
	if key == "" {
		key = "dummy-key-for-ui-testing"
	}
	
	provider := os.Getenv("OPENAGENT_PROVIDER")
	if provider == "" {
		provider = "anthropic" // Provedor Padrão inspirado no Claude Code
	}

	return &Settings{
		APIKey:   key,
		Provider: provider,
	}
}
