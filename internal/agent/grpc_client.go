package agent

import (
	"context"
	"fmt"
	"os"

	pb "CodePad/internal/grpc/openclaude"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type GrpcClient struct {
	ctx        context.Context
	conn       *grpc.ClientConn
	client     pb.AgentServiceClient
	stream     pb.AgentService_ChatClient
}

func NewGrpcClient(ctx context.Context) (*GrpcClient, error) {
	conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to dial grpc: %w", err)
	}

	client := pb.NewAgentServiceClient(conn)
	return &GrpcClient{
		ctx:    ctx,
		conn:   conn,
		client: client,
	}, nil
}

func (g *GrpcClient) Close() {
	if g.conn != nil {
		g.conn.Close()
	}
}

// StartSession initiates the chat stream with the given prompt
func (g *GrpcClient) StartSession(sessionID, prompt string) error {
	stream, err := g.client.Chat(g.ctx)
	if err != nil {
		return fmt.Errorf("failed to create stream: %w", err)
	}
	g.stream = stream

	cwd, _ := os.Getwd()

	// Send initial ChatRequest
	req := &pb.ClientMessage{
		Payload: &pb.ClientMessage_Request{
			Request: &pb.ChatRequest{
				Message:          prompt,
				WorkingDirectory: cwd,
				SessionId:        sessionID,
			},
		},
	}

	if err := stream.Send(req); err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}

	// Start listening to the server stream in a goroutine
	go g.listen()

	return nil
}

// SendUserInput sends an answer (e.g., "y" or "n") back to the server
func (g *GrpcClient) SendUserInput(promptID, reply string) error {
	if g.stream == nil {
		return fmt.Errorf("no active stream")
	}

	req := &pb.ClientMessage{
		Payload: &pb.ClientMessage_Input{
			Input: &pb.UserInput{
				Reply:    reply,
				PromptId: promptID,
			},
		},
	}

	return g.stream.Send(req)
}

func (g *GrpcClient) listen() {
	for {
		msg, err := g.stream.Recv()
		if err != nil {
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Error",
				"message":    fmt.Sprintf("Stream closed: %v", err),
				"session_id": "global",
			})
			return
		}

		// Map ServerMessage events to Wails events
		switch event := msg.Event.(type) {
		case *pb.ServerMessage_TextChunk:
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Thinking",
				"message":    event.TextChunk.Text,
				"session_id": "global",
			})
		case *pb.ServerMessage_ToolStart:
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Executing",
				"message":    fmt.Sprintf("Executing tool: %s\nArgs: %s", event.ToolStart.ToolName, event.ToolStart.ArgumentsJson),
				"session_id": "global",
			})
		case *pb.ServerMessage_ToolResult:
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Executing",
				"message":    fmt.Sprintf("Output from %s:\n%s", event.ToolResult.ToolName, event.ToolResult.Output),
				"session_id": "global",
			})
		case *pb.ServerMessage_ActionRequired:
			// Emit a specific event for the UI to show the ActionModal
			runtime.EventsEmit(g.ctx, "action-required", map[string]interface{}{
				"prompt_id": event.ActionRequired.PromptId,
				"question":  event.ActionRequired.Question,
				"type":      event.ActionRequired.Type.String(),
			})
		case *pb.ServerMessage_Done:
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Done",
				"message":    fmt.Sprintf("Completed. Tokens: %d prompt / %d completion", event.Done.PromptTokens, event.Done.CompletionTokens),
				"session_id": "global",
			})
			return // End of stream
		case *pb.ServerMessage_Error:
			runtime.EventsEmit(g.ctx, "agent-status", map[string]interface{}{
				"state":      "Error",
				"message":    fmt.Sprintf("[%s] %s", event.Error.Code, event.Error.Message),
				"session_id": "global",
			})
			return
		}
	}
}
