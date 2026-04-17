package pty

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Session struct {
	ID  string
	Cmd *exec.Cmd
	PTY *os.File
}

type Manager struct {
	ctx      context.Context
	sessions map[string]*Session
	mu       sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
	}
}

func (m *Manager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

func (m *Manager) Spawn(sessionID string, cwd string, shell string) error {
	if shell == "" {
		shell = os.Getenv("SHELL")
		if shell == "" {
			shell = "/bin/sh"
		}
	}

	cmd := exec.Command(shell)
	if cwd != "" {
		cmd.Dir = cwd
	}

	// Inicia o processo no PTY
	ptyFile, err := pty.Start(cmd)
	if err != nil {
		return fmt.Errorf("failed to start pty: %w", err)
	}

	session := &Session{
		ID:  sessionID,
		Cmd: cmd,
		PTY: ptyFile,
	}

	m.mu.Lock()
	m.sessions[sessionID] = session
	m.mu.Unlock()

	// Inicia a leitura do PTY em background
	go m.readLoop(session)

	// Lida com o fechamento do processo
	go func() {
		defer ptyFile.Close()
		cmd.Wait()
		m.mu.Lock()
		delete(m.sessions, sessionID)
		m.mu.Unlock()
		if m.ctx != nil {
			runtime.EventsEmit(m.ctx, fmt.Sprintf("pty-exit:%s", sessionID))
		}
	}()

	return nil
}

func (m *Manager) readLoop(session *Session) {
	buf := make([]byte, 1024)
	for {
		n, err := session.PTY.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			break
		}

		if n > 0 && m.ctx != nil {
			output := string(buf[:n])
			// Emite o evento do wails no formato "pty-data:{sessionID}"
			runtime.EventsEmit(m.ctx, fmt.Sprintf("pty-data:%s", session.ID), output)
		}
	}
}

func (m *Manager) Write(sessionID string, data string) error {
	m.mu.RLock()
	session, exists := m.sessions[sessionID]
	m.mu.RUnlock()

	if !exists {
		return fmt.Errorf("pty session %s not found", sessionID)
	}

	_, err := session.PTY.WriteString(data)
	return err
}
