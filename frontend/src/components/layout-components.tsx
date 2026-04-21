import React, { useState, useEffect, useRef } from 'react';

const RIGHT_PANEL_TABS = ['Preview', 'Diff', 'Terminal', 'Tasks', 'Plan'];

const TERMINAL_LINES = [
  { cls: '',        text: 'Welcome to fish, the friendly interactive shell' },
  { cls: 'prompt',  text: 'Type help for instructions on how to use fish' },
  { cls: '',        text: '' },
  { cls: 'cmd',     text: '~/projects/codepad [main] $ wails dev' },
  { cls: 'success', text: '✓ Starting dev server…' },
  { cls: '',        text: 'INFO[0001] Building application…' },
  { cls: 'warn',    text: '[WARN] — (starship::utils): Executing command "/Users/juansev/.jenv/shims/java" timed out.' },
  { cls: '',        text: '' },
  { cls: 'success', text: '✓ Ready on http://localhost:34115' },
  { cls: 'prompt',  text: '…flow [✗!?] is 🐱v0.1 via 🐹v4.6 via 🔷' },
  { cls: 'cmd',     text: '>' },
];

export function Header({ project, session, rightTab, rightOpen, onToggleRight, onSetRightTab, theme, onToggleTheme }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <div style={{
      height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      background: 'var(--sidebar)',
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--tx-3)', minWidth: 0 }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <path d="M1 2.5h4l1.5 2h5.5v6.5H1V2.5z"/>
        </svg>
        {project && (
          <>
            <span style={{ color: 'var(--tx-3)' }}>{project}</span>
            <span style={{ color: 'var(--tx-5)' }}>/</span>
          </>
        )}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span style={{ color: 'var(--tx-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.title}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--tx-4)" strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M2 4l3 3 3-3"/>
            </svg>
          </div>
        )}
        {!session && !project && (
          <span style={{ color: 'var(--tx-4)' }}>No project open</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onToggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: '5px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7" cy="7" r="2.5"/><path d="M7 1.5V3M7 11v1.5M1.5 7H3M11 7h1.5M3.4 3.4l1 1M9.6 9.6l1 1M10.6 3.4l-1 1M4.4 9.6l-1 1"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M11.5 9A5 5 0 015 2.5a5 5 0 100 9 5 5 0 006.5-2.5z"/></svg>
          )}
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(m => !m)}
          style={{
            background: rightOpen ? '#1c1c1c' : 'none',
            border: '1px solid ' + (rightOpen ? '#2a2a2a' : 'transparent'),
            borderRadius: 6, cursor: 'pointer', color: rightOpen ? '#aaa' : '#444',
            padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s', fontSize: 12,
          } as any}
          onMouseEnter={e => { if (!rightOpen) e.currentTarget.style.color = '#777'; }}
          onMouseLeave={e => { if (!rightOpen) e.currentTarget.style.color = '#444'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <rect x="1.5" y="2" width="11" height="10" rx="1.5"/>
            <line x1="9" y1="2" x2="9" y2="12"/>
          </svg>
          {rightOpen && <span style={{ fontSize: 11 }}>{rightTab}</span>}
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M1.5 3.5l3 3 3-3"/>
          </svg>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: 'var(--panel)', border: '1px solid var(--border-h)', borderRadius: 9,
            minWidth: 160, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 300,
            animation: 'fadeIn 0.12s ease',
          } as any}>
            {RIGHT_PANEL_TABS.map(tab => (
              <div
                key={tab}
                onClick={() => { onSetRightTab(tab); onToggleRight(true); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 13px', cursor: 'pointer', fontSize: 13,
                  color: rightOpen && rightTab === tab ? 'var(--tx)' : 'var(--tx-3)',
                  background: rightOpen && rightTab === tab ? 'var(--active)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--active)')}
                onMouseLeave={e => (e.currentTarget.style.background = rightOpen && rightTab === tab ? 'var(--active)' : 'transparent')}
              >
                {tab}
                {tab === 'Terminal' && (
                  <kbd style={{ fontSize: 10, color: 'var(--tx-4)', background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 4, padding: '1px 5px' }}>⌃⌘T</kbd>
                )}
                {tab === 'Preview' && (
                  <kbd style={{ fontSize: 10, color: 'var(--tx-4)', background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 4, padding: '1px 5px' }}>⌘⇧P</kbd>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function RightPanel({ tab, onClose }: any) {
  return (
    <div className="right-panel">
      <div style={{
        height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, color: 'var(--tx-2)', fontWeight: 500 }}>{tab}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l9 9M11 2L2 11"/>
            </svg>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <rect x="1.5" y="2" width="10" height="9" rx="1.5"/>
              <line x1="8.5" y1="2" x2="8.5" y2="11"/>
            </svg>
          </button>
        </div>
      </div>

      {tab === 'Terminal' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {TERMINAL_LINES.map((l, i) => (
            <div key={i} className={`terminal-line ${l.cls}`}>
              {l.text === '' ? <>&nbsp;</> : l.text}
            </div>
          ))}
        </div>
      )}

      {tab === 'Tasks' && (
        <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
          {[
            { label: 'Scaffold Go backend', done: true },
            { label: 'Wails event binding for streaming', done: true },
            { label: 'ChatView component', done: true },
            { label: 'CommandBar with @ mention', done: false },
            { label: 'Model picker dropdown', done: false },
            { label: 'Settings panel', done: false },
            { label: 'Sidebar collapse animation', done: false },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid ' + (t.done ? '#34d39966' : 'var(--border-m)'), background: t.done ? '#34d39922' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {t.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 4.5l2.5 2.5 4-4"/></svg>}
              </div>
              <span style={{ fontSize: 12.5, color: t.done ? 'var(--tx-4)' : 'var(--tx-2)', textDecoration: t.done ? 'line-through' : 'none' } as any}>{t.label}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Diff' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.65 } as any}>
          <div style={{ color: '#4a4a4a', marginBottom: 10, fontSize: 11 }}>diff --git a/frontend/src/components/ChatView.tsx</div>
          {[
            ['+', 'const [expanded, setExpanded] = useState(false);', '#34d39944'],
            ['+', 'onClick={() => setExpanded(e => !e)}', '#34d39944'],
            ['-', '// no expand logic', '#f8717144'],
            ['+', '{expanded && tool.output && (', '#34d39944'],
            ['+', '  <pre>{tool.output}</pre>', '#34d39944'],
            ['+', ')}', '#34d39944'],
          ].map(([sign, text, bg], i) => (
            <div key={i} style={{ background: bg, padding: '1px 8px', borderRadius: 3, marginBottom: 1, color: sign === '+' ? '#34d399' : '#f87171' }}>
              {sign} {text}
            </div>
          ))}
        </div>
      )}

      {(tab === 'Preview' || tab === 'Plan') && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tx-4)', fontSize: 13 }}>
          {tab} panel
        </div>
      )}
    </div>
  );
}
