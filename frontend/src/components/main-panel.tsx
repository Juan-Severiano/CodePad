import React from 'react';
import { CommandBar } from './command-bar';
import { useAppStore } from '../store/app-store';
import { Plus, FolderOpen, Zap, GitBranch } from 'lucide-react';
import { ChatView } from './chat-view';
import { NewSessionDialog } from './new-session-dialog';

export function MainPanel() {
  const { activeProject, activeSession, openNewSessionDialog } = useAppStore();

  return (
    <div className="flex-1 bg-[#0f0f0f] h-full flex flex-col relative overflow-hidden">
      <NewSessionDialog />

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-36">
        {!activeProject ? (
          <WelcomeScreen onCreateProject={openNewSessionDialog} />
        ) : !activeSession ? (
          <NoSessionScreen onCreateSession={openNewSessionDialog} projectName={activeProject.name} />
        ) : (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <ChatView />
          </div>
        )}
      </div>

      {/* Command Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pt-10 pb-4 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/95 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto">
          <CommandBar />
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-10 px-8">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white tracking-tight">What would you like to work on?</h1>
        <p className="text-[#666] text-sm">Open a folder to start a new project</p>
      </div>

      <button
        onClick={onCreateProject}
        className="flex items-center gap-2.5 px-5 py-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#3a3a3a] text-white rounded-lg font-medium text-sm transition-all"
      >
        <FolderOpen size={16} className="text-[#888]" />
        Open folder
      </button>

      <div className="grid grid-cols-3 gap-3 max-w-xl w-full mt-4">
        <FeatureCard icon={<Zap size={15} />} title="Streaming agents" description="Multiple AI providers with real-time output" />
        <FeatureCard icon={<FolderOpen size={15} />} title="Project context" description="Git-aware with worktree support" />
        <FeatureCard icon={<GitBranch size={15} />} title="Branch detection" description="Auto-detects repo and branch" />
      </div>
    </div>
  );
}

function NoSessionScreen({ onCreateSession, projectName }: { onCreateSession: () => void; projectName: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8">
      <div className="text-center flex flex-col gap-2">
        <p className="text-[#666] text-sm font-mono">{projectName}</p>
        <h2 className="text-xl font-semibold text-white">Start a new session</h2>
      </div>
      <button
        onClick={onCreateSession}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-white rounded-lg text-sm transition-all"
      >
        <Plus size={14} />
        New session
      </button>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#1c1c1c] border border-[#252525] rounded-lg p-4">
      <div className="text-[#888] mb-2">{icon}</div>
      <h3 className="text-white font-medium text-xs mb-1">{title}</h3>
      <p className="text-[#555] text-[11px] leading-relaxed">{description}</p>
    </div>
  );
}
