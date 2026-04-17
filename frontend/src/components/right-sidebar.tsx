import React from 'react';
import { useAppStore } from '../store/app-store';
import { TerminalPanel } from './terminal-panel';
import { TasksPanel } from './tasks-panel';

export function RightSidebar() {
  const { terminalOpen, tasksOpen } = useAppStore();

  if (!terminalOpen && !tasksOpen) return null;

  return (
    <div className="w-[380px] h-full flex flex-col border-l border-[#2a2a2a] bg-[#0f0f0f] shrink-0">
      {terminalOpen && (
        <div className={`w-full flex-col flex ${tasksOpen ? 'h-1/2 border-b border-[#2a2a2a]' : 'h-full'}`}>
          <TerminalPanel />
        </div>
      )}
      {tasksOpen && (
        <div className={`w-full flex-col flex ${terminalOpen ? 'h-1/2' : 'h-full'}`}>
          <TasksPanel />
        </div>
      )}
    </div>
  );
}
