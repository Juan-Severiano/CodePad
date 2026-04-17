import React, { useState, useEffect } from 'react';
import { X, FolderOpen, GitBranch, Clock, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/app-store';

const MODELS = [
  { id: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'claude-opus-4-7',    label: 'Claude Opus 4.7',   provider: 'Anthropic' },
  { id: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5',  provider: 'Anthropic' },
  { id: 'gpt-4o',             label: 'GPT-4o',             provider: 'OpenAI' },
  { id: 'gpt-4o-mini',        label: 'GPT-4o mini',        provider: 'OpenAI' },
];

type Step = 'folder' | 'session';

export function NewSessionDialog() {
  const {
    newSessionDialogOpen,
    closeNewSessionDialog,
    createProjectFromDir,
    createSession,
    recentDirs,
    loadRecentDirs,
    detectGitBranch,
  } = useAppStore();

  const [step, setStep] = useState<Step>('folder');
  const [workingDir, setWorkingDir] = useState('');
  const [gitBranchLocal, setGitBranchLocal] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [useWorktree, setUseWorktree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);

  useEffect(() => {
    if (newSessionDialogOpen) {
      loadRecentDirs();
    }
  }, [newSessionDialogOpen, loadRecentDirs]);

  if (!newSessionDialogOpen) return null;

  const folderName = workingDir.split('/').filter(Boolean).pop() || '';

  const handlePickDir = async () => {
    try {
      const app = (window as any).go?.main?.App;
      if (!app) return;
      const path = await app.PickDirectory();
      if (path) await selectDir(path);
    } catch (err) {
      console.error(err);
    }
  };

  const selectDir = async (path: string) => {
    setWorkingDir(path);
    try {
      const app = (window as any).go?.main?.App;
      if (app) {
        const branch = await app.GetGitBranch(path);
        setGitBranchLocal(branch || '');
      }
    } catch {
      setGitBranchLocal('');
    }
    setStep('session');
  };

  const handleCreate = async () => {
    if (!sessionTitle.trim() || !workingDir) return;
    try {
      setIsLoading(true);
      const project = await createProjectFromDir(workingDir);
      if (!project) return;
      await createSession(project.id, sessionTitle, selectedModel);
      detectGitBranch(workingDir);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    closeNewSessionDialog();
    setStep('folder');
    setWorkingDir('');
    setGitBranchLocal('');
    setSessionTitle('');
    setSelectedModel('claude-sonnet-4-6');
    setUseWorktree(false);
    setCreatedProject(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161616] border border-[#252525] rounded-xl w-full max-w-[460px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252525]">
          <h2 className="text-sm font-semibold text-white">
            {step === 'folder' ? 'New Project' : folderName}
          </h2>
          <button onClick={handleClose} className="p-1 rounded text-[#666] hover:text-white hover:bg-[#252525] transition-colors">
            <X size={16} />
          </button>
        </div>

        {step === 'folder' ? (
          <div className="p-4 flex flex-col gap-3">
            {/* Open Finder */}
            <button
              onClick={handlePickDir}
              className="flex items-center gap-3 p-3.5 rounded-lg border border-[#252525] hover:border-[#3a3a3a] hover:bg-[#1c1c1c] transition-all group text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#252525] flex items-center justify-center shrink-0 group-hover:bg-[#2a2a2a] transition-colors">
                <FolderOpen size={17} className="text-[#a1a1a1]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Open folder</p>
                <p className="text-xs text-[#666]">Choose from Finder</p>
              </div>
              <ChevronRight size={15} className="text-[#555] group-hover:text-[#888] transition-colors shrink-0" />
            </button>

            {/* Recent Folders */}
            {recentDirs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Clock size={11} className="text-[#555]" />
                  <span className="text-[11px] text-[#555] uppercase tracking-wide font-medium">Recent</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {recentDirs.map(dir => {
                    const name = dir.split('/').filter(Boolean).pop() || dir;
                    const parent = dir.split('/').slice(0, -1).join('/');
                    return (
                      <button
                        key={dir}
                        onClick={() => selectDir(dir)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1c1c1c] transition-colors group text-left"
                      >
                        <FolderOpen size={14} className="text-[#555] group-hover:text-[#888] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#a1a1a1] group-hover:text-white truncate">{name}</p>
                          <p className="text-[11px] text-[#555] truncate">{parent}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {recentDirs.length === 0 && (
              <p className="text-center text-xs text-[#555] py-4">No recent folders</p>
            )}
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            {/* Folder Info */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#1c1c1c] border border-[#252525]">
              <FolderOpen size={15} className="text-[#888] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{folderName}</p>
                <p className="text-[11px] text-[#555] truncate mt-0.5">{workingDir}</p>
                {gitBranchLocal && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <GitBranch size={11} className="text-[#888]" />
                    <span className="text-[11px] text-[#888]">{gitBranchLocal}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setStep('folder'); setWorkingDir(''); }}
                className="text-[#555] hover:text-white text-[11px] underline shrink-0"
              >
                change
              </button>
            </div>

            {/* Worktree Option */}
            {gitBranchLocal && (
              <button
                onClick={() => setUseWorktree(!useWorktree)}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#252525] hover:border-[#3a3a3a] hover:bg-[#1c1c1c] transition-all text-left"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  useWorktree ? 'bg-[#d97757] border-[#d97757]' : 'border-[#3a3a3a]'
                }`}>
                  {useWorktree && <Check size={10} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm text-white">Use git worktree</p>
                  <p className="text-xs text-[#555]">Work on a separate branch without affecting main</p>
                </div>
              </button>
            )}

            {/* Session Title */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-2">Session</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="What are you working on?"
                autoFocus
                className="w-full bg-[#1c1c1c] border border-[#252525] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#444] focus:border-[#3a3a3a] outline-none transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-2">Model</label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODELS.slice(0, 4).map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                      selectedModel === model.id
                        ? 'border-[#d97757]/50 bg-[#d97757]/10 text-white'
                        : 'border-[#252525] text-[#888] hover:border-[#3a3a3a] hover:text-white hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div>
                      <p className="text-[12px] font-medium truncate">{model.label.replace('Claude ', '').replace('GPT-', 'GPT-')}</p>
                      <p className="text-[10px] text-[#555]">{model.provider}</p>
                    </div>
                    {selectedModel === model.id && <Check size={12} className="text-[#d97757] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-[#252525] text-[#888] rounded-lg hover:bg-[#1c1c1c] hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!sessionTitle.trim() || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d97757] hover:bg-[#e08060] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
