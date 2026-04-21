import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore, AgentEvent } from '../store/app-store';

// ─── Types ────────────────────────────────────────────────────────────────────

type VisualBlock =
  | { kind: 'user';  id: string; content: string }
  | { kind: 'text';  id: string; content: string }
  | { kind: 'tool';  id: string; toolId: string; name: string; args: string; result?: string; done: boolean }
  | { kind: 'done';  id: string; content: string }
  | { kind: 'error'; id: string; content: string };

// ─── Event → VisualBlock processor ───────────────────────────────────────────

function processEvents(events: AgentEvent[]): VisualBlock[] {
  const blocks: VisualBlock[] = [];
  const toolIdx = new Map<string, number>();

  for (const ev of events) {
    if (ev.type === 'user_input') {
      blocks.push({ kind: 'user', id: ev.id, content: ev.content });
      continue;
    }

    if (ev.type === 'agent_text') {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'text') {
        last.content += ev.content;
      } else {
        blocks.push({ kind: 'text', id: ev.id, content: ev.content });
      }
      continue;
    }

    if (ev.type === 'agent_tool_start') {
      const idx = blocks.length;
      toolIdx.set(ev.toolId ?? ev.id, idx);
      blocks.push({
        kind: 'tool', id: ev.id,
        toolId: ev.toolId ?? ev.id,
        name: ev.toolName ?? 'tool',
        args: ev.content,
        done: false,
      });
      continue;
    }

    if (ev.type === 'agent_tool_result') {
      const tid = ev.toolId ?? '';
      const idx = toolIdx.get(tid);
      if (idx !== undefined && blocks[idx]?.kind === 'tool') {
        (blocks[idx] as Extract<VisualBlock, { kind: 'tool' }>).result = ev.content;
        (blocks[idx] as Extract<VisualBlock, { kind: 'tool' }>).done = true;
      }
      continue;
    }

    if (ev.type === 'agent_done') {
      blocks.push({ kind: 'done', id: ev.id, content: ev.content });
      continue;
    }

    if (ev.type === 'agent_error') {
      blocks.push({ kind: 'error', id: ev.id, content: ev.content });
      continue;
    }
  }

  return blocks;
}

// ─── ToolBlock ────────────────────────────────────────────────────────────────

function toolLabel(name: string, args: string): string {
  try {
    const parsed = JSON.parse(args);
    if (parsed.command)    return `${name}: ${String(parsed.command).slice(0, 60)}`;
    if (parsed.path)       return `${name}: ${parsed.path}`;
    if (parsed.file_path)  return `${name}: ${parsed.file_path}`;
    if (parsed.pattern)    return `${name}: ${parsed.pattern}`;
  } catch {}
  return name;
}

function ToolBlock({ block }: { block: Extract<VisualBlock, { kind: 'tool' }> }) {
  const [expanded, setExpanded] = useState(false);
  const { done, name, args, result } = block;
  const label = toolLabel(name, args);

  return (
    <div style={{ marginBottom: 3 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555', padding: '2px 0', textAlign: 'left', width: '100%',
        }}
      >
        {/* Status icon */}
        {done ? (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#34d399" strokeWidth="1.3" />
            <path d="M4 6.5l2 2 3.5-3.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, animation: 'spin 1.2s linear infinite' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="#d97757" strokeWidth="1.3" strokeDasharray="9 5" fill="none" />
          </svg>
        )}

        {/* Label */}
        <span style={{
          fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Mono', monospace",
          fontSize: 12.5, color: '#5a5a5a', lineHeight: 1,
        }}>{label}</span>

        {/* Chevron (right, rotates 90° when expanded) */}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#3a3a3a" strokeWidth="1.3" strokeLinecap="round"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', marginLeft: 2, flexShrink: 0 }}>
          <path d="M2.5 1.5l4 3-4 3" />
        </svg>
      </button>

      {/* Expanded output */}
      {expanded && (result || args) && (
        <div style={{
          marginTop: 5, marginLeft: 20, marginBottom: 6,
          background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 7,
          padding: '10px 12px',
          fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          fontSize: 11.5, color: '#777', lineHeight: 1.65,
          whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
        }}>
          {result || args}
        </div>
      )}
    </div>
  );
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ lang, children }: { lang?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid #222' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px', background: '#141414', borderBottom: '1px solid #222',
      }}>
        <span style={{ fontSize: 11, color: '#4a4a4a', fontFamily: 'monospace' }}>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : '#4a4a4a', fontSize: 11, padding: '1px 4px', transition: 'color 0.2s' }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        background: '#0a0a0a', padding: 14, margin: 0,
        fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
        fontSize: 12.5, color: '#c0c0c0', overflowX: 'auto', lineHeight: 1.65,
        tabSize: 2,
      }}><code>{children}</code></pre>
    </div>
  );
}

// ─── AgentMarkdown ────────────────────────────────────────────────────────────

function AgentMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p style={{ marginBottom: 4, color: '#c8c8c8', fontSize: 13.5, lineHeight: 1.75 }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ color: '#e0e0e0', fontWeight: 600 }}>{children}</strong>
        ),
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const raw = String(children).replace(/\n$/, '');
          if (match || raw.includes('\n')) {
            return <CodeBlock lang={match?.[1]}>{raw}</CodeBlock>;
          }
          return (
            <code style={{
              fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
              fontSize: '0.88em', color: '#c8a96e',
              background: '#1a1a1a', padding: '1px 5px', borderRadius: 4,
            }}>{children}</code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        ul: ({ children }) => (
          <ul style={{ paddingLeft: 0, margin: '4px 0 8px', listStyle: 'none' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol style={{ paddingLeft: 0, margin: '4px 0 8px', listStyle: 'none' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <div style={{ display: 'flex', gap: 8, marginBottom: 3, paddingLeft: 2 }}>
            <span style={{ color: '#444', flexShrink: 0, marginTop: 1 }}>•</span>
            <span style={{ color: '#c8c8c8', fontSize: 13.5, lineHeight: 1.75 }}>{children}</span>
          </div>
        ),
        h1: ({ children }) => <h1 style={{ fontSize: 16, color: '#e0e0e0', fontWeight: 600, margin: '16px 0 8px' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 14.5, color: '#e0e0e0', fontWeight: 600, margin: '14px 0 6px' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 13.5, color: '#e0e0e0', fontWeight: 600, margin: '12px 0 4px' }}>{children}</h3>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer"
            style={{ color: '#d97757', textDecoration: 'underline' }}>{children}</a>
        ),
        blockquote: ({ children }) => (
          <blockquote style={{
            borderLeft: '2px solid #2a2a2a', paddingLeft: 12, margin: '8px 0',
            color: '#777', fontStyle: 'italic',
          }}>{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function UserBlock({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, paddingLeft: 64 }}>
      <div style={{
        background: '#1a1a2e', border: '1px solid #252540',
        borderRadius: 12, padding: '10px 14px',
        fontSize: 13.5, color: '#c8c8d8', lineHeight: 1.65, maxWidth: '100%',
      }}>
        {content}
      </div>
    </div>
  );
}

function TextBlock({ content }: { content: string }) {
  return (
    <div style={{ paddingBottom: 8 }}>
      <AgentMarkdown content={content} />
    </div>
  );
}

function DoneBlock({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 4px' }}>
      <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
      <span style={{
        fontSize: 11, color: '#333',
        fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap',
      }}>{content}</span>
      <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
    </div>
  );
}

function ErrorBlock({ content }: { content: string }) {
  return (
    <div style={{
      background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 8,
      padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 8,
    }}>{content}</div>
  );
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export function ChatView() {
  const { chatHistory } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const blocks = processEvents(chatHistory);

  // Check if we're actively streaming (any tool without a result yet)
  const isStreaming = chatHistory.length > 0 &&
    chatHistory[chatHistory.length - 1]?.type === 'agent_tool_start' &&
    !chatHistory.find(e => e.type === 'agent_tool_result' &&
      e.toolId === chatHistory[chatHistory.length - 1]?.toolId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory.length]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 0 200px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 36px' }}>
        {blocks.map(block => {
          switch (block.kind) {
            case 'user':  return <UserBlock  key={block.id} content={block.content} />;
            case 'text':  return <TextBlock  key={block.id} content={block.content} />;
            case 'tool':  return <ToolBlock  key={block.id} block={block} />;
            case 'done':  return <DoneBlock  key={block.id} content={block.content} />;
            case 'error': return <ErrorBlock key={block.id} content={block.content} />;
          }
        })}

        {/* Streaming cursor */}
        {isStreaming && (
          <span style={{ fontSize: 13.5, color: '#d97757', animation: 'blink 0.8s step-end infinite' }}>▋</span>
        )}
      </div>
    </div>
  );
}
