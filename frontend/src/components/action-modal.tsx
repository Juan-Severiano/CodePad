import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

export function ActionModal() {
  const [prompt, setPrompt] = useState<{ id: string; question: string } | null>(null);

  useEffect(() => {
    const handleActionRequired = (data: any) => {
      setPrompt({
        id: data.prompt_id,
        question: data.question
      });
    };

    if ((window as any).runtime && (window as any).runtime.EventsOn) {
      (window as any).runtime.EventsOn("action-required", handleActionRequired);
    }

    return () => {
      if ((window as any).runtime && (window as any).runtime.EventsOff) {
        (window as any).runtime.EventsOff("action-required");
      }
    };
  }, []);

  const handleReply = async (reply: string) => {
    if (!prompt) return;
    try {
      if ((window as any).go && (window as any).go.main && (window as any).go.main.App) {
        await (window as any).go.main.App.SendAgentInput(prompt.id, reply);
      }
      setPrompt(null);
    } catch (err) {
      console.error("Failed to send reply", err);
    }
  };

  if (!prompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1c1c1c] border border-[#333] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a2a2a] bg-[#141414]">
          <AlertCircle className="text-yellow-500" size={20} />
          <h3 className="text-white font-semibold tracking-wide">Action Required</h3>
        </div>
        
        <div className="p-6">
          <p className="text-[#d1d1d1] font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {prompt.question}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-[#141414] border-t border-[#2a2a2a]">
          <button 
            onClick={() => handleReply("n")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#a1a1a1] hover:text-white bg-[#2a2a2a] hover:bg-[#333] border border-[#333] rounded-lg transition-colors"
          >
            <X size={16} />
            Reject
          </button>
          <button 
            onClick={() => handleReply("y")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors shadow-sm"
          >
            <Check size={16} />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
