import React, { useState } from 'react';

function DashedCircle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="var(--tx-4)" strokeWidth="1.5" strokeDasharray="2.8 2.2" fill="none"/>
    </svg>
  );
}

function SpinnerCircle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" stroke="var(--accent)" strokeWidth="1.5"
        strokeDasharray="10 5" fill="none"/>
    </svg>
  );
}

function SessionItem({ session, isActive, onClick, onDelete }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 8px 5px 14px', cursor: 'pointer', borderRadius: 6,
        background: isActive ? 'var(--active)' : hovered ? 'var(--hover)' : 'transparent',
        transition: 'background 0.12s', marginBottom: 1,
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {session.status === 'running' ? <SpinnerCircle /> :
         session.status === 'error' ?
           <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} /> :
         <DashedCircle />}
      </div>
      <span style={{
        fontSize: 12, color: isActive ? 'var(--tx)' : 'var(--tx-2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        lineHeight: 1.4,
      }}>{session.title}</span>
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete && onDelete(session.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: '1px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1.5" y1="1.5" x2="9.5" y2="9.5"/><line x1="9.5" y1="1.5" x2="1.5" y2="9.5"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, projects, activeSessionId, onSelectSession, onNewSession, onOpenSettings }: any) {
  return (
    <div style={{
      width: collapsed ? 48 : 260,
      minWidth: collapsed ? 48 : 260,
      background: 'var(--sidebar)',
      borderRight: '1px solid var(--border-m)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Traffic lights */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
      </div>

      {/* Collapse toggle + branding */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: 38, gap: 4, flexShrink: 0 }}>
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="1.5" y="2" width="12" height="11" rx="2"/>
            <line x1="5.5" y1="2" x2="5.5" y2="13"/>
          </svg>
        </button>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--card)', border: '1px solid var(--border-h)',
            borderRadius: 6, padding: '3px 9px', marginLeft: 6,
          }}>
            {/* Mini waveform logo */}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 5.5L2.5 5.5L3.5 2.5L5 8.5L6.5 3.5L7.5 7L9 5.5L10 5.5"
                stroke="var(--accent)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--tx)', fontWeight: 600, letterSpacing: 0.3 }}>CodePad</span>
          </div>
        )}
      </div>

      {/* New session */}
      <div style={{ padding: '2px 8px', flexShrink: 0 }}>
        {collapsed ? (
          <button onClick={onNewSession} title="New session"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', width: '100%', padding: 8, display: 'flex', justifyContent: 'center', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="7" y1="1.5" x2="7" y2="12.5"/><line x1="1.5" y1="7" x2="12.5" y2="7"/>
            </svg>
          </button>
        ) : (
          <button onClick={onNewSession}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tx-3)', padding: '6px 10px', borderRadius: 6, fontSize: 13,
              transition: 'color 0.12s, background 0.12s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--active)'; e.currentTarget.style.color = 'var(--tx)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--tx-3)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="6.5" y1="1" x2="6.5" y2="12"/><line x1="1" y1="6.5" x2="12" y2="6.5"/>
            </svg>
            New session
          </button>
        )}
      </div>

      {/* Divider */}
      {!collapsed && <div style={{ height: 1, background: 'var(--border)', margin: '6px 8px 8px', flexShrink: 0 }} />}

      {/* Projects list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 6px' : '0 8px' }}>


        {projects.map((project: any) => (
          <div key={project.name} style={{ marginBottom: 10 }}>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--tx-4)', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px 5px' }}>
                {project.name}
              </div>
            )}
            {project.sessions.map((session: any) => (
              collapsed ? (
                <div key={session.id} title={session.title} onClick={() => onSelectSession(project.name, session)}
                  style={{ display: 'flex', justifyContent: 'center', padding: '5px 0', cursor: 'pointer' }}>
                  {session.status === 'running' ? <SpinnerCircle /> :
                   session.status === 'error' ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /> :
                   <DashedCircle />}
                </div>
              ) : (
                <SessionItem key={session.id} session={session}
                  isActive={activeSessionId === session.id}
                  onClick={() => onSelectSession(project.name, session)}
                />
              )
            ))}
          </div>
        ))}
      </div>

      {/* Bottom — settings only */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '10px 0' : '10px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0, justifyContent: 'center',
      }}>
        <button onClick={onOpenSettings} title="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.5"/>
            <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
