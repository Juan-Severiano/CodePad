package git

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
)

type Manager struct {
	ctx context.Context
}

func NewManager() *Manager {
	return &Manager{}
}

func (m *Manager) SetContext(ctx context.Context) {
	m.ctx = ctx
}

func (m *Manager) CreateWorktree(repoPath string, baseBranch string, newBranch string) (string, error) {
	// targetDir fica no /tmp para ficar invisível para a IDE original do usuário
	targetDir := filepath.Join("/tmp", "openagent-worktrees", filepath.Base(repoPath)+"-"+newBranch)

	// Primeiro tenta criar a branch nova baseada na branch base e atrelar à worktree
	cmd := exec.Command("git", "worktree", "add", "-b", newBranch, targetDir, baseBranch)
	cmd.Dir = repoPath

	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to create worktree: %v, out: %s", err, string(out))
	}

	return targetDir, nil
}

func (m *Manager) RemoveWorktree(repoPath string, targetDir string) error {
	cmd := exec.Command("git", "worktree", "remove", "--force", targetDir)
	cmd.Dir = repoPath

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove worktree: %v, out: %s", err, string(out))
	}

	return nil
}

func (m *Manager) MergeWorktree(repoPath string, newBranch string) error {
	cmd := exec.Command("git", "merge", newBranch)
	cmd.Dir = repoPath

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to merge branch %s: %v, out: %s", newBranch, err, string(out))
	}

	// Remove branch local após merge
	exec.Command("git", "branch", "-d", newBranch).Run()

	return nil
}
