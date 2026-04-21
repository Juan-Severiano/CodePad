package auth

import (
	"bufio"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthSource string

const (
	SourceEnv       AuthSource = "env"
	SourceClaudeCLI AuthSource = "claude-cli"
	SourceSettings  AuthSource = "settings"
	SourceNone      AuthSource = "none"
)

type ProviderAuth struct {
	APIKey  string
	BaseURL string
	Source  AuthSource
	Masked  string // "sk-ant-...k3y8" — safe to show in UI
}

// ─── Public detection functions ───────────────────────────────────────────────

// DetectAnthropicAuth checks, in order:
//  1. ANTHROPIC_API_KEY env var
//  2. Claude CLI session-env files (~/.claude/session-env/)
//
// Returns nil if nothing found.
func DetectAnthropicAuth() *ProviderAuth {
	// 1. Env vars (highest priority)
	if key := os.Getenv("ANTHROPIC_API_KEY"); key != "" {
		return &ProviderAuth{
			APIKey:  key,
			BaseURL: os.Getenv("ANTHROPIC_BASE_URL"),
			Source:  SourceEnv,
			Masked:  maskKey(key),
		}
	}

	// 2. Claude CLI session files
	if key, baseURL := readClaudeCLIKey("ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"); key != "" {
		return &ProviderAuth{
			APIKey:  key,
			BaseURL: baseURL,
			Source:  SourceClaudeCLI,
			Masked:  maskKey(key),
		}
	}

	return nil
}

// DetectOpenAIAuth checks OPENAI_API_KEY env var, then Claude CLI session files.
func DetectOpenAIAuth() *ProviderAuth {
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		return &ProviderAuth{
			APIKey:  key,
			BaseURL: os.Getenv("OPENAI_BASE_URL"),
			Source:  SourceEnv,
			Masked:  maskKey(key),
		}
	}

	if key, baseURL := readClaudeCLIKey("OPENAI_API_KEY", "OPENAI_BASE_URL"); key != "" {
		return &ProviderAuth{
			APIKey:  key,
			BaseURL: baseURL,
			Source:  SourceClaudeCLI,
			Masked:  maskKey(key),
		}
	}

	return nil
}

// DetectGeminiAuth checks GOOGLE_API_KEY or GEMINI_API_KEY env vars.
func DetectGeminiAuth() *ProviderAuth {
	for _, envKey := range []string{"GEMINI_API_KEY", "GOOGLE_API_KEY"} {
		if key := os.Getenv(envKey); key != "" {
			return &ProviderAuth{
				APIKey: key,
				Source: SourceEnv,
				Masked: maskKey(key),
			}
		}
	}
	return nil
}

// ─── Claude CLI session-env reader ───────────────────────────────────────────

// readClaudeCLIKey reads the most recently modified file in ~/.claude/session-env/
// and looks for the given env variable name (and optionally a baseURL var).
// Returns ("", "") if not found or an error occurs.
func readClaudeCLIKey(keyVar, urlVar string) (apiKey, baseURL string) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", ""
	}

	sessDir := filepath.Join(home, ".claude", "session-env")
	entries, err := os.ReadDir(sessDir)
	if err != nil {
		return "", ""
	}

	// Sort by modification time descending — use the newest file
	type entry struct {
		path    string
		modTime time.Time
	}
	var files []entry
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, entry{
			path:    filepath.Join(sessDir, e.Name()),
			modTime: info.ModTime(),
		})
	}
	sort.Slice(files, func(i, j int) bool {
		return files[i].modTime.After(files[j].modTime)
	})

	for _, f := range files {
		k, u := parseEnvFile(f.path, keyVar, urlVar)
		if k != "" {
			return k, u
		}
	}
	return "", ""
}

// parseEnvFile reads a file and looks for KEY=value pairs (shell-style).
// Handles both plain `KEY=value` and JSON `{"KEY": "value"}` formats.
func parseEnvFile(path, keyVar, urlVar string) (apiKey, baseURL string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", ""
	}

	content := strings.TrimSpace(string(data))
	if content == "" {
		return "", ""
	}

	// Try shell KEY=value format
	scanner := bufio.NewScanner(strings.NewReader(content))
	vars := map[string]string{}
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.IndexByte(line, '=')
		if idx < 0 {
			continue
		}
		k := strings.TrimSpace(line[:idx])
		v := strings.TrimSpace(line[idx+1:])
		// Strip surrounding quotes
		if len(v) >= 2 && ((v[0] == '"' && v[len(v)-1] == '"') || (v[0] == '\'' && v[len(v)-1] == '\'')) {
			v = v[1 : len(v)-1]
		}
		vars[k] = v
	}

	return vars[keyVar], vars[urlVar]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// maskKey returns a display-safe masked version: first 8 chars + "..." + last 4.
func maskKey(key string) string {
	if len(key) <= 12 {
		return "••••"
	}
	return key[:8] + "..." + key[len(key)-4:]
}

// MaskKey is exported for use in app.go.
func MaskKey(key string) string {
	return maskKey(key)
}
