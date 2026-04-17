package tools

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type GlobTool struct{}

func NewGlobTool() *GlobTool {
	return &GlobTool{}
}

func (t *GlobTool) Name() string {
	return "Glob"
}

func (t *GlobTool) Description() string {
	return "Find files matching a glob pattern. Returns file paths matching the pattern."
}

func (t *GlobTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"pattern": map[string]interface{}{
				"type":        "string",
				"description": "Glob pattern (e.g., '**/*.ts', '*.go')",
			},
		},
		"required": []string{"pattern"},
	}
}

type GlobInput struct {
	Pattern string `json:"pattern"`
}

func (t *GlobTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var globInput GlobInput
	if err := json.Unmarshal(input, &globInput); err != nil {
		return "", ErrInvalidInput
	}

	// Use filepath.Match with recursive walk
	matches := make([]string, 0)

	filepath.Walk(workingDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		relPath, _ := filepath.Rel(workingDir, path)
		matched, _ := filepath.Match(globInput.Pattern, relPath)
		if matched {
			matches = append(matches, relPath)
		}

		return nil
	})

	if len(matches) == 0 {
		return "No files matching pattern", nil
	}

	return strings.Join(matches, "\n"), nil
}

// GrepTool searches file contents
type GrepTool struct{}

func NewGrepTool() *GrepTool {
	return &GrepTool{}
}

func (t *GrepTool) Name() string {
	return "Grep"
}

func (t *GrepTool) Description() string {
	return "Search for text or regex patterns in files. Returns matching lines with file paths and line numbers."
}

func (t *GrepTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"pattern": map[string]interface{}{
				"type":        "string",
				"description": "Regex pattern to search for",
			},
			"glob": map[string]interface{}{
				"type":        "string",
				"description": "Optional: file glob pattern (default: all files)",
			},
		},
		"required": []string{"pattern"},
	}
}

type GrepInput struct {
	Pattern string `json:"pattern"`
	Glob    string `json:"glob,omitempty"`
}

func (t *GrepTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var grepInput GrepInput
	if err := json.Unmarshal(input, &grepInput); err != nil {
		return "", ErrInvalidInput
	}

	// For now, use grep via command line (more robust)
	cmd := exec.Command("grep", "-r", "-n", grepInput.Pattern, workingDir)
	output, _ := cmd.CombinedOutput()

	// grep returns non-zero if no matches found (but not an error)
	return string(output), nil
}

// WebFetchTool fetches a URL
type WebFetchTool struct{}

func NewWebFetchTool() *WebFetchTool {
	return &WebFetchTool{}
}

func (t *WebFetchTool) Name() string {
	return "WebFetch"
}

func (t *WebFetchTool) Description() string {
	return "Fetch and read a URL. Returns the page content as text."
}

func (t *WebFetchTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"url": map[string]interface{}{
				"type":        "string",
				"description": "The URL to fetch",
			},
		},
		"required": []string{"url"},
	}
}

type WebFetchInput struct {
	URL string `json:"url"`
}

func (t *WebFetchTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var fetchInput WebFetchInput
	if err := json.Unmarshal(input, &fetchInput); err != nil {
		return "", ErrInvalidInput
	}

	// Use curl for simplicity
	cmd := exec.Command("curl", "-s", fetchInput.URL)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %w", err)
	}

	return string(output), nil
}
