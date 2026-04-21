import React, { useState, useEffect, useRef } from 'react';

// ─── Logo mark ───────────────────────────────────────────────────────────────
export function CodePadMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="var(--accent)"/>
      <path d="M6 20L9 20L12 11L16 29L20 13L24 26L27 20L34 20"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── Skills data + panel ──────────────────────────────────────────────────────
const SKILLS = [
  { id: 'review',   label: 'Code Review',     desc: 'Analyze and review the current changes for bugs, style, and logic.',
    icon: 'M2 3h9l3 3v9H2zm4 4h5m-5 2.5h5m-5 2.5h3' },
  { id: 'tests',    label: 'Write Tests',      desc: 'Generate unit and integration tests for selected code.',
    icon: 'M2 10L5 7l3 3L5 13zm0 0L5 7M9 4h5v5H9zM9 10h5v5H9z' },
  { id: 'explain',  label: 'Explain Code',     desc: 'Get a plain-language explanation of any function or module.',
    icon: 'M1.5 7.5s2.5-4 5-4 5 4 5 4-2.5 4-5 4-5-4-5-4zm5 0a1 1 0 100.01' },
  { id: 'debug',    label: 'Debug Session',    desc: 'Interactively identify and fix errors with agent assistance.',
    icon: 'M5 2.5C5 2.5 4.5 1.5 6.5 1.5S8 2.5 8 2.5M3.5 4.5C2.5 4 1 4 .5 5.5M9.5 4.5C10.5 4 12 4 12.5 5.5M4.5 4.5h4v6a2 2 0 01-4 0v-6z' },
  { id: 'docs',     label: 'Generate Docs',    desc: 'Write JSDoc, docstrings, or README sections from code.',
    icon: 'M1.5 2h10v11H1.5zM4 5h5M4 7.5h5M4 10h3' },
  { id: 'refactor', label: 'Refactor',         desc: 'Clean up structure, naming, and patterns without changing behavior.',
    icon: 'M2 7h7M2 10h9M2 4h5M11 2v11' },
  { id: 'commit',   label: 'Commit Message',   desc: 'Generate a conventional commit message from staged changes.',
    icon: 'M1 6.5s2.5-4 5.5-4 5.5 4 5.5 4-2.5 4-5.5 4-5.5-4-5.5-4zm4 0L7.5 9l4-4' },
  { id: 'pr',       label: 'PR Description',   desc: 'Draft a pull request description based on the diff.',
    icon: 'M2 2h9v1.5L9 5l2 1.5V8H2zm2.5 5v4M7.5 7v4M4.5 11h3' },
];

function SkillsPanel({ onClose, onRun }: any) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--panel)', border: '1px solid var(--border-m)',
        borderRadius: 16, width: 580, maxHeight: '70vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        zIndex: 30, animation: 'scaleIn 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', letterSpacing: -0.2 }}>Skills</div>
            <div style={{ fontSize: 12, color: 'var(--tx-3)', marginTop: 2 }}>Pre-built agent programs for common tasks</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12"/>
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div style={{ overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKILLS.map(skill => (
            <button
              key={skill.id}
              onClick={() => { onRun(skill); onClose(); }}
              onMouseEnter={() => setHovered(skill.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === skill.id ? 'var(--active)' : 'var(--card)',
                border: '1px solid ' + (hovered === skill.id ? 'var(--border-h)' : 'var(--border)'),
                borderRadius: 10, padding: '13px 14px', cursor: 'pointer',
                textAlign: 'left', transition: 'background 0.15s, border-color 0.15s',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={hovered === skill.id ? 'var(--accent)' : 'var(--tx-3)'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.15s', flexShrink: 0 }}>
                  <path d={skill.icon}/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', lineHeight: 1 }}>{skill.label}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.55, margin: 0 }}>{skill.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Welcome screen ──────────────────────────────────────────────────────────
export function WelcomeScreen({ onOpenFolder, onNewSession }: any) {
  const [skillsOpen, setSkillsOpen] = useState(false);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Subtle grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 30%, transparent 100%)',
        opacity: 0.6,
      } as any} />

      {/* Content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <CodePadMark size={52} />
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--tx)', letterSpacing: -0.8, marginTop: 14, lineHeight: 1 }}>
            CodePad
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--tx-3)', marginTop: 7, letterSpacing: 0.1 }}>
            Open-source AI coding agent
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: 440 }}>
          <ActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="2" x2="10" y2="18"/>
                <line x1="2" y1="10" x2="18" y2="10"/>
              </svg>
            }
            title="New session"
            desc="Start a fresh agent session in your project"
            kbd="⌘N"
            onClick={onNewSession || onOpenFolder}
            accent
          />
          <ActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="7" height="7" rx="1.5"/>
                <rect x="11" y="3" width="7" height="7" rx="1.5"/>
                <rect x="2" y="12" width="7" height="7" rx="1.5"/>
                <rect x="11" y="12" width="7" height="7" rx="1.5"/>
              </svg>
            }
            title="Skills"
            desc="Browse pre-built agent programs"
            kbd="⌘S"
            onClick={() => setSkillsOpen(true)}
          />
        </div>

        {/* Keyboard hint */}
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          {[['⌘K', 'command palette'], ['⌘,', 'settings'], ['⌘⇧T', 'terminal']].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ fontSize: 10.5, color: 'var(--tx-4)', background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace', letterSpacing: 0.3 }}>{k}</kbd>
              <span style={{ fontSize: 11, color: 'var(--tx-5)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills panel */}
      {skillsOpen && (
        <SkillsPanel
          onClose={() => setSkillsOpen(false)}
          onRun={(skill: any) => { onNewSession && onNewSession(skill.label); }}
        />
      )}
    </div>
  );
}

function ActionCard({ icon, title, desc, kbd, onClick, accent }: any) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--active)' : 'var(--card)',
        border: '1px solid ' + (hov ? (accent ? 'var(--accent-border)' : 'var(--border-h)') : 'var(--border-m)'),
        borderRadius: 12, padding: '18px 16px 16px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
        display: 'flex', flexDirection: 'column', gap: 10,
        outline: accent && hov ? '1px solid var(--accent)' : 'none',
        outlineOffset: -1,
      } as any}
    >
      <div style={{ color: accent ? 'var(--accent)' : 'var(--tx-3)', transition: 'color 0.15s' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--tx-3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <kbd style={{ alignSelf: 'flex-end', fontSize: 10, color: 'var(--tx-4)', background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace' }}>{kbd}</kbd>
    </button>
  );
}

// ─── Tool block ───────────────────────────────────────────────────────────────
function ToolBlock({ tool }: any) {
  const [expanded, setExpanded] = useState(false);
  const done = tool.status === 'done';
  return (
    <div style={{ marginBottom: 3 }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--tx-3)', padding: '2px 0', textAlign: 'left', width: '100%',
      }}>
        {done ? (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#34d399" strokeWidth="1.3"/>
            <path d="M4 6.5l2 2 3.5-3.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, animation: 'spin 1.2s linear infinite' } as any}>
            <circle cx="6.5" cy="6.5" r="5" stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="9 5" fill="none"/>
          </svg>
        )}
        <span style={{ fontFamily: "'SF Mono','JetBrains Mono',monospace", fontSize: 12.5, color: 'var(--tx-3)', lineHeight: 1 }}>{tool.label}</span>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="var(--tx-4)" strokeWidth="1.3" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', marginLeft: 2 }}>
          <path d="M2.5 1.5l4 3-4 3"/>
        </svg>
      </button>
      {expanded && (tool.input || tool.output) && (
        <div style={{
          marginTop: 5, marginLeft: 20, marginBottom: 6,
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '10px 12px',
          fontFamily: "'SF Mono','JetBrains Mono',monospace",
          fontSize: 11.5, color: 'var(--tx-3)', lineHeight: 1.65,
          whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10,
        } as any}>
          {tool.input && (
            <div>
              <div style={{ color: 'var(--tx-4)', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input</div>
              <div style={{ color: 'var(--tx-2)' }}>{tool.input}</div>
            </div>
          )}
          {tool.output && (
            <div>
              {tool.input && <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />}
              <div style={{ color: 'var(--tx-4)', marginBottom: 4, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</div>
              <div style={{ color: 'var(--tx-3)' }}>{tool.output}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ lang, code }: any) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-m)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--tx-4)', fontFamily: 'monospace' }}>{lang || 'code'}</span>
        <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : 'var(--tx-4)', fontSize: 11, padding: '1px 4px', transition: 'color 0.2s' }}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{ background: 'var(--panel)', padding: '14px', margin: 0, fontFamily: "'SF Mono','JetBrains Mono',monospace", fontSize: 12.5, color: 'var(--tx)', overflowX: 'auto', lineHeight: 1.65, tabSize: 2 } as any}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ fontFamily: "'SF Mono','JetBrains Mono',monospace", fontSize: '0.88em', color: '#c8a96e', background: 'var(--card)', padding: '1px 5px', borderRadius: 4 }}>{part.slice(1,-1)}</code>;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) return <strong key={j} style={{ color: 'var(--tx)' }}>{bp.slice(2,-2)}</strong>;
      return bp;
    });
  });
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    if (line === '') return <div key={i} style={{ height: 5 }} />;
    if (line.startsWith('**') && line.endsWith('**'))
      return <p key={i} style={{ fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>{line.slice(2,-2)}</p>;
    if (line.match(/^[•\-] /))
      return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 2 }}><span style={{ color: 'var(--tx-4)', flexShrink: 0, marginTop: 1 }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
    if (line.match(/^\d+\. /))
      return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 2 }}><span style={{ color: 'var(--tx-3)', flexShrink: 0, fontSize: 12, minWidth: 16 }}>{line.match(/^\d+/)![0]}.</span><span>{renderInline(line.replace(/^\d+\. /, ''))}</span></div>;
    return <p key={i} style={{ marginBottom: 4 }}>{renderInline(line)}</p>;
  });
}

function AgentMessage({ msg }: any) {
  return (
    <div style={{ paddingBottom: 16 }}>
      {msg.parts.map((part: any, i: number) => {
        if (part.type === 'text') return <div key={i} style={{ fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.75, marginBottom: 6 }}>{renderText(part.content)}</div>;
        if (part.type === 'tool') return <ToolBlock key={i} tool={part} />;
        if (part.type === 'code') return <CodeBlock key={i} lang={part.lang} code={part.code} />;
        if (part.type === 'done') return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--tx-5)', fontFamily: "'SF Mono',monospace", whiteSpace: 'nowrap' }}>{part.text}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        );
        if (part.type === 'error') return <div key={i} style={{ background: 'var(--card)', border: '1px solid #3a1a1a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 8 }}>{part.content}</div>;
        return null;
      })}
    </div>
  );
}

function UserMessage({ msg }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, paddingLeft: 64 }}>
      <div style={{ background: 'var(--user-bubble)', border: '1px solid var(--user-bubble-border)', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.65 }}>
        {msg.content}
      </div>
    </div>
  );
}

export function ChatView({ messages, streaming, streamParts, streamText }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, streamText]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 0 200px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 36px' }}>
        {messages.map((msg: any, i: number) =>
          msg.role === 'user' ? <UserMessage key={i} msg={msg} /> : <AgentMessage key={i} msg={msg} />
        )}
        {streaming && (
          <div style={{ fontSize: 13.5, color: 'var(--tx)', lineHeight: 1.75 }}>
            {streamParts && streamParts.map((part: any, i: number) => {
              if (part.type === 'text') return <div key={i}>{renderText(part.content)}</div>;
              if (part.type === 'tool') return <ToolBlock key={i} tool={part} />;
              return null;
            })}
            {streamText && <span>{streamText}<span style={{ animation: 'blink 0.8s step-end infinite', color: 'var(--accent)', marginLeft: 1 }}>▋</span></span>}
          </div>
        )}
      </div>
    </div>
  );
}
