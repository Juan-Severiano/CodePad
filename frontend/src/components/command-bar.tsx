import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, AgentMode } from '../store/app-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileEntry {
  name: string;
  is_dir: boolean;
}

interface MentionState {
  query: string;
  atIndex: number;
  entries: FileEntry[];
  filtered: FileEntry[];
  selectedIdx: number;
  loading: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODES: AgentMode[] = ['accept-edits', 'auto', 'ask'];
const MODE_LABELS: Record<AgentMode, string> = {
  'accept-edits': 'Accept edits',
  'auto': 'Auto',
  'ask': 'Ask',
};

function splitQuery(query: string) {
  const lastSlash = query.lastIndexOf('/');
  return {
    dirPart: lastSlash >= 0 ? query.slice(0, lastSlash + 1) : '',
    filterPart: lastSlash >= 0 ? query.slice(lastSlash + 1) : query,
  };
}

// ─── CommandBar ───────────────────────────────────────────────────────────────

export function CommandBar() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [mention, setMention] = useState<MentionState | null>(null);

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
    availableModels,
    loadAvailableModels,
    gitBranch,
    toggleSettings,
  } = useAppStore();

  // ── @ mention detection ───────────────────────────────────────────────────

  const detectMention = useCallback(async (value: string, cursorPos: number) => {
    const before = value.slice(0, cursorPos);
    const match = before.match(/@([^\s]*)$/);
    if (!match) { setMention(null); return; }

    const query = match[1];
    const atIndex = before.lastIndexOf('@');
    const { dirPart, filterPart } = splitQuery(query);
    const baseDir = activeProject?.working_dir ?? '';
    const listPath = baseDir + (dirPart ? '/' + dirPart.replace(/^\//, '') : '');

    const app = (window as any).go?.main?.App;
    if (!app) { setMention(null); return; }

    try {
      const entries: FileEntry[] = await app.ListDirectory(listPath);
      const lf = filterPart.toLowerCase();
      const filtered = entries
        .sort((a, b) => (b.is_dir ? 1 : 0) - (a.is_dir ? 1 : 0))
        .filter(e => !filterPart || e.name.toLowerCase().startsWith(lf));

      setMention({ query, atIndex, entries, filtered, selectedIdx: 0, loading: false });
    } catch {
      setMention(null);
    }
  }, [activeProject?.working_dir]);

  // ── Model picker outside-click ────────────────────────────────────────────

  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelPicker]);

  // ── Input handlers ────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setInput(v);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    detectMention(v, e.target.selectionStart ?? v.length);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    detectMention(input, ta.selectionStart ?? input.length);
  };

  const selectEntry = (entry: FileEntry) => {
    if (!mention) return;
    const { atIndex, query } = mention;
    const { dirPart } = splitQuery(query);
    if (entry.is_dir) {
      const newQuery = dirPart + entry.name;
      const newInput = input.slice(0, atIndex + 1) + newQuery;
      setInput(newInput);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
          textareaRef.current.focus();
          const pos = newInput.length;
          textareaRef.current.setSelectionRange(pos, pos);
        }
        detectMention(newInput, newInput.length);
      }, 0);
    } else {
      const token = dirPart + entry.name;
      const newInput = input.slice(0, atIndex + 1) + token + ' ' + input.slice(atIndex + 1 + query.length);
      setInput(newInput);
      setMention(null);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && mention.filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMention(m => m ? { ...m, selectedIdx: Math.min(m.selectedIdx + 1, m.filtered.length - 1) } : m);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMention(m => m ? { ...m, selectedIdx: Math.max(m.selectedIdx - 1, 0) } : m);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectEntry(mention.filtered[mention.selectedIdx]);
        return;
      }
      if (e.key === 'Escape') { setMention(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const doSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setIsLoading(true);
    setMention(null);
    try {
      await submitPrompt(text);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Model groups ──────────────────────────────────────────────────────────

  const modelsByProvider: Record<string, typeof availableModels> = {};
  for (const m of availableModels) {
    if (!modelsByProvider[m.provider]) modelsByProvider[m.provider] = [];
    modelsByProvider[m.provider].push(m);
  }
  const hasModels = availableModels.length > 0;

  const projectPath = activeProject?.working_dir ?? '';
  const projectName = activeProject?.name ?? '';
  const branch = gitBranch || activeSession?.model || '';

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(to top, #0f0f0f 72%, rgba(15,15,15,0))',
      padding: '48px 32px 24px',
      pointerEvents: 'none',
    }}>
      {/* @ mention popup */}
      {mention && mention.filtered.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% - 36px)', left: 32, right: 32,
          background: '#181818', border: '1px solid #282828', borderRadius: 10,
          pointerEvents: 'all', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          maxHeight: 280, zIndex: 100,
        }}>
          <div style={{
            padding: '7px 12px 5px', borderBottom: '1px solid #222',
            fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace',
          }}>
            {projectPath || `~/${projectName}/`}
            {splitQuery(mention.query).dirPart}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {mention.filtered.map((f, i) => (
              <div
                key={f.name}
                onClick={() => selectEntry(f)}
                onMouseEnter={() => setMention(m => m ? { ...m, selectedIdx: i } : m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', cursor: 'pointer',
                  background: i === mention.selectedIdx ? '#222' : 'transparent',
                  fontSize: 13, color: i === mention.selectedIdx ? '#e0e0e0' : '#999',
                  transition: 'background 0.1s',
                }}
              >
                {f.is_dir ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M1 3.5h3.5L6 2h6v8H1V3.5z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#666" strokeWidth="1.3" strokeLinecap="round">
                    <rect x="2" y="1" width="9" height="11" rx="1.5" />
                    <line x1="4" y1="4.5" x2="9" y2="4.5" />
                    <line x1="4" y1="7" x2="9" y2="7" />
                    <line x1="4" y1="9.5" x2="7" y2="9.5" />
                  </svg>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{f.name}</span>
              </div>
            ))}
          </div>
          <div style={{
            padding: '5px 12px 6px', borderTop: '1px solid #1e1e1e',
            fontSize: 10.5, color: '#3a3a3a',
          }}>↑↓ navigate · ↵ select · Esc close</div>
        </div>
      )}

      {/* Main bar */}
      <div style={{
        background: '#131313', border: '1px solid #232323', borderRadius: 12,
        overflow: 'visible', pointerEvents: 'all',
        boxShadow: '0 4px 28px rgba(0,0,0,0.5)',
      }}>
        {/* Context row */}
        {(projectName || branch) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 13px 6px', borderBottom: '1px solid #1c1c1c',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {projectName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M1 2.5h3l1.5 2h4.5v5H1V2.5z" />
                  </svg>
                  {projectName}
                </div>
              )}
              {gitBranch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#4a4a4a', fontFamily: 'monospace' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <circle cx="2.5" cy="2.5" r="1.5" />
                    <circle cx="2.5" cy="8.5" r="1.5" />
                    <circle cx="8.5" cy="4" r="1.5" />
                    <path d="M2.5 4v3" />
                    <path d="M2.5 4C2.5 2 4 1 5.5 1.5L7 2.5" />
                  </svg>
                  {gitBranch}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyDown={handleKey}
          placeholder={isLoading ? 'Agent is running…' : 'Type / for commands'}
          disabled={isLoading}
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            padding: '12px 14px 8px', resize: 'none',
            height: 44, minHeight: 44,
            fontSize: 13.5, color: '#d0d0d0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            lineHeight: 1.55, display: 'block',
          }}
        />

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px 9px',
        }}>
          {/* Left controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Mode button */}
            <button
              onClick={cycleMode}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#666', fontSize: 12, padding: '4px 7px', borderRadius: 5,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.color = '#999'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
            >
              {MODE_LABELS[agentMode]}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M1.5 3.5l3 3 3-3" />
              </svg>
            </button>

            {/* + button */}
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#777')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="7" y1="1.5" x2="7" y2="12.5" /><line x1="1.5" y1="7" x2="12.5" y2="7" />
              </svg>
            </button>

            {/* Mic button */}
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#777')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="1" width="4" height="6.5" rx="2" />
                <path d="M2.5 7A4.5 4.5 0 007 11.5 4.5 4.5 0 0011.5 7" />
                <line x1="7" y1="11.5" x2="7" y2="13.5" />
              </svg>
            </button>
          </div>

          {/* Right controls */}
          <div ref={modelPickerRef} style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            {/* Model picker button */}
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#666', fontSize: 12, padding: '4px 7px', borderRadius: 5,
                transition: 'background 0.15s, color 0.15s',
                fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.color = '#999'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666'; }}
            >
              {selectedModel}
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M1.5 3.5l3 3 3-3" />
              </svg>
            </button>

            {/* Streaming indicator */}
            {isLoading && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 1.2s linear infinite' }}>
                <circle cx="7" cy="7" r="5.5" stroke="#d97757" strokeWidth="1.5" strokeDasharray="10 5" fill="none" />
              </svg>
            )}

            {/* Send button */}
            {!isLoading && (
              <button
                onClick={doSend}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: input.trim() ? '#d97757' : '#1a1a1a',
                  border: '1px solid ' + (input.trim() ? '#d97757' : '#282828'),
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke={input.trim() ? '#fff' : '#383838'}
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 10.5L10.5 1.5M10.5 1.5H4M10.5 1.5V8.5" />
                </svg>
              </button>
            )}

            {/* Model dropdown */}
            {showModelPicker && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 10px)', right: 0,
                background: '#181818', border: '1px solid #282828', borderRadius: 10,
                minWidth: 220, overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                zIndex: 200,
              }}>
                {!hasModels ? (
                  /* Empty state */
                  <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#555" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M11 3a4 4 0 010 8H6l-2 2V3a4 4 0 014-4zm0 0" />
                        <path d="M7 8V5m0 4.5v.5" />
                      </svg>
                      <div>
                        <p style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>No providers configured</p>
                        <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Add an API key in Settings</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowModelPicker(false); toggleSettings(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 10px', borderRadius: 6,
                        background: 'none', border: '1px solid #2a2a2a',
                        cursor: 'pointer', fontSize: 12, color: '#d97757',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1e1e1e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <circle cx="6.5" cy="6.5" r="2" /><circle cx="6.5" cy="6.5" r="5" />
                      </svg>
                      Open Settings
                    </button>
                    <button
                      onClick={() => loadAvailableModels()}
                      style={{
                        fontSize: 11, color: '#555', background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0,
                      }}
                    >↺ Refresh models</button>
                  </div>
                ) : (
                  Object.entries(modelsByProvider).map(([provider, models], gi) => (
                    <div key={provider}>
                      {gi > 0 && <div style={{ height: 1, background: '#1e1e1e' }} />}
                      <div style={{ padding: '8px 12px 4px', fontSize: 10, color: '#3a3a3a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {provider}
                      </div>
                      {models.map(m => (
                        <div
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                          style={{
                            padding: '6px 12px', cursor: 'pointer', fontSize: 12.5,
                            color: m.id === selectedModel ? '#e0e0e0' : '#888',
                            background: m.id === selectedModel ? '#222' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'background 0.1s',
                            fontFamily: 'monospace',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                          onMouseLeave={e => (e.currentTarget.style.background = m.id === selectedModel ? '#222' : 'transparent')}
                        >
                          {m.label}
                          {m.id === selectedModel && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
                {hasModels && (
                  <>
                    <div style={{ height: 1, background: '#1e1e1e' }} />
                    <div
                      onClick={() => { setShowModelPicker(false); toggleSettings(); }}
                      style={{
                        padding: '9px 12px', cursor: 'pointer', fontSize: 12.5,
                        color: '#d97757', display: 'flex', alignItems: 'center', gap: 7,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1e1e1e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                        <circle cx="6.5" cy="6.5" r="2" /><circle cx="6.5" cy="6.5" r="5" />
                      </svg>
                      Open Settings
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
