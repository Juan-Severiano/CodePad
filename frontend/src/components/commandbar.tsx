import React, { useState, useRef, useEffect, useMemo } from 'react';

const AT_FILES = [
  { name: 'src/',         type: 'dir' },
  { name: 'frontend/',    type: 'dir' },
  { name: 'backend/',     type: 'dir' },
  { name: 'main.go',      type: 'file' },
  { name: 'go.mod',       type: 'file' },
  { name: 'go.sum',       type: 'file' },
  { name: 'wails.json',   type: 'file' },
  { name: 'README.md',    type: 'file' },
];

const MOCK_BRANCHES = [
  { name: 'main',               current: true,  remote: true  },
  { name: 'develop',            current: false, remote: true  },
  { name: 'feat/sprint-8',      current: false, remote: false },
  { name: 'fix/login-redirect', current: false, remote: false },
  { name: 'refactor/pagination',current: false, remote: false },
];

export const MODES = [
  { id: 'accept-edits', label: 'Agent', color: '#818cf8', bg: '#818cf822', border: '#818cf840',
    icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 6.5C2 4 4 2 6.5 2S11 4 11 6.5 9 11 6.5 11 2 9 2 6.5z"/><path d="M2 6.5C4 5 9 5 11 6.5"/><path d="M2 6.5C4 8 9 8 11 6.5"/></svg> },
  { id: 'plan',  label: 'Plan',  color: '#fb923c', bg: '#fb923c22', border: '#fb923c40',
    icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2.5" y1="4" x2="10.5" y2="4"/><line x1="2.5" y1="6.5" x2="8" y2="6.5"/><line x1="2.5" y1="9" x2="6" y2="9"/></svg> },
  { id: 'debug', label: 'Debug', color: '#f87171', bg: '#f8717122', border: '#f8717140',
    icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2.5C5 2.5 4.5 1.5 6.5 1.5S8 2.5 8 2.5"/><path d="M4.5 4.5C3.5 4 2 4 1.5 5.5"/><path d="M8.5 4.5C9.5 4 11 4 11.5 5.5"/><rect x="3.5" y="4.5" width="6" height="6.5" rx="2"/><line x1="1.5" y1="7" x2="3.5" y2="7"/><line x1="9.5" y1="7" x2="11.5" y2="7"/><line x1="1.5" y1="9.5" x2="3.5" y2="9"/><line x1="9.5" y1="9.5" x2="11.5" y2="9"/></svg> },
  { id: 'ask',   label: 'Ask',   color: '#c084fc', bg: '#c084fc22', border: '#c084fc40',
    icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2H2v7h4l1.5 2L9 9h2V2z"/></svg> },
  { id: 'auto',  label: 'Auto',  color: '#34d399', bg: '#34d39922', border: '#34d39940',
    icon: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 6.5a4.5 4.5 0 014.5-4.5A4.5 4.5 0 0111 6.5"/><path d="M11 6.5a4.5 4.5 0 01-4.5 4.5A4.5 4.5 0 012 6.5"/></svg> },
];

function BranchPicker({ project, branch, branches, onClose, onCreate }: any) {
  const [search, setSearch]     = useState('');
  const [creating, setCreating] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const newRef   = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (creating) newRef.current?.focus(); }, [creating]);

  const filtered = (branches || []).filter((b: string) => b.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 10px)', left: 0,
      background: 'var(--panel)', border: '1px solid var(--border-h)', borderRadius: 11,
      width: 280, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      zIndex: 300, animation: 'fadeIn 0.12s ease',
    }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--tx-4)', fontFamily: 'monospace', marginBottom: 7 }}>
          {project || 'project'} — branches
        </div>
        <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter branches…"
          style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, padding: '6px 9px', color: 'var(--tx)', fontSize: 12.5, outline: 'none', fontFamily: 'monospace' }}
          onFocus={e => (e.target.style.borderColor = 'var(--border-h)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-m)')}
        />
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
        {filtered.map((b: string) => (
          <div key={b} onClick={() => onClose(b)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 13px', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--active)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={b === branch ? '#34d399' : 'var(--tx-4)'} strokeWidth="1.4" strokeLinecap="round">
                <circle cx="3" cy="2.5" r="1.5"/><circle cx="3" cy="9.5" r="1.5"/><circle cx="9" cy="4" r="1.5"/>
                <path d="M3 4v4"/><path d="M3 4C3 2.5 4.5 1.5 6 2L7.5 3"/>
              </svg>
              <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: b === branch ? 'var(--tx)' : 'var(--tx-3)', fontWeight: b === branch ? 500 : 400 }}>{b}</span>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {b === branch && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5.5l2.5 2.5 4.5-4.5"/></svg>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: '12px 13px', fontSize: 12, color: 'var(--tx-4)' }}>No branches match</div>}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 8px' }}>
        {creating ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input ref={newRef} value={newBranch} onChange={e => setNewBranch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newBranch.trim()) onCreate(newBranch.trim()); if (e.key === 'Escape') setCreating(false); }}
              placeholder="new-branch-name"
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border-h)', borderRadius: 6, padding: '6px 9px', color: 'var(--tx)', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
            />
            <button onClick={() => newBranch.trim() && onCreate(newBranch.trim())}
              style={{ background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, color: 'var(--tx-3)', cursor: 'pointer', padding: '0 11px', fontSize: 12 }}>
              Create
            </button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', fontSize: 12.5, padding: '6px 5px', borderRadius: 6, transition: 'color 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-3)')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
            New branch
          </button>
        )}
      </div>
    </div>
  );
}

export function CommandBar({ project, branch, gitBranches, attachedImages, onPickDirectory, onPickImage, onRemoveImage, onCheckoutBranch, onCreateBranch, diffStats, onSend, isStreaming, agentMode, onModeChange, model, availableModels, onModelChange, onOpenSettings }: any) {
  const [value, setValue]           = useState('');
  const [modelOpen, setModelOpen]   = useState(false);
  const [modeOpen, setModeOpen]     = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [atOpen, setAtOpen]         = useState(false);
  const [atQuery, setAtQuery]       = useState('');
  const [atIdx, setAtIdx]           = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find(m => m.id === agentMode) || MODES[0];

  useEffect(() => {
    if (!modelOpen && !modeOpen && !branchOpen) return;
    const h = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) { setModelOpen(false); setModeOpen(false); setBranchOpen(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [modelOpen, modeOpen, branchOpen]);

  const filteredFiles = AT_FILES.filter(f => f.name.toLowerCase().includes(atQuery.toLowerCase()));

  const handleChange = (e: any) => {
    const v = e.target.value;
    setValue(v);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    const lastAt = v.lastIndexOf('@');
    if (lastAt >= 0) { const q = v.slice(lastAt + 1); if (!q.includes(' ')) { setAtOpen(true); setAtQuery(q); setAtIdx(0); return; } }
    setAtOpen(false);
  };

  const insertFile = (file: any) => {
    setValue(value.slice(0, value.lastIndexOf('@')) + '@' + file.name + ' ');
    setAtOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKey = (e: any) => {
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); const idx = MODES.findIndex(m => m.id === agentMode); onModeChange(MODES[(idx + 1) % MODES.length].id); return; }
    if (atOpen && filteredFiles.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAtIdx(i => Math.min(i+1, filteredFiles.length-1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setAtIdx(i => Math.max(i-1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertFile(filteredFiles[atIdx]); return; }
      if (e.key === 'Escape')    { setAtOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  const doSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const modelGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    availableModels.forEach((m: any) => {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    });
    return Object.entries(groups).map(([provider, items]) => ({ provider, items }));
  }, [availableModels]);

  const selectedModelLabel = useMemo(() => {
    const m = availableModels.find((m: any) => m.id === model);
    return m ? m.label : model;
  }, [availableModels, model]);

  return (
    <div ref={barRef} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, var(--bg) 72%, transparent)', padding: '48px 32px 24px', pointerEvents: 'none' }}>

      {/* @ mention popup */}
      {atOpen && filteredFiles.length > 0 && (
        <div style={{ position: 'absolute', bottom: 'calc(100% - 36px)', left: 32, right: 32, background: 'var(--panel)', border: '1px solid var(--border-h)', borderRadius: 10, pointerEvents: 'all', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', maxHeight: 280 }}>
          <div style={{ padding: '7px 12px 5px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--tx-4)', fontFamily: 'monospace' }}>
            ~/projects/{project || 'codepad'}/
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {filteredFiles.map((f, i) => (
              <div key={f.name} onClick={() => insertFile(f)} onMouseEnter={() => setAtIdx(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: i === atIdx ? 'var(--active)' : 'transparent', fontSize: 13, color: i === atIdx ? 'var(--tx)' : 'var(--tx-3)', transition: 'background 0.1s' }}>
                {f.type === 'dir'
                  ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--tx-3)" strokeWidth="1.3" strokeLinecap="round"><path d="M1 3.5h3.5L6 2h6v8H1V3.5z"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--tx-4)" strokeWidth="1.3" strokeLinecap="round"><rect x="2" y="1" width="9" height="11" rx="1.5"/><line x1="4" y1="4.5" x2="9" y2="4.5"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="9.5" x2="7" y2="9.5"/></svg>}
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context row (above input) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8, pointerEvents: 'all' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Project */}
          {project && (
            <div onClick={onPickDirectory} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, color: 'var(--tx-3)', fontFamily: 'monospace', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 3h3l1 1.5h5v5H1.5z"/></svg>
              {project}
            </div>
          )}
          {/* Branch */}
          {branch && (
            <div style={{ position: 'relative' }}>
              <div onClick={() => { setBranchOpen(o => !o); setModeOpen(false); setModelOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: branchOpen ? 'var(--active)' : 'var(--card)', border: '1px solid ' + (branchOpen ? 'var(--border-h)' : 'var(--border-m)'), borderRadius: 6, padding: '4px 8px', fontSize: 11.5, color: branchOpen ? 'var(--tx)' : 'var(--tx-3)', fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="3" cy="2.5" r="1.5"/><circle cx="3" cy="9.5" r="1.5"/><circle cx="9" cy="4" r="1.5"/><path d="M3 4v4"/><path d="M3 4C3 2.5 4.5 1.5 6 2L7.5 3"/></svg>
                {branch}
              </div>
              {branchOpen && <BranchPicker branch={branch} project={project} branches={gitBranches} onClose={(b: string) => { setBranchOpen(false); if(b !== branch) onCheckoutBranch(b); }} onCreate={(b: string) => { setBranchOpen(false); onCreateBranch(b); }} />}
            </div>
          )}
          {/* Worktree */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, color: 'var(--tx-4)', fontFamily: 'monospace', cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, background: 'var(--border-h)', borderRadius: 1.5 }} />
            worktree
          </div>
          {/* Folder+ icon */}
          <div onClick={onPickDirectory} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, color: 'var(--tx-4)', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--tx)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--tx-4)'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 3h3l1 1.5h5v5H1.5z"/><path d="M6.5 5.5v3M5 7h3"/></svg>
          </div>
          
          {diffStats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <span style={{ fontSize: 11, color: '#4ade80', fontFamily: 'monospace' }}>+{diffStats.added}</span>
              <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'monospace' }}>−{diffStats.removed}</span>
            </div>
          )}
        </div>
        
        {/* Crab Robot */}
        <div style={{ marginRight: 16, marginBottom: -1, zIndex: 10 }}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="var(--accent)">
            <rect x="4" y="2" width="2" height="2" />
            <rect x="16" y="2" width="2" height="2" />
            <rect x="0" y="6" width="2" height="2" />
            <rect x="20" y="6" width="2" height="2" />
            <rect x="2" y="4" width="18" height="8" />
            <rect x="6" y="6" width="2" height="2" fill="var(--bg)" />
            <rect x="14" y="6" width="2" height="2" fill="var(--bg)" />
            <rect x="4" y="12" width="2" height="4" />
            <rect x="8" y="12" width="2" height="4" />
            <rect x="12" y="12" width="2" height="4" />
            <rect x="16" y="12" width="2" height="4" />
          </svg>
        </div>
      </div>

      {/* Attached Images */}
      {attachedImages && attachedImages.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, pointerEvents: 'all' }}>
           {attachedImages.map((img: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'var(--tx-3)', fontFamily: 'monospace' }}>
                 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="2" y="2" width="8" height="8" rx="1"/><circle cx="5" cy="5" r="1.5"/><path d="M2 8l3-3 5 5"/></svg>
                 {img.split(/[/\\]/).pop()}
                 <button onClick={() => onRemoveImage(i)} style={{ background: 'none', border: 'none', color: 'var(--tx-4)', cursor: 'pointer', padding: '0 4px', marginLeft: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--tx)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--tx-4)'}
                 >×</button>
              </div>
           ))}
        </div>
      )}

      {/* Main bar */}
      <div style={{ background: 'var(--input)', border: '1px solid var(--border-m)', borderRadius: 12, overflow: 'visible', pointerEvents: 'all', boxShadow: '0 4px 28px rgba(0,0,0,0.2)' }}>

        {/* Textarea */}
        <textarea ref={textareaRef} value={value} onChange={handleChange} onKeyDown={handleKey}
          placeholder={isStreaming ? 'Agent is running…' : 'Ask, plan, or give instructions…'}
          disabled={isStreaming}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '12px 14px 8px', resize: 'none', height: 44, minHeight: 44, fontSize: 13.5, color: 'var(--tx)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', lineHeight: 1.55, display: 'block' } as any}
        />

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 9px', borderTop: '1px solid var(--border)' }}>

          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
            {/* Mode pill */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setModeOpen(o => !o); setModelOpen(false); setBranchOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: currentMode.bg, border: '1px solid ' + currentMode.border, borderRadius: 20, padding: '4px 9px 4px 7px', cursor: 'pointer', color: currentMode.color, fontSize: 12, fontWeight: 500, transition: 'opacity 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {currentMode.icon}{currentMode.label}
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 3l3 3 3-3"/></svg>
              </button>

              {modeOpen && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: 'var(--panel)', border: '1px solid var(--border-h)', borderRadius: 10, minWidth: 160, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', zIndex: 200, animation: 'fadeIn 0.12s ease' }}>
                  <div style={{ padding: '7px 12px 5px', fontSize: 10, color: 'var(--tx-4)', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                    Mode <span style={{ color: 'var(--tx-5)', fontWeight: 400 }}>· Shift+Tab</span>
                  </div>
                  {MODES.map(m => (
                    <div key={m.id} onClick={() => { onModeChange(m.id); setModeOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', background: m.id === agentMode ? m.bg : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = m.bg)}
                      onMouseLeave={e => (e.currentTarget.style.background = m.id === agentMode ? m.bg : 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: m.id === agentMode ? m.color : 'var(--tx-3)' }}>
                        {m.icon}<span style={{ fontSize: 13 }}>{m.label}</span>
                      </div>
                      {m.id === agentMode && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke={m.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.5l2.5 2.5 4.5-4.5"/></svg>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attach */}
            <button onClick={onPickImage} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="7" y1="1.5" x2="7" y2="12.5"/><line x1="1.5" y1="7" x2="12.5" y2="7"/></svg>
            </button>

            {/* Mic */}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="1" width="4" height="6.5" rx="2"/><path d="M2.5 7A4.5 4.5 0 007 11.5 4.5 4.5 0 0011.5 7"/><line x1="7" y1="11.5" x2="7" y2="13.5"/>
              </svg>
            </button>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <button onClick={() => { setModelOpen(o => !o); setModeOpen(false); setBranchOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-3)', fontSize: 11.5, padding: '4px 7px', borderRadius: 5, transition: 'background 0.15s, color 0.15s', fontFamily: 'monospace' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--active)'; e.currentTarget.style.color = 'var(--tx)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--tx-3)'; }}
            >
              {selectedModelLabel}<svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 3l3 3 3-3"/></svg>
            </button>

            {isStreaming && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 1.2s linear infinite' } as any}>
                <circle cx="7" cy="7" r="5.5" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="10 5" fill="none"/>
              </svg>
            )}

            {!isStreaming && (
              <button onClick={doSend} style={{ width: 28, height: 28, borderRadius: 7, background: value.trim() ? currentMode.color : 'var(--card)', border: '1px solid ' + (value.trim() ? currentMode.color : 'var(--border-m)'), cursor: value.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, border-color 0.15s' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={value.trim() ? '#fff' : 'var(--tx-4)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 10.5L10.5 1.5M10.5 1.5H4M10.5 1.5V8.5"/>
                </svg>
              </button>
            )}

            {/* Model dropdown */}
            {modelOpen && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', right: 0, background: 'var(--panel)', border: '1px solid var(--border-h)', borderRadius: 10, minWidth: 220, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', zIndex: 200 }}>
                {modelGroups.map((group, gi) => (
                  <div key={group.provider}>
                    {gi > 0 && <div style={{ height: 1, background: 'var(--border)' }} />}
                    <div style={{ padding: '8px 12px 4px', fontSize: 10, color: 'var(--tx-4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{group.provider}</div>
                    {group.items.map((m: any) => (
                      <div key={m.id} onClick={() => { onModelChange(m.id); setModelOpen(false); }}
                        style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, color: m.id === model ? 'var(--tx)' : 'var(--tx-3)', background: m.id === model ? 'var(--active)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.1s', fontFamily: 'monospace' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--active)')}
                        onMouseLeave={e => (e.currentTarget.style.background = m.id === model ? 'var(--active)' : 'transparent')}
                      >
                        {m.label}
                        {m.id === model && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>}
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div onClick={() => { setModelOpen(false); onOpenSettings(); }}
                  style={{ padding: '9px 12px', cursor: 'pointer', fontSize: 12.5, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 7, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="2.2"/><circle cx="6.5" cy="6.5" r="5"/></svg>
                  Open Settings
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
