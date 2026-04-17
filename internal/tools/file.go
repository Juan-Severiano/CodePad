package tools

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"CodePad/internal/memory"
)

type ReadFileTool struct{}

func NewReadFileTool() *ReadFileTool {
	return &ReadFileTool{}
}

func (t *ReadFileTool) Name() string {
	return "ReadFile"
}

func (t *ReadFileTool) Description() string {
	return "Read a file's contents. Supports reading specific line ranges with start_line and end_line."
}

func (t *ReadFileTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the file to read",
			},
			"start_line": map[string]interface{}{
				"type":        "integer",
				"description": "Optional: start line number (1-based)",
			},
			"end_line": map[string]interface{}{
				"type":        "integer",
				"description": "Optional: end line number (1-based)",
			},
		},
		"required": []string{"path"},
	}
}

type ReadFileInput struct {
	Path      string `json:"path"`
	StartLine int    `json:"start_line,omitempty"`
	EndLine   int    `json:"end_line,omitempty"`
}

func (t *ReadFileTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var readInput ReadFileInput
	if err := json.Unmarshal(input, &readInput); err != nil {
		return "", ErrInvalidInput
	}

	path := readInput.Path
	if !filepath.IsAbs(path) {
		path = filepath.Join(workingDir, path)
	}

	content, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	lines := strings.Split(string(content), "\n")

	// Apply line range if specified
	if readInput.StartLine > 0 || readInput.EndLine > 0 {
		start := readInput.StartLine - 1
		end := len(lines)
		if readInput.EndLine > 0 {
			end = readInput.EndLine
		}

		if start < 0 {
			start = 0
		}
		if end > len(lines) {
			end = len(lines)
		}
		if start < end {
			lines = lines[start:end]
		}
	}

	return strings.Join(lines, "\n"), nil
}

// WriteFileTool creates or overwrites a file
type WriteFileTool struct {
	snapshotManager *memory.SnapshotManager
}

func NewWriteFileTool() *WriteFileTool {
	return &WriteFileTool{
		snapshotManager: memory.NewSnapshotManager(),
	}
}

func (t *WriteFileTool) Name() string {
	return "WriteFile"
}

func (t *WriteFileTool) Description() string {
	return "Create or completely overwrite a file with new content. The file is automatically snapshotted before writing."
}

func (t *WriteFileTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the file to write",
			},
			"content": map[string]interface{}{
				"type":        "string",
				"description": "The new file content",
			},
		},
		"required": []string{"path", "content"},
	}
}

type WriteFileInput struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

func (t *WriteFileTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var writeInput WriteFileInput
	if err := json.Unmarshal(input, &writeInput); err != nil {
		return "", ErrInvalidInput
	}

	path := writeInput.Path
	if !filepath.IsAbs(path) {
		path = filepath.Join(workingDir, path)
	}

	// Create parent directories if needed
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Snapshot existing file if it exists
	if _, err := os.Stat(path); err == nil {
		t.snapshotManager.TakeSnapshot(path)
	}

	// Write file
	if err := os.WriteFile(path, []byte(writeInput.Content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("File written: %s (%d bytes)", path, len(writeInput.Content)), nil
}

// EditFileTool makes surgical edits to a file
type EditFileTool struct {
	snapshotManager *memory.SnapshotManager
}

func NewEditFileTool() *EditFileTool {
	return &EditFileTool{
		snapshotManager: memory.NewSnapshotManager(),
	}
}

func (t *EditFileTool) Name() string {
	return "EditFile"
}

func (t *EditFileTool) Description() string {
	return "Make surgical edits to a file by replacing specific old_string with new_string. The old_string must be unique in the file."
}

func (t *EditFileTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"path": map[string]interface{}{
				"type":        "string",
				"description": "Path to the file",
			},
			"old_string": map[string]interface{}{
				"type":        "string",
				"description": "The text to find (must be unique)",
			},
			"new_string": map[string]interface{}{
				"type":        "string",
				"description": "The replacement text",
			},
		},
		"required": []string{"path", "old_string", "new_string"},
	}
}

type EditFileInput struct {
	Path      string `json:"path"`
	OldString string `json:"old_string"`
	NewString string `json:"new_string"`
}

func (t *EditFileTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var editInput EditFileInput
	if err := json.Unmarshal(input, &editInput); err != nil {
		return "", ErrInvalidInput
	}

	path := editInput.Path
	if !filepath.IsAbs(path) {
		path = filepath.Join(workingDir, path)
	}

	// Read current content
	content, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// Snapshot before editing
	t.snapshotManager.TakeSnapshot(path)

	contentStr := string(content)
	if strings.Count(contentStr, editInput.OldString) != 1 {
		return "", fmt.Errorf("old_string not found or not unique in file")
	}

	newContent := strings.Replace(contentStr, editInput.OldString, editInput.NewString, 1)

	// Write updated content
	if err := os.WriteFile(path, []byte(newContent), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("File edited: %s", path), nil
}
