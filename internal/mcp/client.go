package mcp

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"sync"
)

type ClientManager struct {
	ctx     context.Context
	servers map[string]*exec.Cmd
	mu      sync.RWMutex
}

func NewClientManager() *ClientManager {
	return &ClientManager{
		servers: make(map[string]*exec.Cmd),
	}
}

func (m *ClientManager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

// ConnectStdio connects to an MCP server using Stdio JSON-RPC.
func (m *ClientManager) ConnectStdio(serverID string, command string, args []string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.servers[serverID]; exists {
		return fmt.Errorf("MCP server %s is already running", serverID)
	}

	cmd := exec.Command(command, args...)
	
	// Configura os pipes Stdio (padrão do protocolo MCP)
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	
	// O protocolo MCP se comunica via JSON-RPC por stdout/stdin
	// Aqui apenas inicializamos o processo. Em uma implementação real do protocolo,
	// atrelaríamos um JSON-RPC client ao `stdout` e `stdin`.
	
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start MCP server: %v", err)
	}

	m.servers[serverID] = cmd

	// Goroutine dummy para não bloquear o pipe do stdout
	go func() {
		defer stdin.Close()
		io.Copy(io.Discard, stdout)
		cmd.Wait()
		m.mu.Lock()
		delete(m.servers, serverID)
		m.mu.Unlock()
	}()

	return nil
}
