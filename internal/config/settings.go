package config

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// ─── Provider & Model types ───────────────────────────────────────────────────

type ProviderConfig struct {
	APIKey  string `json:"api_key"`
	BaseURL string `json:"base_url,omitempty"` // only used by Ollama / custom
	Enabled bool   `json:"enabled"`
}

type Settings struct {
	Providers    map[string]ProviderConfig `json:"providers"`
	DefaultModel string                    `json:"default_model"`
	EditorPath   string                    `json:"editor_path"`
	Theme        string                    `json:"theme"`
}

type ModelInfo struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Provider string `json:"provider"`
}

// ─── Static model catalog ─────────────────────────────────────────────────────

var catalogModels = map[string][]ModelInfo{
	"anthropic": {
		{ID: "claude-opus-4-5",   Label: "Claude Opus 4.5",   Provider: "Anthropic"},
		{ID: "claude-sonnet-4-5", Label: "Claude Sonnet 4.5", Provider: "Anthropic"},
		{ID: "claude-haiku-4-5",  Label: "Claude Haiku 4.5",  Provider: "Anthropic"},
		{ID: "claude-opus-4-7",   Label: "Claude Opus 4.7",   Provider: "Anthropic"},
		{ID: "claude-sonnet-4-6", Label: "Claude Sonnet 4.6", Provider: "Anthropic"},
	},
	"openai": {
		{ID: "gpt-4o",      Label: "GPT-4o",      Provider: "OpenAI"},
		{ID: "gpt-4o-mini", Label: "GPT-4o mini", Provider: "OpenAI"},
		{ID: "o3-mini",     Label: "o3-mini",      Provider: "OpenAI"},
		{ID: "o4-mini",     Label: "o4-mini",      Provider: "OpenAI"},
	},
	"gemini": {
		{ID: "gemini-2.5-pro",   Label: "Gemini 2.5 Pro",   Provider: "Google"},
		{ID: "gemini-2.5-flash", Label: "Gemini 2.5 Flash", Provider: "Google"},
		{ID: "gemini-2.0-flash", Label: "Gemini 2.0 Flash", Provider: "Google"},
	},
}

// ─── Settings file path ───────────────────────────────────────────────────────

func settingsPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".codepad", "settings.json")
}

// ─── Load / Save ──────────────────────────────────────────────────────────────

func Load() *Settings {
	path := settingsPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return defaultSettings()
	}
	var s Settings
	if err := json.Unmarshal(data, &s); err != nil {
		return defaultSettings()
	}
	if s.Providers == nil {
		s.Providers = map[string]ProviderConfig{}
	}
	return &s
}

func (s *Settings) Save() error {
	path := settingsPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

func defaultSettings() *Settings {
	return &Settings{
		Providers:    map[string]ProviderConfig{},
		DefaultModel: "claude-sonnet-4-6",
		EditorPath:   "code",
		Theme:        "dark",
	}
}

// ─── GetAvailableModels ───────────────────────────────────────────────────────

// GetAvailableModels returns all models for providers that have an API key
// configured. Ollama is always checked via local HTTP (no key required).
func (s *Settings) GetAvailableModels() []ModelInfo {
	var result []ModelInfo

	for providerKey, models := range catalogModels {
		cfg, ok := s.Providers[providerKey]
		if !ok || cfg.APIKey == "" {
			continue
		}
		result = append(result, models...)
	}

	// Ollama — dynamic, no key needed
	ollamaCfg := s.Providers["ollama"]
	baseURL := ollamaCfg.BaseURL
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	if models := fetchOllamaModels(baseURL); len(models) > 0 {
		result = append(result, models...)
	}

	return result
}

// ─── Ollama dynamic fetch ─────────────────────────────────────────────────────

type ollamaTagsResponse struct {
	Models []struct {
		Name string `json:"name"`
	} `json:"models"`
}

func fetchOllamaModels(baseURL string) []ModelInfo {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(baseURL + "/api/tags")
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var data ollamaTagsResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil
	}

	var models []ModelInfo
	for _, m := range data.Models {
		models = append(models, ModelInfo{
			ID:       m.Name,
			Label:    m.Name,
			Provider: "Ollama",
		})
	}
	return models
}

// ─── Provider helpers ─────────────────────────────────────────────────────────

func (s *Settings) SetProviderKey(provider, apiKey string) {
	if s.Providers == nil {
		s.Providers = map[string]ProviderConfig{}
	}
	cfg := s.Providers[provider]
	cfg.APIKey = apiKey
	cfg.Enabled = apiKey != ""
	s.Providers[provider] = cfg
}

func (s *Settings) GetProviderKey(provider string) string {
	if cfg, ok := s.Providers[provider]; ok {
		return cfg.APIKey
	}
	return ""
}

// LoadSettings kept for backwards compatibility with existing callers.
func LoadSettings() *Settings {
	return Load()
}
