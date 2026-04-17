import React from 'react';

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
}

interface VisualDiffProps {
  fileName: string;
  changes: DiffChange[];
  onApprove: () => void;
  onReject: () => void;
}

export function VisualDiff({ fileName, changes, onApprove, onReject }: VisualDiffProps) {
  return (
    <div className="w-full flex flex-col bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="h-14 bg-[#1c1c1c] border-b border-[#2a2a2a] flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="text-[#a1a1a1] text-sm font-medium">Reviewing changes</span>
          <span className="text-[#a1a1a1] text-xs">|</span>
          <span className="text-white text-sm font-semibold px-2.5 py-1 bg-[#2a2a2a] rounded-md shadow-sm border border-[#333]">{fileName}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onReject}
            className="px-5 py-1.5 rounded-lg text-sm font-medium text-[#a1a1a1] hover:text-white hover:bg-[#2a2a2a] border border-[#333] transition-all"
          >
            Reject
          </button>
          <button 
            onClick={onApprove}
            className="px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-500 border border-green-500 hover:border-green-400 transition-all shadow-sm flex items-center gap-2"
          >
            <span>Approve</span>
            <kbd className="bg-green-700/50 px-1.5 py-0.5 rounded text-[10px] font-sans border border-green-600">Ctrl+Enter</kbd>
          </button>
        </div>
      </div>

      {/* Content - Side by Side Header */}
      <div className="flex w-full bg-[#1c1c1c] border-b border-[#2a2a2a] text-xs font-semibold text-[#a1a1a1] uppercase tracking-wider">
        <div className="w-1/2 p-2 px-4 border-r border-[#2a2a2a]">Original</div>
        <div className="w-1/2 p-2 px-4">Modified</div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-y-auto max-h-[55vh] font-mono text-[13px] leading-relaxed py-2">
        {changes.map((change, idx) => {
          if (change.type === 'unchanged') {
            return (
              <div key={idx} className="flex w-full text-[#888] hover:bg-[#1a1a1a] transition-colors">
                <div className="w-1/2 px-4 py-0.5 border-r border-[#2a2a2a] whitespace-pre">{change.content || ' '}</div>
                <div className="w-1/2 px-4 py-0.5 whitespace-pre">{change.content || ' '}</div>
              </div>
            );
          }
          if (change.type === 'remove') {
            return (
              <div key={idx} className="flex w-full hover:bg-[#1a1a1a] transition-colors">
                <div className="w-1/2 px-4 py-0.5 border-r border-[#2a2a2a] bg-red-950/30 text-red-400 whitespace-pre">
                  <span className="inline-block w-4 opacity-50 select-none">-</span>
                  {change.content}
                </div>
                <div className="w-1/2 px-4 py-0.5 bg-[#1a1a1a]/50"></div>
              </div>
            );
          }
          if (change.type === 'add') {
            return (
              <div key={idx} className="flex w-full hover:bg-[#1a1a1a] transition-colors">
                <div className="w-1/2 px-4 py-0.5 border-r border-[#2a2a2a] bg-[#1a1a1a]/50"></div>
                <div className="w-1/2 px-4 py-0.5 bg-green-950/30 text-green-400 whitespace-pre">
                  <span className="inline-block w-4 opacity-50 select-none">+</span>
                  {change.content}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
