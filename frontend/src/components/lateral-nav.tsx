import React, { useEffect, useState } from 'react';
import { useAppStore, Session } from '../store/app-store';
import { Loader } from 'lucide-react';

// ─── SVG atoms ────────────────────────────────────────────────────────────────

function DashedCircle({ color = '#555' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" stroke={color} strokeWidth="1.5" strokeDasharray="2.8 2.2" fill="none" />
    </svg>
  );
}

function SpinnerCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" stroke="#d97757" strokeWidth="1.5" strokeDasharray="10 5" fill="none" />
    </svg>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ iconPath, label }: { iconPath: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: hovered ? '#191919' : 'none',
        border: 'none', cursor: 'pointer', color: '#777',
        padding: '6px 10px', borderRadius: 6, fontSize: 13, textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d={iconPath} />
      </svg>
      {label}
    </button>
  );
}

// ─── SessionItem ──────────────────────────────────────────────────────────────

function SessionItem({
  session, isActive, onClick, onDelete,
}: {
  session: Session; isActive: boolean; onClick: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 8px 5px 14px', cursor: 'pointer', borderRadius: 6,
        background: isActive ? '#1f1f1f' : hovered ? '#191919' : 'transparent',
        transition: 'background 0.12s', marginBottom: 1,
      }}
    >
      {/* Status icon */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {session.status === 'running' ? (
          <SpinnerCircle />
        ) : session.status === 'error' ? (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
        ) : (
          <DashedCircle color={isActive ? '#888' : '#555'} />
        )}
      </div>

      {/* Title */}
      <span style={{
        fontSize: 12, color: isActive ? '#ddd' : '#777',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        lineHeight: 1.4,
      }}>{session.title}</span>

      {/* Delete */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: '1px 2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" /><line x1="9.5" y1="1.5" x2="1.5" y2="9.5" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── LateralNav ───────────────────────────────────────────────────────────────

export function LateralNav() {
  const {
    leftSidebarOpen,
    toggleLeftSidebar,
    projects,
    sessions,
    activeSession,
    loadSessions,
    setActiveProject,
    setActiveSession,
    deleteProject,
    deleteSession,
    resetToWelcome,
    toggleSettings,
  } = useAppStore();

  const collapsed = !leftSidebarOpen;

  useEffect(() => {
    projects.forEach(p => {
      if (!sessions[p.id]) loadSessions(p.id);
    });
  }, [projects]);

  return (
    <div style={{
      width: collapsed ? 48 : 260,
      minWidth: collapsed ? 48 : 260,
      background: '#161616',
      borderRight: '1px solid #222',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      userSelect: 'none',
      flexShrink: 0,
    }}>

      {/* Traffic lights (52px, draggable) */}
      <div
        style={{
          height: 52, display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 6, flexShrink: 0,
        }}
        // @ts-ignore
        data-webkit-app-region="drag"
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
        {!collapsed && (
          <div style={{ display: 'flex', gap: 10, marginLeft: 10 }}>
            {/* Sidebar layout icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#444" strokeWidth="1.3" strokeLinecap="round">
              <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />
              <line x1="5" y1="2.5" x2="5" y2="11.5" />
            </svg>
            {/* Forward arrow icon */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#444" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="5.5" cy="7" r="3.5" />
              <path d="M8.5 7h4" /><path d="M10.5 5.5l2 1.5-2 1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Top nav row (38px) */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: 38, gap: 4, flexShrink: 0 }}>
        {/* Toggle sidebar */}
        <button
          onClick={toggleLeftSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#888')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444')}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <rect x="1.5" y="2" width="12" height="11" rx="2" />
            <line x1="5.5" y1="2" x2="5.5" y2="13" />
          </svg>
        </button>

        {!collapsed && (
          <>
            {/* Arrow forward button */}
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2 7.5h11M8.5 3.5l4 4-4 4" />
              </svg>
            </button>

            {/* "Code" badge with pulse icon */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#1d1d1d', border: '1px solid #2a2a2a', borderRadius: 6,
              padding: '3px 9px', marginLeft: 6,
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#d97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1.5,9 3.5,3.5 6,7 7.5,5" />
                <polyline points="7.5,5 9.5,3" />
              </svg>
              <span style={{ fontSize: 11, color: '#ddd', fontWeight: 500, letterSpacing: 0.3 }}>Code</span>
            </div>
          </>
        )}
      </div>

      {/* New session button */}
      <div style={{ padding: '2px 8px', flexShrink: 0 }}>
        {collapsed ? (
          <button
            onClick={resetToWelcome}
            title="New session"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', width: '100%', padding: 8, display: 'flex', justifyContent: 'center', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="7" y1="1.5" x2="7" y2="12.5" /><line x1="1.5" y1="7" x2="12.5" y2="7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={resetToWelcome}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#999', padding: '6px 10px', borderRadius: 6, fontSize: 13,
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1c1c1c'; e.currentTarget.style.color = '#ccc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#999'; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="6.5" y1="1" x2="6.5" y2="12" /><line x1="1" y1="6.5" x2="12" y2="6.5" />
            </svg>
            New session
          </button>
        )}
      </div>

      {/* Nav items */}
      {!collapsed && (
        <div style={{ padding: '2px 8px 8px', flexShrink: 0 }}>
          <NavItem iconPath="M2 5h10M2 7.5h7.5M2 10h5" label="Routines" />
          <NavItem iconPath="M2 3.5h9.5l-1 7H3L2 3.5zm2.5-2h4" label="Dispatch" />
          <NavItem iconPath="M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 3v2.5l2 2" label="Customize" />
          <NavItem iconPath="M7 6.5a.5.5 0 100 1 .5.5 0 000-1zm-3.5 0a.5.5 0 100 1 .5.5 0 000-1zm7 0a.5.5 0 100 1 .5.5 0 000-1" label="More" />
        </div>
      )}

      {/* Divider */}
      {!collapsed && <div style={{ height: 1, background: '#1e1e1e', margin: '0 8px 8px', flexShrink: 0 }} />}

      {/* Projects & sessions list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 6px' : '0 8px' }}>
        {!collapsed && (
          <div style={{ padding: '4px 10px 4px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#3a3a3a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
              Pinned
            </div>
            <div style={{ fontSize: 12, color: '#3a3a3a', padding: '2px 0 8px', fontStyle: 'italic' }}>
              Drag to pin
            </div>
          </div>
        )}

        {projects.map(project => {
          const projectSessions = sessions[project.id];
          const isLoading = !projectSessions;

          return (
            <div key={project.id} style={{ marginBottom: 10 }}>
              {!collapsed && (
                <div className="group" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px 5px' }}>
                  <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#4a4a4a', letterSpacing: '0.07em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </span>
                  {isLoading ? (
                    <Loader size={10} className="animate-spin" style={{ color: '#555', flexShrink: 0 }} />
                  ) : null}
                </div>
              )}

              {/* Sessions */}
              {!isLoading && !collapsed && (
                <div>
                  {projectSessions.length === 0 ? (
                    <span style={{ fontSize: 11, color: '#444', padding: '2px 14px', display: 'block', fontStyle: 'italic' }}>No sessions</span>
                  ) : (
                    projectSessions.map(session => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={activeSession?.id === session.id}
                        onClick={() => {
                          setActiveProject(project);
                          setActiveSession(session);
                        }}
                        onDelete={() => deleteSession(session.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Collapsed — just icons */}
              {collapsed && !isLoading && projectSessions.map(session => (
                <div
                  key={session.id}
                  title={session.title}
                  onClick={() => { setActiveProject(project); setActiveSession(session); }}
                  style={{ display: 'flex', justifyContent: 'center', padding: '5px 0', cursor: 'pointer' }}
                >
                  {session.status === 'running' ? <SpinnerCircle /> :
                    session.status === 'error' ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} /> :
                      <DashedCircle />}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom user footer */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '10px 0' : '10px 12px',
        borderTop: '1px solid #1e1e1e', flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#222', border: '1px solid #2e2e2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#666', fontWeight: 600, flexShrink: 0,
        }}>FJ</div>

        {!collapsed && (
          <>
            <span style={{ fontSize: 12, color: '#777', flex: 1 }}>Francisco Juan</span>
            <button
              onClick={toggleSettings}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#444')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <circle cx="7" cy="7" r="2.2" />
                <path d="M7 1.5V3M7 11v1.5M1.5 7H3M11 7h1.5M2.9 2.9l1.1 1.1M10 10l1.1 1.1M11.1 2.9L10 4M4 10l-1.1 1.1" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
