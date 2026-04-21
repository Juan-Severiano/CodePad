import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/app-store';

function SourceBadge({ label, color }: any) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, color, background: color + '18', border: `1px solid ${color}30`, letterSpacing: '0.04em', lineHeight: 1 }}>
      {label}
    </span>
  );
}

function ProviderRow({ providerId, auth, onSave, onTest, onLoginWithClaude }: any) {
  const [showKey, setShowKey]     = useState(false);
  const [testState, setTestState] = useState<string | null>(null);
  const [inputVal, setInputVal]   = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const handleTest = async () => { 
    setTestState('testing'); 
    const res = await onTest(providerId);
    setTestState(res);
    setTimeout(() => setTestState(null), 3000);
  };

  const handleSave = async () => {
    if (!inputVal.trim()) return;
    await onSave(providerId, inputVal.trim());
    setInputVal('');
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onLoginWithClaude();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const nameMap: Record<string, string> = {
    'anthropic': 'Anthropic',
    'openai': 'OpenAI',
    'gemini': 'Google Gemini',
    'ollama': 'Ollama',
    'openrouter': 'OpenRouter'
  };

  const colorMap: Record<string, string> = {
    'env': '#34d399',
    'claude-cli': '#60a5fa',
    'settings': '#f59e0b',
    'local': '#a855f7',
    'none': '#f87171'
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, color: 'var(--tx)', fontWeight: 500 }}>{nameMap[providerId] || providerId}</span>
          <SourceBadge label={auth.source} color={colorMap[auth.source] || '#888'} />
        </div>
        {auth.configured && (
          <button onClick={handleTest} style={{ fontSize: 11.5, color: testState === 'ok' ? '#34d399' : testState === 'error' ? '#f87171' : 'var(--tx-3)', background: 'none', border: '1px solid var(--border-m)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', transition: 'color 0.2s', fontFamily: 'inherit' }}>
            {testState === 'testing' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation: 'spin 1s linear infinite' } as any}>
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="7 3.5" fill="none"/>
                </svg>
                testing…
              </span>
            ) : testState === 'ok' ? '✓ connected' : testState ? `✗ ${testState}` : 'Test connection'}
          </button>
        )}
      </div>
      {auth.configured ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 11.5, color: 'var(--tx-4)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', letterSpacing: 0.3 }}>
            {showKey ? 'Key is hidden for security' : auth.masked}
          </div>
          {auth.source === 'settings' && (
             <button onClick={() => setShowKey(s => !s)}
             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: '7px 9px', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
             onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
             onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
           >
             <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
               <path d="M1 6.5s2.5-4 5.5-4 5.5 4 5.5 4-2.5 4-5.5 4-5.5-4-5.5-4z"/><circle cx="6.5" cy="6.5" r="1.5"/>
               {showKey && <line x1="2" y1="2" x2="11" y2="11"/>}
             </svg>
           </button>
          )}
          {auth.source !== 'settings' && <span style={{ fontSize: 10.5, color: 'var(--tx-5)', whiteSpace: 'nowrap' }}>{auth.source} · read‑only</span>}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: providerId === 'anthropic' ? 8 : 0 }}>
            <input type="password" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Paste API key…"
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--tx)', fontSize: 12.5, fontFamily: 'monospace', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'var(--border-h)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button onClick={handleSave} style={{ background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 6, color: 'var(--tx-3)', cursor: 'pointer', padding: '0 14px', fontSize: 12.5, transition: 'color 0.15s', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-3)')}
            >Save</button>
          </div>
          {providerId === 'anthropic' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={handleLogin} disabled={isLoggingIn} style={{ width: '100%', background: 'rgba(217, 119, 87, 0.15)', border: '1px solid rgba(217, 119, 87, 0.3)', borderRadius: 6, color: '#d97757', cursor: isLoggingIn ? 'default' : 'pointer', padding: '8px 14px', fontSize: 12.5, transition: 'all 0.15s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 500 }}
                onMouseEnter={e => { if(!isLoggingIn) e.currentTarget.style.background = 'rgba(217, 119, 87, 0.25)' }}
                onMouseLeave={e => { if(!isLoggingIn) e.currentTarget.style.background = 'rgba(217, 119, 87, 0.15)' }}
              >
                {isLoggingIn ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" style={{ animation: 'spin 1s linear infinite' } as any}>
                      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="7 3.5" fill="none"/>
                    </svg>
                    Opening browser...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Login with Claude
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: any) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tx-4)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 2, marginTop: 24 }}>{children}</div>;
}

function Toggle({ on, onChange }: any) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--card)', transition: 'background 0.2s', position: 'relative', flexShrink: 0 } as any}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: on ? '#fff' : 'var(--tx-4)', position: 'absolute', top: 3, left: on ? 19 : 3, transition: 'left 0.2s, background 0.2s' } as any} />
    </button>
  );
}

function PrefRow({ label, subtitle, children }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--tx-2)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--tx-4)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsPanel({ onClose }: any) {
  const { authStatus, saveProviderKey, testProviderConnection, loginWithClaude } = useAppStore();
  
  const [streamOn, setStreamOn]     = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [telemetry, setTelemetry]   = useState(false);
  const [contextTurns, setContextTurns] = useState(20);
  const [fontSize, setFontSize]     = useState(13);
  const [tab, setTab]               = useState('providers');

  const tabs = [
    { id: 'providers', label: 'Providers' },
    { id: 'prefs',     label: 'Preferences' },
    { id: 'ollama',    label: 'Ollama' },
    { id: 'about',     label: 'About' },
  ];

  const providerList = useMemo(() => {
    if (!authStatus) return [];
    return Object.entries(authStatus).map(([id, auth]) => ({ id, auth }));
  }, [authStatus]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, background: 'var(--sidebar)', borderLeft: '1px solid var(--border-m)', display: 'flex', flexDirection: 'column', zIndex: 50, animation: 'slideInRight 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' } as any}>

        {/* Header */}
        <div style={{ height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', letterSpacing: -0.2 }}>Settings</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-4)', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--tx-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-4)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? 'var(--tx)' : 'var(--tx-3)', fontSize: 12.5, padding: '10px 10px 8px', borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'), transition: 'color 0.15s, border-color 0.15s', fontFamily: 'inherit' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--tx-2)'; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = 'var(--tx-3)'; }}
            >{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px' }}>

          {tab === 'providers' && (
            <>
              <SectionTitle>API Keys</SectionTitle>
              {providerList.map(({ id, auth }) => (
                <ProviderRow 
                  key={id} 
                  providerId={id} 
                  auth={auth} 
                  onSave={saveProviderKey}
                  onTest={testProviderConnection}
                  onLoginWithClaude={loginWithClaude}
                />
              ))}
            </>
          )}

          {tab === 'prefs' && (
            <>
              <SectionTitle>Editor</SectionTitle>
              <PrefRow label="Chat font size" subtitle="Applies to message content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setFontSize(s => Math.max(11, s-1))} style={{ background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 5, color: 'var(--tx-3)', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'inherit' }}>−</button>
                  <span style={{ fontSize: 12, color: 'var(--tx-2)', fontFamily: 'monospace', minWidth: 28, textAlign: 'center' }}>{fontSize}px</span>
                  <button onClick={() => setFontSize(s => Math.min(18, s+1))} style={{ background: 'var(--card)', border: '1px solid var(--border-m)', borderRadius: 5, color: 'var(--tx-3)', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'inherit' }}>+</button>
                </div>
              </PrefRow>

              <SectionTitle>Agent</SectionTitle>
              <PrefRow label="Stream responses" subtitle="Show tokens as they arrive"><Toggle on={streamOn} onChange={setStreamOn} /></PrefRow>
              <PrefRow label="Auto-accept edits" subtitle="Apply file changes without confirmation"><Toggle on={autoAccept} onChange={setAutoAccept} /></PrefRow>
              <PrefRow label="Max context turns" subtitle="Older turns are trimmed automatically">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={5} max={50} step={5} value={contextTurns} onChange={e => setContextTurns(+e.target.value)} style={{ width: 80, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 12, color: 'var(--tx-3)', fontFamily: 'monospace', minWidth: 24, textAlign: 'right' }}>{contextTurns}</span>
                </div>
              </PrefRow>

              <SectionTitle>Privacy</SectionTitle>
              <PrefRow label="Usage telemetry" subtitle="Anonymous usage stats to improve CodePad"><Toggle on={telemetry} onChange={setTelemetry} /></PrefRow>
            </>
          )}

          {tab === 'ollama' && (
            <>
              <SectionTitle>Local server</SectionTitle>
              <div style={{ padding: '12px 0 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d39966' }} />
                  <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>Running on <code style={{ fontFamily: 'monospace', color: 'var(--tx-3)', fontSize: 12 }}>localhost:11434</code></span>
                </div>
                <PrefRow label="Host">
                  <input defaultValue="http://localhost:11434" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', color: 'var(--tx-3)', fontSize: 12, fontFamily: 'monospace', outline: 'none', width: 180 }}
                    onFocus={e => (e.target.style.borderColor = 'var(--border-h)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </PrefRow>
              </div>
              <SectionTitle>Available models</SectionTitle>
              {['llama3.2:latest', 'qwen2.5-coder:7b', 'mistral:7b', 'deepseek-coder:6.7b'].map(m => (
                <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--tx-2)', fontFamily: 'monospace' }}>{m}</span>
                  <span style={{ fontSize: 11, color: 'var(--tx-4)' }}>local</span>
                </div>
              ))}
              <button style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-m)', borderRadius: 7, color: 'var(--tx-3)', cursor: 'pointer', padding: '7px 14px', fontSize: 12.5, transition: 'color 0.15s, border-color 0.15s', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--tx)'; e.currentTarget.style.borderColor = 'var(--border-h)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-3)'; e.currentTarget.style.borderColor = 'var(--border-m)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
                Pull new model
              </button>
            </>
          )}

          {tab === 'about' && (
            <>
              <SectionTitle>Version</SectionTitle>
              <div style={{ padding: '16px 0 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="10" fill="var(--accent)"/>
                    <path d="M6 20L9 20L12 11L16 29L20 13L24 26L27 20L34 20" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', letterSpacing: -0.4 }}>CodePad</div>
                    <div style={{ fontSize: 11.5, color: 'var(--tx-4)', fontFamily: 'monospace' }}>v0.1.0 · build 20260421</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx-4)', fontFamily: 'monospace', lineHeight: 1.9 }}>
                  <div>Wails v2.9 · Go 1.22</div>
                  <div>React 18 · Babel 7</div>
                </div>
              </div>
              <SectionTitle>Links</SectionTitle>
              {[['Documentation','#'],['GitHub','#'],['Report an issue','#'],['Changelog','#']].map(([label, href]) => (
                <a key={label} href={href} onClick={e => e.preventDefault()}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>{label}</span>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--tx-4)" strokeWidth="1.4" strokeLinecap="round"><path d="M2 9L9 2M9 2H4M9 2v5"/></svg>
                </a>
              ))}
              <SectionTitle>Storage</SectionTitle>
              <div style={{ padding: '10px 0', fontSize: 11.5, color: 'var(--tx-4)', fontFamily: 'monospace', lineHeight: 2 }}>
                <div>Config: ~/.codepad/settings.json</div>
                <div>Sessions: ~/.codepad/sessions/</div>
                <div>Keys encrypted at rest (mode 0600)</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
