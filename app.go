package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"CodePad/internal/agent"
	"CodePad/internal/auth"
	"CodePad/internal/config"
	"CodePad/internal/cron"
	"CodePad/internal/git"
	"CodePad/internal/llm"
	"CodePad/internal/mcp"
	"CodePad/internal/memory"
	"CodePad/internal/pty"
	"CodePad/internal/session"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx             context.Context
	ptyManager      *pty.Manager
	gitManager      *git.Manager
	snapshotManager *memory.SnapshotManager
	mcpManager      *mcp.ClientManager
	cronScheduler   *cron.Scheduler
	sessionStore    *session.Store
	llmProvider     llm.Provider
	activeSessions  map[string]context.CancelFunc
	settings        *config.Settings
}

// NewApp creates a new App application struct
func NewApp() *App {
	sessionStore, _ := session.NewStore()
	settings := config.Load()

	// Auth priority: env vars / Claude CLI → settings file
	anthropicKey, anthropicBaseURL := "", ""
	if detected := auth.DetectAnthropicAuth(); detected != nil {
		anthropicKey = detected.APIKey
		anthropicBaseURL = detected.BaseURL
	} else if key := settings.GetProviderKey("anthropic"); key != "" {
		anthropicKey = key
	}

	a := &App{
		ptyManager:      pty.NewManager(),
		gitManager:      git.NewManager(),
		snapshotManager: memory.NewSnapshotManager(),
		mcpManager:      mcp.NewClientManager(),
		sessionStore:    sessionStore,
		settings:        settings,
		activeSessions:  make(map[string]context.CancelFunc),
		llmProvider:     llm.NewAnthropicProviderFull(anthropicKey, anthropicBaseURL, ""),
	}

	// Injeta a função do Agente no Scheduler para que as rotinas possam acioná-lo
	a.cronScheduler = cron.NewScheduler(func(taskDesc string, model string) (string, error) {
		// Create a new session for the routine
		return "", nil // TODO: implement routine execution
	})

	return a
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.ptyManager.SetContext(ctx)
	a.gitManager.SetContext(ctx)
	a.mcpManager.SetContext(ctx)
	a.cronScheduler.SetContext(ctx)
	runtime.LogInfo(a.ctx, "CodePad initialized")
}

// domReady is called after the front-end dom has been loaded
func (a *App) domReady(ctx context.Context) {
	runtime.LogInfo(a.ctx, "DOM ready. Ready to initialize modules.")
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	runtime.LogInfo(a.ctx, "CodePad shutting down")
	a.cronScheduler.Stop()
	// Cancel all active sessions
	for _, cancel := range a.activeSessions {
		cancel()
	}
}

// ==========================================
// CAMADA 1: MOTOR DE AGENTES & PTY BINDINGS
// ==========================================

func (a *App) StartAgentLoop(sessionID, prompt, workingDir string) error {
	runtime.LogInfof(a.ctx, "Starting Agent Loop for session: %s", sessionID)

	// Create cancellable context for this session
	ctx, cancel := context.WithCancel(a.ctx)
	a.activeSessions[sessionID] = cancel

	// Run agent loop in goroutine
	go func() {
		defer func() {
			delete(a.activeSessions, sessionID)
		}()

		agentLoop := agent.NewAgentLoop(a.llmProvider, a.sessionStore, ctx, a.ctx)
		if err := agentLoop.Run(sessionID, prompt, workingDir, ""); err != nil {
			runtime.EventsEmit(a.ctx, "agent-error", map[string]interface{}{
				"session_id": sessionID,
				"error":      err.Error(),
			})
		}
	}()

	return nil
}

func (a *App) CancelSession(sessionID string) error {
	if cancel, ok := a.activeSessions[sessionID]; ok {
		cancel()
		return nil
	}
	return fmt.Errorf("session not found")
}

func (a *App) SpawnPTY(sessionID string, cwd string) error {
	runtime.LogInfof(a.ctx, "Spawning PTY for session %s at %s", sessionID, cwd)
	return a.ptyManager.Spawn(sessionID, cwd, "")
}

func (a *App) WritePTY(sessionID string, input string) error {
	return a.ptyManager.Write(sessionID, input)
}

func (a *App) SetEnvironment(envType string, config map[string]interface{}) error {
	runtime.LogInfof(a.ctx, "Setting environment to %s", envType)
	return nil
}

// ==========================================
// CAMADA 2: MEMÓRIA & SEGURANÇA BINDINGS
// ==========================================

func (a *App) CreateGitWorktree(repoPath string, baseBranch string, newBranch string) (string, error) {
	runtime.LogInfof(a.ctx, "Creating git worktree for branch %s based on %s in %s", newBranch, baseBranch, repoPath)
	return a.gitManager.CreateWorktree(repoPath, baseBranch, newBranch)
}

func (a *App) RemoveGitWorktree(repoPath string, targetDir string) error {
	runtime.LogInfof(a.ctx, "Removing git worktree %s from %s", targetDir, repoPath)
	return a.gitManager.RemoveWorktree(repoPath, targetDir)
}

func (a *App) SnapshotFile(filePath string) (string, error) {
	runtime.LogInfof(a.ctx, "Creating snapshot for file %s", filePath)
	return a.snapshotManager.TakeSnapshot(filePath)
}

func (a *App) RestoreFile(filePath string, snapshotID string) error {
	runtime.LogInfof(a.ctx, "Restoring file %s from snapshot %s", filePath, snapshotID)
	return a.snapshotManager.RestoreSnapshot(filePath, snapshotID)
}

// ==========================================
// CAMADA 3: EXTENSIBILIDADE & BINDINGS
// ==========================================

// ConnectMCP inicia uma conexão com um servidor MCP local usando transporte via Stdio
func (a *App) ConnectMCP(serverID string, command string, args []string) error {
	runtime.LogInfof(a.ctx, "Connecting to MCP server %s via command: %s", serverID, command)
	return a.mcpManager.ConnectStdio(serverID, command, args)
}

// ScheduleRoutine agenda uma execução autônoma do agente
func (a *App) ScheduleRoutine(cronExpression string, scriptName string) error {
	runtime.LogInfof(a.ctx, "Scheduling routine %s with cron %s", scriptName, cronExpression)
	return a.cronScheduler.Schedule(cronExpression, scriptName)
}

// ==========================================
// PHASE 1: SESSION MANAGEMENT
// ==========================================

func (a *App) GetProjects() ([]session.Project, error) {
	if a.sessionStore == nil {
		return []session.Project{}, fmt.Errorf("session store not initialized")
	}
	return a.sessionStore.Projects, nil
}

func (a *App) CreateProject(name, workingDir string) (session.Project, error) {
	if a.sessionStore == nil {
		return session.Project{}, fmt.Errorf("session store not initialized")
	}
	return a.sessionStore.CreateProject(name, workingDir)
}

func (a *App) DeleteProject(projectID string) error {
	if a.sessionStore == nil {
		return fmt.Errorf("session store not initialized")
	}
	return a.sessionStore.DeleteProject(projectID)
}

func (a *App) GetSessions(projectID string) ([]session.Session, error) {
	if a.sessionStore == nil {
		return []session.Session{}, fmt.Errorf("session store not initialized")
	}
	sessions, ok := a.sessionStore.Sessions[projectID]
	if !ok {
		return []session.Session{}, fmt.Errorf("project not found")
	}
	return sessions, nil
}

func (a *App) CreateSession(projectID, title string) (session.Session, error) {
	if a.sessionStore == nil {
		return session.Session{}, fmt.Errorf("session store not initialized")
	}
	return a.sessionStore.CreateSession(projectID, title)
}

func (a *App) DeleteSession(sessionID string) error {
	if a.sessionStore == nil {
		return fmt.Errorf("session store not initialized")
	}
	return a.sessionStore.DeleteSession(sessionID)
}

func (a *App) GetSessionMessages(sessionID string) ([]session.Message, error) {
	if a.sessionStore == nil {
		return []session.Message{}, fmt.Errorf("session store not initialized")
	}
	sess := a.sessionStore.GetSession(sessionID)
	if sess == nil {
		return []session.Message{}, fmt.Errorf("session not found")
	}
	return sess.Messages, nil
}

func (a *App) ResumeSession(sessionID string) error {
	if a.sessionStore == nil {
		return fmt.Errorf("session store not initialized")
	}
	sess := a.sessionStore.GetSession(sessionID)
	if sess == nil {
		return fmt.Errorf("session not found")
	}
	return a.sessionStore.SetSessionStatus(sessionID, "running")
}

func (a *App) OpenInEditor(filePath, editor string) error {
	if editor == "" {
		editor = "code"
	}
	cmd := exec.Command(editor, filePath)
	return cmd.Start()
}

func (a *App) PickDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Project Folder",
		CanCreateDirectories: false,
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// GetAvailableModels returns models for all configured providers.
// Ollama is always checked (no key needed).
func (a *App) GetAvailableModels() []config.ModelInfo {
	return a.settings.GetAvailableModels()
}

// GetProviderKeys returns a map of provider -> masked api key (shows last 4 chars).
func (a *App) GetProviderKeys() map[string]string {
	result := map[string]string{}
	for _, provider := range []string{"anthropic", "openai", "gemini", "ollama"} {
		key := a.settings.GetProviderKey(provider)
		if key != "" && len(key) > 4 {
			result[provider] = "••••" + key[len(key)-4:]
		} else if key != "" {
			result[provider] = "••••"
		} else {
			result[provider] = ""
		}
	}
	return result
}

// SaveProviderKey saves an API key for a provider and persists to disk.
// Pass empty string to remove the key.
func (a *App) SaveProviderKey(provider, apiKey string) error {
	a.settings.SetProviderKey(provider, apiKey)
	if err := a.settings.Save(); err != nil {
		return err
	}
	// Hot-reload the Anthropic provider if that key changed
	if provider == "anthropic" {
		a.llmProvider = llm.NewAnthropicProvider(apiKey, "")
	}
	return nil
}

// GetAuthStatus returns auth detection results for all providers.
// Called by the frontend on startup to populate the settings panel.
func (a *App) GetAuthStatus() map[string]interface{} {
	result := map[string]interface{}{}

	type providerCheck struct {
		name    string
		detect  func() *auth.ProviderAuth
		settKey string
	}

	checks := []providerCheck{
		{"anthropic", auth.DetectAnthropicAuth, "anthropic"},
		{"openai", auth.DetectOpenAIAuth, "openai"},
		{"gemini", auth.DetectGeminiAuth, "gemini"},
	}

	for _, c := range checks {
		detected := c.detect()
		if detected != nil {
			result[c.name] = map[string]interface{}{
				"configured": true,
				"source":     string(detected.Source),
				"masked":     detected.Masked,
				"base_url":   detected.BaseURL,
			}
		} else if key := a.settings.GetProviderKey(c.settKey); key != "" {
			result[c.name] = map[string]interface{}{
				"configured": true,
				"source":     "settings",
				"masked":     auth.MaskKey(key),
				"base_url":   "",
			}
		} else {
			result[c.name] = map[string]interface{}{
				"configured": false,
				"source":     "none",
				"masked":     "",
				"base_url":   "",
			}
		}
	}

	// Ollama — check if server is reachable
	ollamaModels := a.settings.GetAvailableModels()
	ollamaRunning := false
	for _, m := range ollamaModels {
		if m.Provider == "Ollama" {
			ollamaRunning = true
			break
		}
	}
	result["ollama"] = map[string]interface{}{
		"configured": ollamaRunning,
		"source":     "local",
		"masked":     "",
		"base_url":   "http://localhost:11434",
	}

	return result
}

// TestProviderConnection tests the currently configured key for a provider.
func (a *App) TestProviderConnection(provider string) error {
	switch provider {
	case "anthropic":
		return a.llmProvider.TestConnection()
	default:
		return fmt.Errorf("provider %q not supported for connection test yet", provider)
	}
}

func (a *App) GetSettings() (map[string]interface{}, error) {
	providers := map[string]interface{}{}
	for k, v := range a.settings.Providers {
		providers[k] = map[string]interface{}{
			"enabled":  v.Enabled,
			"base_url": v.BaseURL,
		}
	}
	return map[string]interface{}{
		"providers":     providers,
		"default_model": a.settings.DefaultModel,
		"editor_path":   a.settings.EditorPath,
		"theme":         a.settings.Theme,
	}, nil
}

func (a *App) SaveSettings(settings map[string]interface{}) error {
	if model, ok := settings["default_model"].(string); ok {
		a.settings.DefaultModel = model
	}
	if editor, ok := settings["editor_path"].(string); ok {
		a.settings.EditorPath = editor
	}
	return a.settings.Save()
}

func (a *App) ListDirectory(path string) ([]map[string]interface{}, error) {
	entries := make([]map[string]interface{}, 0)
	files, err := os.ReadDir(path)
	if err != nil {
		return entries, err
	}

	for _, file := range files {
		entries = append(entries, map[string]interface{}{
			"name":   file.Name(),
			"is_dir": file.IsDir(),
		})
	}

	return entries, nil
}

func (a *App) ReadFileContent(path string) (string, error) {
	content, err := os.ReadFile(path)
	return string(content), err
}

func (a *App) GetGitBranch(path string) (string, error) {
	cmd := exec.Command("git", "-C", path, "rev-parse", "--abbrev-ref", "HEAD")
	out, err := cmd.Output()
	if err != nil {
		return "", nil
	}
	return strings.TrimSpace(string(out)), nil
}

func (a *App) GetGitBranches(path string) ([]string, error) {
	cmd := exec.Command("git", "-C", path, "branch", "--format=%(refname:short)")
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}
	var branches []string
	for _, b := range strings.Split(string(out), "\n") {
		b = strings.TrimSpace(b)
		if b != "" {
			branches = append(branches, b)
		}
	}
	return branches, nil
}

func (a *App) CheckoutGitBranch(path, branch string) error {
	cmd := exec.Command("git", "-C", path, "checkout", branch)
	return cmd.Run()
}

func (a *App) CreateGitBranch(path, newBranch string) error {
	cmd := exec.Command("git", "-C", path, "checkout", "-b", newBranch)
	return cmd.Run()
}

func (a *App) PickImage() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Image",
		Filters: []runtime.FileFilter{
			{DisplayName: "Images", Pattern: "*.png;*.jpg;*.jpeg;*.gif;*.webp"},
		},
	})
	if err != nil {
		return "", err
	}
	return file, nil
}

func (a *App) LoginWithClaude() (string, error) {
	key, err := auth.PerformClaudeOAuth(a.ctx)
	if err != nil {
		return "", err
	}
	err = a.SaveProviderKey("anthropic", key)
	if err != nil {
		return "", fmt.Errorf("failed to save key: %v", err)
	}
	return key, nil
}

func (a *App) GetRecentDirectories() []string {
	if a.sessionStore == nil {
		return []string{}
	}
	return a.sessionStore.GetRecentDirectories()
}

func (a *App) CreateProjectFromDir(workingDir string) (session.Project, error) {
	if a.sessionStore == nil {
		return session.Project{}, fmt.Errorf("session store not initialized")
	}
	name := workingDir
	parts := strings.Split(strings.TrimRight(workingDir, "/"), "/")
	if len(parts) > 0 {
		name = parts[len(parts)-1]
	}
	a.sessionStore.AddRecentDir(workingDir)
	return a.sessionStore.CreateProject(name, workingDir)
}
