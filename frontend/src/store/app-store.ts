import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  working_dir: string;
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  status: 'running' | 'done' | 'error';
  model: string;
}

export interface AgentEvent {
  id: string;
  type: 'user_input' | 'agent_text' | 'agent_tool_start' | 'agent_tool_result' | 'agent_done' | 'agent_error';
  content: string;
  toolName?: string;
  toolId?: string;
  timestamp: number;
}

export type AgentMode = 'auto' | 'accept-edits' | 'ask';

export interface ProviderAuthStatus {
  configured: boolean;
  source: 'env' | 'claude-cli' | 'settings' | 'local' | 'none';
  masked: string;
  base_url?: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  provider: string;
}

interface AppState {
  // Projects & Sessions
  projects: Project[];
  sessions: Record<string, Session[]>;
  activeProject: Project | null;
  activeSession: Session | null;

  // Chat & Events
  chatHistory: AgentEvent[];
  currentTokens: { input: number; output: number };

  // Auth
  authStatus: Record<string, ProviderAuthStatus> | null;

  // Agent Mode & Model
  agentMode: AgentMode;
  selectedModel: string;
  availableModels: ModelInfo[];
  gitBranch: string;
  gitBranches: string[];
  recentDirs: string[];
  attachedImages: string[];

  // UI State
  leftSidebarOpen: boolean;
  terminalOpen: boolean;
  tasksOpen: boolean;
  settingsOpen: boolean;
  newSessionDialogOpen: boolean;

  // Actions - Projects
  loadProjects: () => Promise<void>;
  createProject: (name: string, workingDir: string) => Promise<Project | undefined>;
  createProjectFromDir: (workingDir: string) => Promise<Project | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
  setActiveProject: (project: Project | null) => void;

  // Actions - Sessions
  loadSessions: (projectId: string) => Promise<void>;
  createSession: (projectId: string, title: string, model: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setActiveSession: (session: Session | null) => void;
  loadSessionMessages: (sessionId: string) => Promise<void>;

  // Actions - Chat
  addChatEvent: (event: AgentEvent) => void;
  submitPrompt: (prompt: string) => Promise<void>;
  clearChat: () => void;

  // Actions - Agent Mode
  // Auth actions
  loadAuthStatus: () => Promise<void>;
  saveProviderKey: (provider: string, key: string) => Promise<void>;
  testProviderConnection: (provider: string) => Promise<string>;

  cycleMode: () => void;
  setAgentMode: (mode: AgentMode) => void;
  setSelectedModel: (model: string) => void;
  loadAvailableModels: () => Promise<void>;
  loadRecentDirs: () => Promise<void>;
  detectGitBranch: (path: string) => Promise<void>;
  loadGitBranches: (path: string) => Promise<void>;
  checkoutBranch: (branch: string) => Promise<void>;
  createBranch: (branch: string) => Promise<void>;
  pickDirectory: () => Promise<void>;
  pickImage: () => Promise<void>;
  removeImage: (index: number) => void;
  loginWithClaude: () => Promise<void>;

  // Actions - UI
  toggleLeftSidebar: () => void;
  toggleTerminal: () => void;
  toggleTasks: () => void;
  toggleSettings: () => void;
  openNewSessionDialog: () => void;
  closeNewSessionDialog: () => void;
  resetToWelcome: () => void;
}

const getWailsAPI = () => (window as any).go?.main?.App;

const MODE_CYCLE: AgentMode[] = ['accept-edits', 'auto', 'ask'];

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  projects: [],
  sessions: {},
  activeProject: null,
  activeSession: null,
  chatHistory: [],
  currentTokens: { input: 0, output: 0 },
  authStatus: null,
  agentMode: 'accept-edits',
  selectedModel: 'claude-sonnet-4-6',
  availableModels: [],
  gitBranch: '',
  gitBranches: [],
  recentDirs: [],
  attachedImages: [],

  leftSidebarOpen: true,
  terminalOpen: false,
  tasksOpen: false,
  settingsOpen: false,
  newSessionDialogOpen: false,

  // Projects
  loadProjects: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const projects = await app.GetProjects();
      set({ projects: projects || [] });
    } catch (error) {
      console.error("Failed to load projects", error);
    }
  },

  createProject: async (name, workingDir) => {
    try {
      const app = getWailsAPI();
      if (!app) return undefined;
      const project = await app.CreateProject(name, workingDir);
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    } catch (error) {
      console.error("Failed to create project", error);
      return undefined;
    }
  },

  createProjectFromDir: async (workingDir) => {
    try {
      const app = getWailsAPI();
      if (!app) return undefined;
      const project = await app.CreateProjectFromDir(workingDir);
      set((state) => ({ projects: [...state.projects, project] }));
      get().detectGitBranch(workingDir);
      return project;
    } catch (error) {
      console.error("Failed to create project from dir", error);
      return undefined;
    }
  },

  deleteProject: async (projectId) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      await app.DeleteProject(projectId);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        activeProject: state.activeProject?.id === projectId ? null : state.activeProject
      }));
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  },

  setActiveProject: (project) => set({ activeProject: project }),

  // Sessions
  loadSessions: async (projectId) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const sessions = await app.GetSessions(projectId);
      set((state) => ({
        sessions: {
          ...state.sessions,
          [projectId]: sessions || []
        }
      }));
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  },

  createSession: async (projectId, title, model) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const session = await app.CreateSession(projectId, title);
      set((state) => ({
        sessions: {
          ...state.sessions,
          [projectId]: [...(state.sessions[projectId] || []), session]
        },
        activeSession: { ...session, model }
      }));
      get().closeNewSessionDialog();
    } catch (error) {
      console.error("Failed to create session", error);
    }
  },

  deleteSession: async (sessionId) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      await app.DeleteSession(sessionId);
      const state = get();
      set((state) => ({
        sessions: Object.fromEntries(
          Object.entries(state.sessions).map(([pId, sessions]) => [
            pId,
            sessions.filter(s => s.id !== sessionId)
          ])
        ),
        activeSession: state.activeSession?.id === sessionId ? null : state.activeSession
      }));
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  },

  setActiveSession: (session) => {
    set({ activeSession: session });
    if (session) {
      get().loadSessionMessages(session.id);
    }
  },

  loadSessionMessages: async (sessionId) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const messages = await app.GetSessionMessages(sessionId);
      set((state) => {
        if (!state.activeSession || state.activeSession.id !== sessionId) return state;
        return {
          activeSession: {
            ...state.activeSession,
            messages: messages || []
          },
          chatHistory: (messages || []).map((msg: Message, idx: number) => ({
            id: `${sessionId}-${idx}`,
            type: msg.role === 'user' ? 'user_input' : 'agent_text',
            content: msg.content,
            timestamp: Date.parse(msg.timestamp)
          }))
        };
      });
    } catch (error) {
      console.error("Failed to load session messages", error);
    }
  },

  // Chat
  addChatEvent: (event) => set((state) => ({
    chatHistory: [...state.chatHistory, event]
  })),

  submitPrompt: async (prompt) => {
    const state = get();
    if (!state.activeSession || !state.activeProject) return;

    const userEvent: AgentEvent = {
      id: `usr-${Date.now()}`,
      type: 'user_input',
      content: prompt,
      timestamp: Date.now()
    };

    set((state) => ({ chatHistory: [...state.chatHistory, userEvent] }));

    try {
      const app = getWailsAPI();
      if (!app) return;

      await app.StartAgentLoop(
        state.activeSession.id,
        prompt,
        state.activeProject.working_dir
      );
    } catch (error) {
      console.error("Failed to start agent loop", error);
      set((state) => ({
        chatHistory: [...state.chatHistory, {
          id: `err-${Date.now()}`,
          type: 'agent_error',
          content: (error as Error).message,
          timestamp: Date.now()
        }]
      }));
    }
  },

  clearChat: () => set({ chatHistory: [] }),

  // Agent Mode
  cycleMode: () => set((state) => {
    const idx = MODE_CYCLE.indexOf(state.agentMode);
    const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    return { agentMode: next };
  }),
  setAgentMode: (mode) => set({ agentMode: mode }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  loadAuthStatus: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const status = await app.GetAuthStatus();
      set({ authStatus: status });
    } catch (error) {
      console.error('Failed to load auth status', error);
    }
  },

  saveProviderKey: async (provider, key) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      await app.SaveProviderKey(provider, key);
      // Refresh auth status and available models
      await get().loadAuthStatus();
      await get().loadAvailableModels();
    } catch (error) {
      console.error('Failed to save provider key', error);
      throw error;
    }
  },

  testProviderConnection: async (provider) => {
    try {
      const app = getWailsAPI();
      if (!app) return 'error';
      await app.TestProviderConnection(provider);
      return 'ok';
    } catch (error) {
      return (error as Error).message || 'Connection failed';
    }
  },

  loadAvailableModels: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const models = await app.GetAvailableModels();
      if (models && models.length > 0) {
        set({ availableModels: models });
        // If the currently selected model isn't in the list, switch to the first available
        const state = get();
        const found = models.some((m: ModelInfo) => m.id === state.selectedModel);
        if (!found) {
          set({ selectedModel: models[0].id });
        }
      }
    } catch (error) {
      console.error('Failed to load available models', error);
    }
  },

  loadRecentDirs: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const dirs = await app.GetRecentDirectories();
      set({ recentDirs: dirs || [] });
    } catch (error) {
      console.error("Failed to load recent dirs", error);
    }
  },

  detectGitBranch: async (path) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const branch = await app.GetGitBranch(path);
      set({ gitBranch: branch || '' });
      await get().loadGitBranches(path);
    } catch (error) {
      set({ gitBranch: '' });
    }
  },

  loadGitBranches: async (path) => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const branches = await app.GetGitBranches(path);
      set({ gitBranches: branches || [] });
    } catch (error) {
      set({ gitBranches: [] });
    }
  },

  checkoutBranch: async (branch) => {
    try {
      const state = get();
      if (!state.activeProject) return;
      const app = getWailsAPI();
      if (!app) return;
      await app.CheckoutGitBranch(state.activeProject.working_dir, branch);
      set({ gitBranch: branch });
    } catch (error) {
      console.error("Failed to checkout branch", error);
    }
  },

  createBranch: async (branch) => {
    try {
      const state = get();
      if (!state.activeProject) return;
      const app = getWailsAPI();
      if (!app) return;
      await app.CreateGitBranch(state.activeProject.working_dir, branch);
      set((s) => ({ gitBranch: branch, gitBranches: [...s.gitBranches, branch] }));
    } catch (error) {
      console.error("Failed to create branch", error);
    }
  },

  pickDirectory: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const dir = await app.PickDirectory();
      if (dir) {
        await get().createProjectFromDir(dir);
        const projects = get().projects;
        const proj = projects.find(p => p.working_dir === dir);
        if (proj) {
          get().setActiveProject(proj);
          get().loadSessions(proj.id);
        }
      }
    } catch (error) {
      console.error("Failed to pick directory", error);
    }
  },

  pickImage: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      const file = await app.PickImage();
      if (file) {
        set((state) => ({ attachedImages: [...state.attachedImages, file] }));
      }
    } catch (error) {
      console.error("Failed to pick image", error);
    }
  },

  removeImage: (index) => set((state) => ({
    attachedImages: state.attachedImages.filter((_, i) => i !== index)
  })),

  loginWithClaude: async () => {
    try {
      const app = getWailsAPI();
      if (!app) return;
      await app.LoginWithClaude();
      await get().loadAuthStatus();
    } catch (error) {
      console.error("Failed to login with Claude", error);
      alert("Failed to login with Claude:\n" + error);
    }
  },

  // UI
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  toggleTasks: () => set((state) => ({ tasksOpen: !state.tasksOpen })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  openNewSessionDialog: () => set({ newSessionDialogOpen: true }),
  closeNewSessionDialog: () => set({ newSessionDialogOpen: false }),
  resetToWelcome: () => set({ activeProject: null, activeSession: null, chatHistory: [] }),
}));
