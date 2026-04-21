import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/sidebar';
import { ChatView, WelcomeScreen } from './components/chat';
import { CommandBar } from './components/commandbar';
import { Header, RightPanel } from './components/layout-components';
import { SettingsPanel } from './components/settings';
import { useAppStore, AgentEvent } from './store/app-store';

const runtime = (window as any).runtime;

export default function App() {
  const {
    projects,
    sessions,
    activeProject,
    activeSession,
    chatHistory,
    authStatus,
    agentMode,
    selectedModel,
    availableModels,
    gitBranch,
    gitBranches,
    attachedImages,
    leftSidebarOpen,
    terminalOpen,
    tasksOpen,
    settingsOpen,
    loadProjects,
    loadRecentDirs,
    loadAvailableModels,
    loadAuthStatus,
    setActiveProject,
    setActiveSession,
    loadSessions,
    createSession,
    deleteSession,
    submitPrompt,
    setAgentMode,
    setSelectedModel,
    toggleLeftSidebar,
    toggleTerminal,
    toggleTasks,
    toggleSettings,
    resetToWelcome,
    addChatEvent,
    pickDirectory,
    pickImage,
    removeImage,
    checkoutBranch,
    createBranch
  } = useAppStore();

  const [theme, setTheme] = useState(() => localStorage.getItem('cp_theme') || 'dark');
  const toggleTheme = () => setTheme(t => { const n = t === 'dark' ? 'light' : 'dark'; localStorage.setItem('cp_theme', n); return n; });

  const [rightOpen, setRightOpen] = useState(false);
  const [rightTab, setRightTab] = useState('Terminal');

  useEffect(() => {
    loadProjects();
    loadRecentDirs();
    loadAuthStatus();
    loadAvailableModels();
  }, [loadProjects, loadRecentDirs, loadAvailableModels, loadAuthStatus]);

  useEffect(() => {
    if (!runtime) return;

    const listeners = [
      runtime.EventsOn("agent-text", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-text-${Date.now()}`,
          type: 'agent_text',
          content: data.text,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-tool-start", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-tool-${data.tool_id}`,
          type: 'agent_tool_start',
          content: data.args,
          toolName: data.tool_name,
          toolId: data.tool_id,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-tool-result", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-result-${data.tool_id}`,
          type: 'agent_tool_result',
          content: data.output,
          toolName: data.tool_name,
          toolId: data.tool_id,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-done", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-done-${Date.now()}`,
          type: 'agent_done',
          content: `Completed: ${data.input_tokens} input, ${data.completion_tokens} output tokens`,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-error", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-error-${Date.now()}`,
          type: 'agent_error',
          content: data.error,
          timestamp: Date.now()
        });
      })
    ];

    return () => {
      if (!runtime) return;
      runtime.EventsOff("agent-text");
      runtime.EventsOff("agent-tool-start");
      runtime.EventsOff("agent-tool-result");
      runtime.EventsOff("agent-done");
      runtime.EventsOff("agent-error");
    };
  }, [addChatEvent]);

  // Group AgentEvents into messages for ChatView
  const processedMessages = useMemo(() => {
    const messages: any[] = [];
    let currentAgentMessage: any = null;

    chatHistory.forEach((event: AgentEvent) => {
      if (event.type === 'user_input') {
        currentAgentMessage = null;
        messages.push({ role: 'user', content: event.content });
      } else {
        if (!currentAgentMessage) {
          currentAgentMessage = { role: 'agent', parts: [] };
          messages.push(currentAgentMessage);
        }

        switch (event.type) {
          case 'agent_text':
            currentAgentMessage.parts.push({ type: 'text', content: event.content });
            break;
          case 'agent_tool_start': {
            let parsedLabel = event.toolName;
            try {
              const parsedArgs = JSON.parse(event.content);
              if (parsedArgs.command) parsedLabel = `${event.toolName}: ${String(parsedArgs.command).slice(0, 60)}`;
              else if (parsedArgs.path) parsedLabel = `${event.toolName}: ${parsedArgs.path}`;
              else if (parsedArgs.file_path) parsedLabel = `${event.toolName}: ${parsedArgs.file_path}`;
              else if (parsedArgs.pattern) parsedLabel = `${event.toolName}: ${parsedArgs.pattern}`;
            } catch (e) {}

            currentAgentMessage.parts.push({
              type: 'tool',
              label: parsedLabel,
              status: 'running',
              input: event.content,
              toolId: event.toolId
            });
            break;
          }
          case 'agent_tool_result':
            const toolPart = currentAgentMessage.parts.find((p: any) => p.type === 'tool' && p.toolId === event.toolId);
            if (toolPart) {
              toolPart.status = 'done';
              toolPart.output = event.content;
            }
            break;
          case 'agent_done':
            currentAgentMessage.parts.push({ type: 'done', text: event.content });
            break;
          case 'agent_error':
            currentAgentMessage.parts.push({ type: 'error', content: event.content });
            break;
        }
      }
    });

    return messages;
  }, [chatHistory]);

  const sidebarProjects = useMemo(() => {
    return projects.map(p => ({
      ...p,
      sessions: sessions[p.id] || []
    }));
  }, [projects, sessions]);

  const handleSelectSession = useCallback((projectName: string, session: any) => {
    const project = projects.find(p => p.name === projectName);
    if (project) {
      setActiveProject(project);
      setActiveSession(session);
    }
  }, [projects, setActiveProject, setActiveSession]);

  const handleNewSession = useCallback(() => {
    if (activeProject) {
      createSession(activeProject.id, `Session ${new Date().toLocaleTimeString()}`, selectedModel);
    }
  }, [activeProject, createSession, selectedModel]);

  const isStreaming = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].type !== 'agent_done' && chatHistory[chatHistory.length - 1].type !== 'agent_error' && chatHistory[chatHistory.length - 1].type !== 'user_input';

  return (
    <div data-theme={theme} style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--tx)' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={!leftSidebarOpen}
        onToggle={toggleLeftSidebar}
        projects={sidebarProjects}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onOpenSettings={toggleSettings}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Header
          project={activeProject?.name}
          session={activeSession}
          rightOpen={rightOpen}
          rightTab={rightTab}
          onToggleRight={setRightOpen}
          onSetRightTab={setRightTab}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Content row */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chat / Welcome */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            {!activeSession ? (
              <WelcomeScreen onNewSession={handleNewSession} onOpenFolder={pickDirectory} />
            ) : (
              <ChatView
                messages={processedMessages}
                streaming={isStreaming}
              />
            )}
            <CommandBar
              project={activeProject?.name}
              branch={gitBranch}
              gitBranches={gitBranches}
              attachedImages={attachedImages}
              onPickDirectory={pickDirectory}
              onPickImage={pickImage}
              onRemoveImage={removeImage}
              onCheckoutBranch={checkoutBranch}
              onCreateBranch={createBranch}
              onSend={submitPrompt}
              isStreaming={isStreaming}
              agentMode={agentMode}
              onModeChange={setAgentMode}
              model={selectedModel}
              availableModels={availableModels || []}
              onModelChange={setSelectedModel}
              onOpenSettings={toggleSettings}
            />
          </div>

          {/* Right panel */}
          {rightOpen && (
            <RightPanel tab={rightTab} onClose={() => setRightOpen(false)} />
          )}
        </div>
      </div>

      {/* Settings */}
      {settingsOpen && <SettingsPanel onClose={toggleSettings} />}
    </div>
  );
}
