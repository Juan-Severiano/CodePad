import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Folder, GitBranch, GitFork, ArrowUp, Plus, Mic, ChevronDown, Check } from 'lucide-react';
import { useAppStore, AgentMode } from '../store/app-store';

const MODELS = [
  { id: 'claude-opus-4-7',    label: 'Claude Opus 4.7',   provider: 'Anthropic' },
  { id: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5',  provider: 'Anthropic' },
  { id: 'gpt-4o',             label: 'GPT-4o',             provider: 'OpenAI' },
  { id: 'gpt-4o-mini',        label: 'GPT-4o mini',        provider: 'OpenAI' },
  { id: 'o3-mini',            label: 'o3-mini',             provider: 'OpenAI' },
];

const MODE_LABELS: Record<AgentMode, string> = {
  'accept-edits': 'Accept edits',
  'auto':         'Auto',
  'ask':          'Ask',
};

export function CommandBar() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const {
    submitPrompt,
    activeProject,
    activeSession,
    agentMode,
    cycleMode,
    selectedModel,
    setSelectedModel,
    gitBranch,
  } = useAppStore();

  // Shift+Tab cycles mode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      cycleMode();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !activeSession || isLoading) return;
    setIsLoading(true);
    try {
      await submitPrompt(input.trim());
      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  // Close model picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentModel = MODELS.find(m => m.id === selectedModel);
  const modelShort = currentModel?.label.replace('Claude ', '').replace('GPT-', '') || 'Sonnet 4.6';
  const projectName = activeProject?.name || '';
  const folderShort = activeProject?.working_dir.split('/').pop() || '';

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col">
      {/* Context Bar */}
      {activeProject && (
        <div className="flex items-center gap-1 px-1 mb-2">
          <ContextChip icon={<Monitor size={12} />} label="Local" />
          <span className="text-[#333] text-xs">/</span>
          <ContextChip icon={<Folder size={12} />} label={projectName} />
          {gitBranch && (
            <>
              <span className="text-[#333] text-xs">/</span>
              <ContextChip icon={<GitBranch size={12} />} label={gitBranch} />
            </>
          )}
          {activeSession && (
            <>
              <span className="text-[#333] text-xs">/</span>
              <ContextChip icon={<GitFork size={12} />} label="worktree" />
            </>
          )}
        </div>
      )}

      {/* Input Box */}
      <div className={`relative bg-[#1c1c1c] border rounded-xl shadow-2xl transition-all ${
        isLoading
          ? 'border-[#d97757]/60 ring-1 ring-[#d97757]/30'
          : 'border-[#2a2a2a] focus-within:border-[#3a3a3a]'
      }`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!activeSession || isLoading}
          placeholder={activeSession ? 'Describe a task or ask a question' : 'Create or select a session to start'}
          spellCheck={false}
          rows={1}
          className="w-full bg-transparent outline-none resize-none text-white text-sm placeholder-[#555] py-4 px-4 pr-12 leading-relaxed disabled:opacity-40 min-h-[54px] max-h-[200px]"
          style={{ overflowY: 'auto' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 200) + 'px';
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || !activeSession || isLoading}
          className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#333] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          <ArrowUp size={15} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between mt-2 px-1">
        {/* Left: Mode + Plus + Mic */}
        <div className="flex items-center gap-1">
          <button
            onClick={cycleMode}
            title="Shift+Tab to cycle mode"
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[#888] hover:text-white hover:bg-[#1c1c1c] transition-colors text-xs font-medium border border-transparent hover:border-[#2a2a2a]"
          >
            <ModeIcon mode={agentMode} />
            <span>{MODE_LABELS[agentMode]}</span>
          </button>

          <div className="w-px h-3.5 bg-[#2a2a2a] mx-0.5" />

          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#666] hover:text-white hover:bg-[#1c1c1c] transition-colors">
            <Plus size={14} />
          </button>
          <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#666] hover:text-white hover:bg-[#1c1c1c] transition-colors">
            <Mic size={14} />
          </button>
        </div>

        {/* Right: Model Selector */}
        <div className="relative" ref={modelPickerRef}>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[#888] hover:text-white hover:bg-[#1c1c1c] transition-colors text-xs font-medium border border-transparent hover:border-[#2a2a2a]"
          >
            <span className={isLoading ? 'text-[#d97757]' : ''}>{modelShort}</span>
            {isLoading && (
              <span className="w-3 h-3 rounded-full border-2 border-[#d97757]/30 border-t-[#d97757] animate-spin" />
            )}
            <ChevronDown size={11} />
          </button>

          {showModelPicker && (
            <div className="absolute bottom-full right-0 mb-1.5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg shadow-2xl w-56 py-1 z-50">
              {['Anthropic', 'OpenAI'].map(provider => (
                <div key={provider}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-[#666] uppercase tracking-widest">{provider}</div>
                  {MODELS.filter(m => m.provider === provider).map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-[#a1a1a1] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                    >
                      <span>{model.label}</span>
                      {selectedModel === model.id && <Check size={13} className="text-[#d97757]" />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContextChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[#666] hover:text-[#a1a1a1] transition-colors text-xs">
      <span className="text-[#555]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ModeIcon({ mode }: { mode: AgentMode }) {
  if (mode === 'auto') return <div className="w-1.5 h-1.5 rounded-full bg-green-500" />;
  if (mode === 'ask') return <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />;
  return <div className="w-1.5 h-1.5 rounded-full bg-[#d97757]" />;
}
