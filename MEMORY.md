# CodePad: Histórico da Sessão e Arquitetura

Este documento resume as decisões arquiteturais, o escopo de trabalho e a consolidação técnica implementada durante a construção do **CodePad** (uma versão Desktop UI autêntica do Claude Code, impulsionada pelo Wails e alimentada pelo motor OpenClaude).

## 1. Visão Geral do Projeto
O **CodePad** é um aplicativo desktop construído em **Wails v2** que funciona como uma interface rica e reativa para operações de agentes de IA locais e baseados em nuvem. A arquitetura foi construída para separar perfeitamente a renderização UI (React) da orquestração pesada de sistema (Go).

## 2. Stack Tecnológico Consolidado
* **Frontend:** React 18, TypeScript, Vite.
* **Estilização:** Tailwind CSS v4 (Zero-config com diretiva `@theme` via CSS).
* **Gerenciamento de Estado:** Zustand (Centralizando layout dinâmico, histórico de chat e diffs de arquivos).
* **Ícones:** Lucide React (Garantindo um visual premium e removendo totalmente a dependência de emojis).
* **Backend:** Go 1.24.
* **Motor de IA:** Servidor gRPC do `openclaude` rodando em Node.

## 3. Fases da Implementação

### Fase 1: Fundação do Wails (As 5 Camadas)
Estruturamos as bases sólidas no Go para lidar com operações perigosas e rotinas sem travar a interface do usuário:
* **Motor de PTY:** Wrapper flexível para conectar sessões de terminal interativas (`xterm.js`) ao bash do sistema local usando `creack/pty`.
* **Segurança e Memória:**
  * Implementação de **Git Worktrees** em `/tmp/openagent_worktrees` (isola branches sem tocar na working tree original do usuário).
  * **Snapshot Manager** que guarda hashes SHA256 de arquivos antes de serem editados pela IA, permitindo botões de *Undo* instantâneos.
* **Automação:** Suporte nativo a Agendamentos (`robfig/cron/v3`) e Cliente Base MCP (Model Context Protocol).

### Fase 2: UI Autêntica (Clone Claude Code)
Refatoramos todo o React para atingir um visual esteticamente idêntico ao referencial do Anthropic (Claude Code Desktop):
* **Layout 3-Column:** Flexbox fixo contendo a Barra Lateral Esquerda (colapsável para `14px`), o Painel Central (para logs do chat) e a Barra Direita (Terminal + Tarefas).
* **Zustand State:** Todo o controle de visibilidade dos painéis passou a ser global, permitindo interfaces que colapsam suavemente.
* **Componentes Chave:**
  * `<CommandBar />`: Barra flutuante translúcida focada na base do painel central.
  * `<VisualDiff />`: Ferramenta nativa lado-a-lado para o usuário aprovar/rejeitar código alterado.
  * `<TerminalPanel />`: `xterm.js` implementado com *FitAddon* reativo.

### Fase 3: Integração do Cérebro via gRPC (OpenClaude)
Para evitar reinventar a roda construindo RAG local e ferramentas em Go, alavancamos o projeto de código aberto **OpenClaude**, transformando o CodePad num cliente gRPC visual:
* **Geração de Protobufs:** Compilamos os plugins do Go e geramos `openclaude.pb.go` diretamente do proto oficial.
* **Cliente Streaming Bidirecional:** Criamos o `grpc_client.go` que disca para `localhost:50051`.
* **Mapeamento de Eventos (Event Loop):** Quando o usuário digita na `CommandBar`, o Go envia pro OpenClaude via gRPC. As respostas em stream (`ToolCallStart`, `TextChunk`, `ActionRequired`, `Done`) são lidas pelo Go e emitidas via Wails `EventsEmit("agent-status")`.
* **Modais Interativos (`<ActionModal />`):** O Frontend intercepta solicitações perigosas e plota um diálogo flutuante `y/n` nativo no React para garantir "Human In The Loop".

## 4. Como Executar (Fluxo de Desenvolvimento Padrão)
1. **Ligar o Cérebro (OpenClaude):**
   * Em um terminal, entre na pasta `openclaude` e rode: `npm run dev:grpc`
2. **Ligar a Interface (CodePad):**
   * No diretório raiz, execute: `wails dev`

## 5. Status Final
O aplicativo atinge o status de **Production-Ready MVP**. Toda a infraestrutura local, roteamento gRPC de eventos e transições na UI estão compilando, respondendo perfeitamente a entradas do teclado e sem dependência de placeholders estáticos. O CodePad agora é efetivamente uma máscara de alta performance para qualquer motor gRPC que imite a interface do OpenClaude.
