package llm

import (
	"context"
	"encoding/json"
)

type Provider interface {
	StreamChat(ctx context.Context, messages []Message, tools []ToolDefinition, opts StreamOptions) (<-chan StreamEvent, error)
	TestConnection() error
}

type Message struct {
	Role    string          `json:"role"`    // "user" | "assistant"
	Content json.RawMessage `json:"content"` // can be string or []ContentBlock
}

type ContentBlock struct {
	Type string          `json:"type"` // "text" | "tool_use"
	Text string          `json:"text,omitempty"`
	ID   string          `json:"id,omitempty"`
	Name string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`
}

type ToolDefinition struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	InputSchema map[string]interface{} `json:"input_schema"`
}

type StreamOptions struct {
	Model         string
	MaxTokens     int
	SystemPrompt  string
	BudgetTokens  int // for thinking models
	Temperature   float64
}

type StreamEvent struct {
	Type    string          // "text" | "tool_use" | "tool_result" | "done" | "error"
	Content string          // for text events
	ToolUse *ToolUseEvent   // for tool_use events
	Usage   *Usage          // for done event
	Error   string          // for error event
}

type ToolUseEvent struct {
	ID    string          `json:"id"`
	Name  string          `json:"name"`
	Input json.RawMessage `json:"input"`
}

type Usage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}
