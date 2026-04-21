import React, { useState } from 'react';
import { useAppStore, ProviderAuthStatus } from '../store/app-store';

// ─── Provider definitions ─────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-api03-…',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    placeholder: 'AIza…',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
];

// ─── SourceBadge ─────────────────────────────────────────────────────────────

function sourceColor(source: ProviderAuthStatus['source']): string {
  switch (source) {
    case 'env':        return '#34d399';
    case 'claude-cli': return '#60a5fa';
    case 'settings':   return '#888';
    case 'local':      return '#888';
    case 'none':       return '#f87171';
  }
}

function sourceLabel(source: ProviderAuthStatus['source']): string {
  switch (source) {
    case 'env':        return 'ENV';
    case 'claude-cli': return 'Claude CLI';
    case 'settings':   return 'Saved';
    case 'local':      return 'Local';
    case 'none':       return 'Not set';
  }
}

function SourceBadge({ source }: { source: ProviderAuthStatus['source'] }) {
  const color = sourceColor(source);
  const label = sourceLabel(source);
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
      color: color, background: color + '18', border: `1px solid ${color}2a`,
      letterSpacing: '0.04em', lineHeight: 1,
    }}>{label}</span>
  );
}

// ─── ProviderRow ──────────────────────────────────────────────────────────────

function ProviderRow({
  id, name, placeholder, docsUrl, status,
}: {
  id: string; name: string; placeholder: string; docsUrl: string;
  status: ProviderAuthStatus | undefined;
}) {
  const { saveProviderKey, testProviderConnection } = useAppStore();

  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testState, setTestState] = useState<null | 'testing' | 'ok' | string>(null);

  const configured = status?.configured ?? false;
  const source = status?.source ?? 'none';
  const masked = status?.masked ?? '';
  const isReadonly = source === 'env' || source === 'claude-cli';

  const handleTest = async () => {
    setTestState('testing');
    const result = await testProviderConnection(id);
    setTestState(result === 'ok' ? 'ok' : result);
  };

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await saveProviderKey(id, keyInput.trim());
      setKeyInput('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #1c1c1c' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, color: '#d0d0d0', fontWeight: 500 }}>{name}</span>
          <SourceBadge source={source} />
        </div>
        {configured && (
          <button
            onClick={handleTest}
            style={{
              fontSize: 11.5, color: testState === 'ok' ? '#34d399' : '#666',
              background: 'none', border: '1px solid #252525', borderRadius: 5,
              padding: '3px 9px', cursor: 'pointer', transition: 'color 0.2s',
            }}
          >
            {testState === 'testing' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="7 3.5" fill="none" />
                </svg>
                testing
              </span>
            ) : testState === 'ok' ? '✓ ok' : 'Test'}
          </button>
        )}
      </div>

      {/* Test error */}
      {testState && testState !== 'ok' && testState !== 'testing' && (
        <div style={{
          fontSize: 11.5, color: '#f87171',
          background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 6,
          padding: '6px 10px', marginBottom: 8,
        }}>{testState}</div>
      )}

      {/* Configured provider — display box */}
      {configured ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{
            flex: 1, fontFamily: 'monospace', fontSize: 12,
            color: '#555', background: '#111', border: '1px solid #1e1e1e',
            borderRadius: 6, padding: '7px 10px', letterSpacing: 0.3,
          }}>
            {showKey ? (masked || '(hidden)') : (masked ? masked : '••••••••')}
          </div>
          <button
            onClick={() => setShowKey(s => !s)}
            style={{
              background: 'none', border: '1px solid #252525', borderRadius: 6,
              cursor: 'pointer', color: '#555', padding: '7px 9px',
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#999')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              {showKey ? (
                <>
                  <path d="M1 6.5s2.5-4 5.5-4 5.5 4 5.5 4-2.5 4-5.5 4-5.5-4-5.5-4z" />
                  <circle cx="6.5" cy="6.5" r="1.5" />
                  <line x1="2" y1="2" x2="11" y2="11" />
                </>
              ) : (
                <>
                  <path d="M1 6.5s2.5-4 5.5-4 5.5 4 5.5 4-2.5 4-5.5 4-5.5-4-5.5-4z" />
                  <circle cx="6.5" cy="6.5" r="1.5" />
                </>
              )}
            </svg>
          </button>
          {isReadonly && (
            <span style={{ fontSize: 10.5, color: '#3a3a3a' }}>read‑only</span>
          )}
        </div>
      ) : (
        /* Unconfigured provider — input */
        <div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder={placeholder}
              style={{
                flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: 6,
                padding: '7px 10px', color: '#d0d0d0', fontSize: 12.5,
                fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#333')}
              onBlur={e => (e.target.style.borderColor = '#1e1e1e')}
            />
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || saving}
              style={{
                background: '#1c1c1c', border: '1px solid #282828', borderRadius: 6,
                color: saving ? '#555' : '#888', cursor: keyInput.trim() ? 'pointer' : 'default',
                padding: '0 14px', fontSize: 12.5,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (keyInput.trim()) e.currentTarget.style.color = '#ccc'; }}
              onMouseLeave={e => (e.currentTarget.style.color = '#888')}
            >
              {saving ? '…' : 'Save'}
            </button>
          </div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11.5, color: '#d97757', textDecoration: 'none', marginTop: 7, display: 'inline-block', opacity: 0.85 }}
          >
            Get API key →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── SettingsPanel ────────────────────────────────────────────────────────────

export function SettingsPanel() {
  const { settingsOpen, toggleSettings, authStatus } = useAppStore();

  if (!settingsOpen) return null;

  const ollamaStatus = authStatus?.['ollama'];
  const ollamaRunning = ollamaStatus?.configured ?? false;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={toggleSettings}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: '#161616', borderLeft: '1px solid #222',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        animation: 'slideInRight 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}>
        {/* Header */}
        <div style={{
          height: 74, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '0 20px 14px', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0' }}>Settings</span>
          <button
            onClick={toggleSettings}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

          {/* Authentication */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Authentication
            </div>
            {PROVIDERS.map(p => (
              <ProviderRow
                key={p.id}
                {...p}
                status={authStatus?.[p.id]}
              />
            ))}
          </section>

          {/* Local — Ollama */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Local (Ollama)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: ollamaRunning ? '#34d399' : '#444',
                boxShadow: ollamaRunning ? '0 0 6px #34d39966' : 'none',
              }} />
              <span style={{ fontSize: 13, color: '#777' }}>
                {ollamaRunning
                  ? <>Running on <span style={{ fontFamily: 'monospace', color: '#555' }}>localhost:11434</span></>
                  : 'Not detected — install from ollama.com'}
              </span>
            </div>
          </section>

          {/* Preferences */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Preferences
            </div>
            {[
              ['Theme',              'Dark'],
              ['Editor font size',   '13px'],
              ['Auto-accept edits',  'Off'],
              ['Max context turns',  '20'],
              ['Stream responses',   'On'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #191919' }}>
                <span style={{ fontSize: 13, color: '#777' }}>{label}</span>
                <span style={{ fontSize: 12, color: '#444', fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
          </section>

          {/* About */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              About
            </div>
            <div style={{ fontSize: 12, color: '#3a3a3a', fontFamily: 'monospace', lineHeight: 1.8 }}>
              <div>CodePad v0.1.0</div>
              <div>Wails v2 · Go 1.22 · React 18</div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a1a', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#2e2e2e', fontFamily: 'monospace' }}>
            Keys saved to ~/.codepad/settings.json (mode 0600)
          </span>
        </div>
      </div>
    </>
  );
}
