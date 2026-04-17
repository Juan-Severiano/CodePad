import React, { useState } from 'react';
import { useAppStore, Session } from '../store/app-store';
import {
  MessageSquare, SlidersHorizontal, Code2, Settings, User,
  Plus, RefreshCw, Wrench, Send, ChevronDown, ChevronRight, Trash2, Loader
} from 'lucide-react';

export function LateralNav() {
  const {
    leftSidebarOpen,
    toggleLeftSidebar,
    projects,
    sessions,
    activeProject,
    activeSession,
    loadSessions,
    setActiveProject,
    setActiveSession,
    openNewSessionDialog,
    deleteProject,
    deleteSession,
    toggleSettings,
  } = useAppStore();

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [loadingProject, setLoadingProject] = useState<string | null>(null);

  const handleProjectClick = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setActiveProject(project);

    if (!expandedProjects.has(projectId)) {
      setLoadingProject(projectId);
      await loadSessions(projectId);
      setLoadingProject(null);
      setExpandedProjects(prev => new Set([...prev, projectId]));
    } else {
      setExpandedProjects(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  return (
    <div
      className={`bg-[#161616] h-full flex flex-col border-r border-[#252525] shrink-0 transition-all duration-200 ${
        leftSidebarOpen ? 'w-[260px]' : 'w-12'
      }`}
    >
      {/* Top Icons Row - Claude Code style */}
      {leftSidebarOpen ? (
        <div className="h-[52px] flex items-center px-4 gap-3 shrink-0 border-b border-[#252525]">
          <button onClick={toggleLeftSidebar} className="text-[#888] hover:text-white transition-colors p-1 rounded hover:bg-[#252525]">
            <MessageSquare size={16} />
          </button>
          <button className="text-[#888] hover:text-white transition-colors p-1 rounded hover:bg-[#252525]">
            <SlidersHorizontal size={16} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 bg-[#252525] px-2.5 py-1 rounded-md">
            <Code2 size={13} className="text-white" />
            <span className="text-white text-xs font-medium">Code</span>
          </div>
        </div>
      ) : (
        <div className="h-[52px] flex items-center justify-center shrink-0 border-b border-[#252525]">
          <button onClick={toggleLeftSidebar} className="text-[#888] hover:text-white transition-colors p-1.5 rounded hover:bg-[#252525]">
            <MessageSquare size={16} />
          </button>
        </div>
      )}

      {/* Nav Items */}
      <div className={`flex flex-col py-3 gap-0.5 shrink-0 ${leftSidebarOpen ? 'px-2' : 'px-1 items-center'}`}>
        <NavItem icon={<Plus size={16} />} label="New session" isOpen={leftSidebarOpen} onClick={openNewSessionDialog} />
        <NavItem icon={<RefreshCw size={16} />} label="Routines" isOpen={leftSidebarOpen} />
        <NavItem icon={<Wrench size={16} />} label="Customize" isOpen={leftSidebarOpen} />
        <NavItem icon={<Send size={16} />} label="Dispatch" isOpen={leftSidebarOpen} />
        {leftSidebarOpen && (
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[#888] hover:text-white hover:bg-[#252525] transition-colors w-full text-[13px]">
            <ChevronDown size={16} />
            <span>More</span>
          </button>
        )}
      </div>

      {/* Projects & Sessions */}
      <div className={`flex-1 overflow-y-auto ${leftSidebarOpen ? 'px-2' : 'px-1 items-center flex flex-col'}`}>
        {leftSidebarOpen && projects.length > 0 && (
          <div className="mt-2 flex flex-col gap-0.5">
            {projects.map(project => {
              const isExpanded = expandedProjects.has(project.id);
              const isActive = activeProject?.id === project.id;
              const projectSessions = sessions[project.id] || [];

              return (
                <div key={project.id}>
                  <div
                    className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors ${
                      isActive ? 'text-[#a1a1a1]' : 'text-[#666] hover:text-[#a1a1a1] hover:bg-[#252525]'
                    }`}
                  >
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className="flex items-center gap-1.5 flex-1 min-w-0"
                    >
                      {loadingProject === project.id ? (
                        <Loader size={13} className="animate-spin shrink-0 text-[#666]" />
                      ) : isExpanded ? (
                        <ChevronDown size={13} className="shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="shrink-0" />
                      )}
                      <span className="text-[11px] font-medium uppercase tracking-wider truncate">{project.name}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 flex flex-col gap-0.5 mt-0.5 mb-2">
                      {projectSessions.length === 0 && (
                        <span className="text-[11px] text-[#555] px-2 py-1 italic">No sessions</span>
                      )}
                      {projectSessions.map(session => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={activeSession?.id === session.id}
                          onClick={() => { setActiveProject(project); setActiveSession(session); }}
                          onDelete={() => deleteSession(session.id)}
                        />
                      ))}
                      <button
                        onClick={openNewSessionDialog}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[#555] hover:text-[#888] transition-colors text-[12px] mt-0.5"
                      >
                        <Plus size={11} />
                        <span>New session</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`shrink-0 border-t border-[#252525] p-2 flex items-center ${leftSidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center gap-2 ${leftSidebarOpen ? '' : 'justify-center w-full'}`}>
          <div className="w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[10px] font-semibold text-[#a1a1a1] shrink-0">
            FJ
          </div>
          {leftSidebarOpen && (
            <span className="text-[#666] text-[12px] font-medium">Francisco Juan</span>
          )}
        </div>
        {leftSidebarOpen && (
          <button
            onClick={toggleSettings}
            className="p-1.5 rounded hover:bg-[#252525] text-[#666] hover:text-white transition-colors"
          >
            <Settings size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  isOpen,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`flex items-center transition-colors rounded-md ${
        isOpen ? 'gap-2.5 px-2 py-1.5 w-full' : 'justify-center p-2 w-full'
      } ${
        active
          ? 'text-white bg-[#252525]'
          : 'text-[#888] hover:text-white hover:bg-[#252525]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {isOpen && <span className="text-[13px]">{label}</span>}
    </button>
  );
}

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
}: {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 px-2 py-1 rounded-md text-left w-full transition-colors ${
        isActive ? 'bg-[#252525] text-white' : 'text-[#888] hover:text-white hover:bg-[#252525]'
      }`}
    >
      <StatusDot status={session.status} />
      <span className="flex-1 text-[12px] truncate">{session.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all shrink-0"
      >
        <Trash2 size={11} />
      </button>
    </button>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === 'running') return <Loader size={10} className="animate-spin text-[#d97757] shrink-0" />;
  if (status === 'error')   return <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />;
  return <div className="w-1.5 h-1.5 rounded-full bg-[#444] shrink-0" />;
}
