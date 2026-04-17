import React from 'react';
import { useAppStore } from '../store/app-store';
import { X, CheckCircle2, CircleDashed } from 'lucide-react';

export function TasksPanel() {
  const { toggleTasks } = useAppStore();

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f0f] relative group">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 bg-[#141414] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#a1a1a1] tracking-wide uppercase">Tasks / Plan</span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleTasks}
            className="p-1 rounded hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3 text-sm">
          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[#e0e0e0] font-medium">Read project files</span>
            <span className="text-[#888] text-xs">Analyzed 12 files in workspace</span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 text-sm">
          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[#e0e0e0] font-medium">Identify layout structure</span>
            <span className="text-[#888] text-xs">Found lateral-nav.tsx and main-panel.tsx</span>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <CircleDashed size={16} className="text-[#d97757] animate-pulse mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-white font-medium">Implement authentic UI</span>
            <span className="text-[#d97757] text-xs">Refactoring components to match Claude Code Desktop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
