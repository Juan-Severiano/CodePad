package tools

import (
	"encoding/json"

	"CodePad/internal/llm"
)

type Tool interface {
	Name() string
	Description() string
	InputSchema() map[string]interface{}
	Execute(input json.RawMessage, workingDir string) (string, error)
}

type Registry struct {
	tools map[string]Tool
}

func NewRegistry() *Registry {
	r := &Registry{
		tools: make(map[string]Tool),
	}

	// Register all built-in tools
	r.Register(NewBashTool())
	r.Register(NewReadFileTool())
	r.Register(NewWriteFileTool())
	r.Register(NewEditFileTool())
	r.Register(NewGlobTool())
	r.Register(NewGrepTool())
	r.Register(NewWebFetchTool())

	return r
}

func (r *Registry) Register(tool Tool) {
	r.tools[tool.Name()] = tool
}

func (r *Registry) GetDefinitions() []llm.ToolDefinition {
	defs := make([]llm.ToolDefinition, 0)
	for _, tool := range r.tools {
		defs = append(defs, llm.ToolDefinition{
			Name:        tool.Name(),
			Description: tool.Description(),
			InputSchema: tool.InputSchema(),
		})
	}
	return defs
}

func (r *Registry) Execute(name string, input json.RawMessage, workingDir string) (string, error) {
	tool, ok := r.tools[name]
	if !ok {
		return "", ErrToolNotFound
	}
	return tool.Execute(input, workingDir)
}
