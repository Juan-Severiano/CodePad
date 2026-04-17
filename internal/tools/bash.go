package tools

import (
	"bytes"
	"encoding/json"
	"os/exec"
	"time"
)

type BashTool struct{}

func NewBashTool() *BashTool {
	return &BashTool{}
}

func (t *BashTool) Name() string {
	return "Bash"
}

func (t *BashTool) Description() string {
	return "Execute shell commands in the working directory. Use for running scripts, git commands, npm/cargo, or any CLI tools."
}

func (t *BashTool) InputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"command": map[string]interface{}{
				"type":        "string",
				"description": "The shell command to execute",
			},
		},
		"required": []string{"command"},
	}
}

type BashInput struct {
	Command string `json:"command"`
}

func (t *BashTool) Execute(input json.RawMessage, workingDir string) (string, error) {
	var bashInput BashInput
	if err := json.Unmarshal(input, &bashInput); err != nil {
		return "", ErrInvalidInput
	}

	cmd := exec.Command("sh", "-c", bashInput.Command)
	cmd.Dir = workingDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Set a timeout
	done := make(chan error, 1)
	go func() {
		done <- cmd.Run()
	}()

	select {
	case err := <-done:
		output := stdout.String()
		if stderr.Len() > 0 {
			output += "\nSTDERR:\n" + stderr.String()
		}
		if err != nil {
			output += "\nError: " + err.Error()
		}
		return output, nil
	case <-time.After(30 * time.Second):
		cmd.Process.Kill()
		return "", ErrToolNotFound // timeout
	}
}
