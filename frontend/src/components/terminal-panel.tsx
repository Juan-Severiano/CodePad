import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { X } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import '@xterm/xterm/css/xterm.css';

// Usamos any para acessar as funções injetadas globais do Wails, caso as tipagens não estejam prontas
declare global {
  interface Window {
    go: any;
    runtime: any;
  }
}

export function TerminalPanel() {
  const { toggleTerminal } = useAppStore();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);
  const sessionId = "main-tty";

  useEffect(() => {
    if (!terminalRef.current) return;

    // Inicializa o Xterm
    const term = new Terminal({
      theme: {
        background: '#0f0f0f',
        foreground: '#ffffff',
        cursor: '#d97757',
        cursorAccent: '#0f0f0f',
        selectionBackground: 'rgba(217, 119, 87, 0.3)',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Listener para resize da janela
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Inicializa PTY no backend e conecta eventos
    const initPTY = async () => {
      try {
        if (window.go && window.go.main && window.go.main.App) {
          await window.go.main.App.SpawnPTY(sessionId, "");
          
          // Escutar dados do backend
          if (window.runtime && window.runtime.EventsOn) {
            window.runtime.EventsOn(`pty-data:${sessionId}`, (data: string) => {
              term.write(data);
            });
          }

          // Enviar keystrokes do usuário para o backend
          term.onData((data) => {
            window.go.main.App.WritePTY(sessionId, data);
          });
          
          setIsReady(true);
        } else {
          term.writeln("\x1b[31m[Erro] Bindings do Wails não encontrados. Certifique-se de executar via 'wails dev'.\x1b[0m");
        }
      } catch (err) {
        term.writeln(`\x1b[31m[Erro PTY]\x1b[0m ${err}`);
      }
    };

    // Atraso sutil para garantir que os bindings do Wails carregaram
    setTimeout(initPTY, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      // Opcional: emitir um comando para matar a sessão PTY se necessário
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f0f] relative">
      {/* Header do Terminal */}
      <div className="h-10 flex items-center justify-between px-3 bg-[#141414] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#a1a1a1] uppercase tracking-wide">Terminal</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500/80' : 'bg-yellow-500/80 animate-pulse'}`} title={isReady ? 'Conectado' : 'Conectando...'}></div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={toggleTerminal}
            className="p-1 rounded hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Container Xterm */}
      <div className="flex-1 p-2 overflow-hidden bg-[#0f0f0f]" ref={terminalRef}></div>
    </div>
  );
}
