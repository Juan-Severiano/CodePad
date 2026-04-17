package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"CodePad/internal/llm"
	"CodePad/internal/session"
	"CodePad/internal/tools"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type AgentLoop struct {
	provider      llm.Provider
	toolRegistry  *tools.Registry
	sessionStore  *session.Store
	ctx           context.Context
	wailsCtx      context.Context
}

func NewAgentLoop(provider llm.Provider, sessionStore *session.Store, ctx, wailsCtx context.Context) *AgentLoop {
	return &AgentLoop{
		provider:     provider,
		toolRegistry: tools.NewRegistry(),
		sessionStore: sessionStore,
		ctx:          ctx,
		wailsCtx:     wailsCtx,
	}
}

func (a *AgentLoop) Run(sessionID, prompt, workingDir, systemPrompt string) error {
	// Get or create session
	sess := a.sessionStore.GetSession(sessionID)
	if sess == nil {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	// Append user message
	if err := a.sessionStore.AppendMessage(sessionID, "user", prompt); err != nil {
		return err
	}

	// Build messages array from history
	messages := make([]llm.Message, 0)
	for _, msg := range sess.Messages {
		msgBytes, _ := json.Marshal(msg.Content)
		messages = append(messages, llm.Message{
			Role:    msg.Role,
			Content: msgBytes,
		})
	}

	// Mark session as running
	a.sessionStore.SetSessionStatus(sessionID, "running")

	// Get tool definitions
	toolDefs := a.toolRegistry.GetDefinitions()

	// Stream chat from provider
	opts := llm.StreamOptions{
		Model:        sess.Model,
		MaxTokens:    4096,
		SystemPrompt: systemPrompt,
	}

	eventChan, err := a.provider.StreamChat(a.ctx, messages, toolDefs, opts)
	if err != nil {
		runtime.EventsEmit(a.wailsCtx, "agent-error", map[string]interface{}{
			"session_id": sessionID,
			"error":      err.Error(),
		})
		a.sessionStore.SetSessionStatus(sessionID, "error")
		return err
	}

	var assistantContent strings.Builder
	var lastToolName string

	for event := range eventChan {
		switch event.Type {
		case "text":
			// Emit streaming text
			runtime.EventsEmit(a.wailsCtx, "agent-text", map[string]interface{}{
				"session_id": sessionID,
				"text":       event.Content,
			})
			assistantContent.WriteString(event.Content)

		case "tool_use":
			lastToolName = event.ToolUse.Name

			// Emit tool start
			runtime.EventsEmit(a.wailsCtx, "agent-tool-start", map[string]interface{}{
				"session_id": sessionID,
				"tool_name":  event.ToolUse.Name,
				"tool_id":    event.ToolUse.ID,
				"args":       string(event.ToolUse.Input),
			})

			// Execute tool
			output, execErr := a.toolRegistry.Execute(event.ToolUse.Name, event.ToolUse.Input, workingDir)
			if execErr != nil {
				output = fmt.Sprintf("Error: %v", execErr)
			}

			// Emit tool result
			runtime.EventsEmit(a.wailsCtx, "agent-tool-result", map[string]interface{}{
				"session_id": sessionID,
				"tool_name":  event.ToolUse.Name,
				"tool_id":    event.ToolUse.ID,
				"output":     output,
			})

			// Append tool result to messages for next iteration
			a.sessionStore.AppendMessage(sessionID, "user", fmt.Sprintf("[Tool %s result: %s]", lastToolName, output))

		case "done":
			// Save assistant response
			if assistantContent.Len() > 0 {
				a.sessionStore.AppendMessage(sessionID, "assistant", assistantContent.String())
			}

			// Emit done
			runtime.EventsEmit(a.wailsCtx, "agent-done", map[string]interface{}{
				"session_id":        sessionID,
				"input_tokens":      event.Usage.InputTokens,
				"completion_tokens": event.Usage.OutputTokens,
			})

			a.sessionStore.SetSessionStatus(sessionID, "done")

		case "error":
			runtime.EventsEmit(a.wailsCtx, "agent-error", map[string]interface{}{
				"session_id": sessionID,
				"error":      event.Error,
			})
			a.sessionStore.SetSessionStatus(sessionID, "error")
			return fmt.Errorf("agent error: %s", event.Error)
		}
	}

	return nil
}
