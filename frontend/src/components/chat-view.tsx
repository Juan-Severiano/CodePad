import React, { useEffect, useRef } from 'react';
import { useAppStore, AgentEvent } from '../store/app-store';
import { User, TerminalSquare, AlertCircle, CheckCircle2, Zap, Copy } from 'lucide-react';

export function ChatView() {
  const { chatHistory } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (chatHistory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#666] select-none">
        <TerminalSquare size={48} className="mb-4 opacity-20" />
        <p className="text-sm">No conversation yet.</p>
        <p className="text-xs mt-1">Create a session and type a command to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {chatHistory.map((event) => (
        <EventBubble key={event.id} event={event} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function EventBubble({ event }: { event: AgentEvent }) {
  if (event.type === 'user_input') {
    return (
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center gap-2 text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
          <User size={14} className="text-[#d97757]" />
          <span>You</span>
        </div>
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-[#e0e0e0] text-sm shadow-sm inline-block w-full max-w-2xl whitespace-pre-wrap font-sans">
          {event.content}
        </div>
      </div>
    );
  }

  if (event.type === 'agent_text') {
    return (
      <div className="flex items-start gap-4 w-full border-l-2 border-[#d97757] pl-4 ml-1.5 py-1">
        <TerminalSquare size={16} className="text-[#d97757] mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#d97757]">Agent</span>
          <span className="text-[#d1d1d1] text-[13px] leading-relaxed font-sans whitespace-pre-wrap">
            {event.content}
          </span>
        </div>
      </div>
    );
  }

  if (event.type === 'agent_tool_start') {
    return (
      <div className="flex items-start gap-4 w-full border-l-2 border-[#0088cc] pl-4 ml-1.5 py-1">
        <Zap size={16} className="text-[#0088cc] mt-0.5 shrink-0 animate-pulse" />
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0088cc]">Tool: {event.toolName}</span>
          <code className="text-[#888] text-[12px] bg-[#0f0f0f] p-2 rounded border border-[#2a2a2a] font-mono overflow-x-auto">
            {event.content}
          </code>
        </div>
      </div>
    );
  }

  if (event.type === 'agent_tool_result') {
    return (
      <div className="flex items-start gap-4 w-full border-l-2 border-[#4caf50] pl-4 ml-1.5 py-1">
        <CheckCircle2 size={16} className="text-[#4caf50] mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#4caf50]">Result: {event.toolName}</span>
          <pre className="text-[#888] text-[12px] bg-[#0f0f0f] p-2 rounded border border-[#2a2a2a] font-mono overflow-x-auto whitespace-pre-wrap">
            {event.content.length > 500 ? event.content.substring(0, 500) + '...' : event.content}
          </pre>
        </div>
      </div>
    );
  }

  if (event.type === 'agent_error') {
    return (
      <div className="flex items-start gap-4 w-full border-l-2 border-[#ff6b6b] pl-4 ml-1.5 py-1">
        <AlertCircle size={16} className="text-[#ff6b6b] mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff6b6b]">Error</span>
          <span className="text-[#ff6b6b] text-[13px] leading-relaxed font-mono whitespace-pre-wrap">
            {event.content}
          </span>
        </div>
      </div>
    );
  }

  if (event.type === 'agent_done') {
    return (
      <div className="flex items-start gap-4 w-full border-l-2 border-[#4caf50] pl-4 ml-1.5 py-1">
        <CheckCircle2 size={16} className="text-[#4caf50] mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#4caf50]">Completed</span>
          <span className="text-[#888] text-[12px]">
            {event.content}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
