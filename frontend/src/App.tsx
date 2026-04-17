import React, { useEffect } from 'react';
import { LateralNav } from './components/lateral-nav';
import { MainPanel } from './components/main-panel';
import { RightSidebar } from './components/right-sidebar';
import { useAppStore } from './store/app-store';
import { ActionModal } from './components/action-modal';

const runtime = (window as any).runtime;

export default function App() {
  const { addChatEvent, loadProjects, loadRecentDirs } = useAppStore();

  useEffect(() => {
    loadProjects();
    loadRecentDirs();
  }, [loadProjects, loadRecentDirs]);

  useEffect(() => {
    if (!runtime) return;

    const listeners = [
      runtime.EventsOn("agent-text", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-text-${Date.now()}`,
          type: 'agent_text',
          content: data.text,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-tool-start", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-tool-${data.tool_id}`,
          type: 'agent_tool_start',
          content: data.args,
          toolName: data.tool_name,
          toolId: data.tool_id,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-tool-result", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-result-${data.tool_id}`,
          type: 'agent_tool_result',
          content: data.output,
          toolName: data.tool_name,
          toolId: data.tool_id,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-done", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-done-${Date.now()}`,
          type: 'agent_done',
          content: `Completed: ${data.input_tokens} input, ${data.completion_tokens} output tokens`,
          timestamp: Date.now()
        });
      }),

      runtime.EventsOn("agent-error", (data: any) => {
        addChatEvent({
          id: `${data.session_id}-error-${Date.now()}`,
          type: 'agent_error',
          content: data.error,
          timestamp: Date.now()
        });
      })
    ];

    return () => {
      if (!runtime) return;
      runtime.EventsOff("agent-text");
      runtime.EventsOff("agent-tool-start");
      runtime.EventsOff("agent-tool-result");
      runtime.EventsOff("agent-done");
      runtime.EventsOff("agent-error");
    };
  }, [addChatEvent]);

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#0f0f0f] text-white font-sans selection:bg-[#d97757] selection:text-white">
      <LateralNav />
      <MainPanel />
      <RightSidebar />
      <ActionModal />
    </div>
  );
}
