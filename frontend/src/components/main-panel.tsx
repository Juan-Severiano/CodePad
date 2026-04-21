import React from 'react';
import { CommandBar } from './command-bar';
import { useAppStore } from '../store/app-store';
import { ChatView } from './chat-view';

export function MainPanel() {
  const {
    activeProject,
    activeSession,
    createProjectFromDir,
    createSession,
    detectGitBranch,
    selectedModel,
    resetToWelcome,
  } = useAppStore();

  const handleOpenFolder = async () => {
    const app = (window as any).go?.main?.App;
    if (!app) return;
    const path = await app.PickDirectory();
    if (!path) return;
    const project = await createProjectFromDir(path);
    if (!project) return;
    const now = new Date();
    const title = now.toLocaleString('pt-BR', {
      month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    await createSession(project.id, title, selectedModel);
    detectGitBranch(path);
  };

  return (
    <div style={{ flex: 1, background: '#0f0f0f', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!activeProject ? (
          <WelcomeScreen onOpenFolder={handleOpenFolder} />
        ) : !activeSession ? (
          <NoSessionScreen onOpenFolder={handleOpenFolder} projectName={activeProject.name} />
        ) : (
          <ChatView />
        )}
      </div>

      {/* Command Bar — absolute over gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <CommandBar />
      </div>
    </div>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    iconPath: 'M2 7s1.5-5 5-5 5 5 5 5-1.5 5-5 5-5-5-5-5zm5 0a1.5 1.5 0 100 0.01',
    label: 'Streaming agents',
    desc: 'Real-time tool calls and diffs',
  },
  {
    iconPath: 'M2 3h10v2H2zm0 4h10v2H2zm0 4h6v2H2z',
    label: 'Project context',
    desc: 'Reads your codebase automatically',
  },
  {
    iconPath: 'M7 2a5 5 0 000 10M7 2c1.5 3 1.5 7 0 10M2 7h10M2.5 4.5C4 5.5 5.5 6 7 6s3-.5 4.5-1.5M2.5 9.5C4 8.5 5.5 8 7 8s3 .5 4.5 1.5',
    label: 'Branch detection',
    desc: 'Aware of your git context',
  },
];

function WelcomeScreen({ onOpenFolder }: { onOpenFolder: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 48px 200px',
    }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: '#e8e8e8', marginBottom: 10, letterSpacing: -0.3 }}>
        What would you like to work on?
      </div>
      <div style={{ fontSize: 14, color: '#555', marginBottom: 40 }}>
        Open a folder to start a new project
      </div>

      <button
        onClick={onOpenFolder}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 10,
          padding: '10px 22px', color: '#ccc', fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
          marginBottom: 56,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.borderColor = '#3a3a3a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.borderColor = '#2e2e2e'; }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4.5h4l1.5 2h6v7H2V4.5z" /><path d="M2 4.5V2.5h3.5" />
        </svg>
        Open folder
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 580, width: '100%' }}>
        {FEATURES.map(f => (
          <div key={f.label} style={{
            background: '#141414', border: '1px solid #1e1e1e', borderRadius: 10,
            padding: '16px 16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#555" strokeWidth="1.3" strokeLinecap="round" style={{ marginBottom: 10 }}>
              <path d={f.iconPath} />
            </svg>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#aaa', marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11.5, color: '#4a4a4a', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NoSessionScreen ──────────────────────────────────────────────────────────

function NoSessionScreen({ onOpenFolder, projectName }: { onOpenFolder: () => void; projectName: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 48px 200px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#555', marginBottom: 8 }}>{projectName}</p>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8e8' }}>Start a new session</h2>
      </div>
      <button
        onClick={onOpenFolder}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: 10,
          padding: '10px 22px', color: '#ccc', fontSize: 13.5, cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.borderColor = '#3a3a3a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.borderColor = '#2e2e2e'; }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4.5h4l1.5 2h6v7H2V4.5z" /><path d="M2 4.5V2.5h3.5" />
        </svg>
        Open folder
      </button>
    </div>
  );
}
