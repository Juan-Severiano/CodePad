# 🚀 Project: OpenAgent Desktop (Claude Code Clone)

## 1. Visão Geral
Um centro de comando de agentes autônomos para desktop, focado em performance e controle visual de múltiplos provedores (Claude, Gemini, Codex). O objetivo é ser um orquestrador de tarefas de engenharia de software que atua diretamente no sistema de arquivos do usuário.

---

## 2. Requisitos Funcionais (RF)

### RF01: Detecção Automática de Provedores (CLI Bridge)
- O sistema deve escanear o `$PATH` do usuário ao iniciar para detectar binários instalados (`claude`, `gh`, `gemini-cli`, etc).
- Deve permitir a configuração manual de chaves de API caso o binário não esteja instalado.

### RF02: Loop Agêntico Visual (Plan-Execute-Verify)
- A interface deve exibir em tempo real o "raciocínio" do agente (Pensando -> Planejando -> Executando -> Validando).
- O usuário deve poder interromper o agente a qualquer momento.

### RF03: Visual Diff & Aprovação
- Antes de salvar alterações no disco, o app deve exibir um `Side-by-Side Diff` (Estilo VS Code).
- O sistema só deve persistir a mudança após clique em "Approve" ou comando `Ctrl+Enter`.

### RF04: Sistema de Snapshots (Undo Inteligente)
- O backend em Go deve criar um backup temporário de cada arquivo antes da edição do agente.
- Deve haver um histórico de "Time Travel" para reverter alterações em massa.

### RF05: Terminal Integrado PTY
- O app deve possuir um terminal (Xterm.js) integrado que compartilha o mesmo contexto da IA.
- A IA deve poder injetar comandos no terminal (com pedido de autorização do usuário).

### RF06: Suporte a MCP (Model Context Protocol)
- O app deve ser capaz de se conectar a servidores MCP locais ou remotos para estender as capacidades da IA (ex: ler Google Drive, Jira ou Slack).

### RF07: Rotinas e Automação (Crons)
- Permitir o agendamento de tarefas (ex: "Revisar logs a cada 2 horas e abrir PR se houver erro").

---

## 3. Requisitos Não Funcionais (RNF)

### RNF01: Performance e Memória
- O aplicativo em repouso não deve consumir mais de 100MB de RAM.
- O executável final deve ter menos de 20MB.

### RNF02: Interface de Usuário (UI/UX)
- A interface deve ser construída com **Tailwind CSS**, seguindo um design "Dark Mode First" e minimalista.
- Animações de transição de estado de agente devem ser fluidas (usando Framer Motion ou Anime.js).

### RNF03: Segurança (Sandboxing)
- Toda execução de comando de escrita ou exclusão deve disparar um pop-up de permissão visual, a menos que o usuário ative o "Auto-pilot mode".

### RNF04: Multiplataforma
- O código deve ser compilável para macOS (Darwin), Windows e Linux via Wails.