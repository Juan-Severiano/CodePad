Com certeza, Francisco. O levantamento de requisitos já está salvo em `requirements.md`.

Agora, adicionei também um arquivo `DESIGN.md` para guiar a implementação da interface com Tailwind v4. Pulei a parte de "preview" interativo por enquanto, conforme solicitado, focando na arquitetura de componentes modulares.

Aqui está o conteúdo do `DESIGN.md`:

### 📄 DESIGN.md (Especificação do Sistema de Design)

```markdown
# 🎨 Sistema de Design: CodePad

## 1. Visão Geral do Design
Uma interface modular, "Dark Mode First", projetada para minimizar a carga cognitiva e maximizar o espaço para o contexto do código. O layout é inspirado em painéis de orquestração ("centros de comando"), permitindo que componentes secundários sejam ocultados ou reorganizados.

## 2. Paleta de Cores (Definida no @theme do Tailwind v4)
Para manter o instalador leve, o tema é definido inteiramente através de variáveis CSS nativas no arquivo CSS principal (`src/main.css`).

```css
@import "tailwindcss";

@theme {
  /* Cores de Fundo */
  --color-ui-bg: #0f0f0f;         /* Fundo Principal */
  --color-panel-bg: #1c1c1c;      /* Fundo de Painéis Internos */
  
  /* Cores de Texto */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a1a1a1;
  
  /* Cores de Acento e Estado */
  --color-accent: #d97757;        /* Laranja para status do agente (Haiku) */
  --color-success: #4caf50;       /* Verde para Diffs aprovados */
  --color-terminal: #0088cc;      /* Azul para links de stacktrace e logs */
}
```

## 3. Arquitetura de Componentes e Layout Principal
O layout é um *grid* de três colunas arrastáveis e um rodapé fixo.

### 3.1. Barra Lateral (`LateralNav`)
Painel fixo à esquerda, otimizado para navegação rápida e contexto do usuário.
- **Classes-base:** `w-60 bg-panel-bg h-screen p-4 flex flex-col`
- **Elementos:**
    - Logo/Status do Agente (`image_0.png`)
    - Seções de navegação (`+ Nova Sessão`, `Rotinas`)
    - Contexto do Usuário (Avatar e Nome: "Francisco Juan")

### 3.2. Painel Central (`MainPanel`)
O workspace principal. Alterna entre visualizações baseadas no contexto.
- **Classes-base:** `flex-1 bg-ui-bg p-8 flex flex-col`
- **Estados Dinâmicos:**
    - **Dashboard (`image_0.png`):** Exibe estatísticas de uso (Sessões, Mensagens, Tokens).
    - **Lista de Tarefas (`image_1.png`):** Exibe tarefas ativas por repositório/projeto.
    - **Visual Diff (`image_2.png`):** Exibe as mudanças sugeridas lado a lado.

### 3.3. Painel de Ações (`ActionPanel`)
*(PULADO POR AGORA, MAS PREVISTO NA ARQUITETURA)*
Painel secundário para tarefas focadas. Atualmente, seu conteúdo é acessado pelo menu suspenso em Tarefas.

### 3.4. Barra de Comando (`CommandBar`)
Um componente fixo no rodapé, simulando uma interface de console, para entrada de texto e contexto do modelo.
- **Classes-base:** `bg-panel-bg p-4 flex items-center`
- **Elementos:**
    - Ícones de contexto (repositório, branch).
    - Input de Chat (Textarea).
    - Seleção de Modelo ("Haiku 4.5").
```

---

Para te ajudar a visualizar essa estrutura modular antes de escrever o primeiro componente React, preparei um **Simulador de Layout**. Você pode usar os controles para "ligar" e "desligar" os diferentes painéis e alternar o estado do painel central para ver como eles se organizam na tela.

```json?chameleon
{"component":"LlmGeneratedComponent","props":{"height":"600px","prompt":"Create an interactive dashboard layout simulator for a modular desktop application, specifically designed to model the OpenAgent UI from image_0.png and image_2.png. Populate the simulator with contextual data extracted from the images: initialize a username variable to 'Francisco Juan', main title to 'O que vem a seguir, Francisco Juan?', Sessions to '159', Messages to '22,769', Tokens to '9.8M', Current streak to '6d', Favorite model to 'Haiku 4.5', and a task title of 'Investigar e diagnosticar problema desconhecido'. The core feature is a dynamic central state selector. The simulator should allow users to toggle the visibility of specific UI panels: 'Barra Lateral', 'Painel Central', 'Barra de Comando', and a placeholder for 'Painel de Ações' (labeled in Portuguese). It must also feature a select input to control the state of the Main Panel, with options: 'Dashboard', 'Lista de Tarefas', and 'Visual Diff'. Based on this selection, the central content panel must switch modes: in Dashboard mode, populate it with statistic cards; in Tasks mode, show a simple task list with the extracted title; and in Diff mode, generate a placeholder layout simulating a code diff viewer (e.g., 'sigla' to 'abrev'), including the commit summary 'Fixed: sigla to abrev' and the change indicators '+5736 -1295'. When panels are hidden, adjacent panels should dynamically expand to fill the void. Design the simulator with a dark theme, strictly using generic language (e.g., 'highlight the selected state', 'increase panel width on toggle', 'display data below labels') without specifying colors, fonts, CSS classes, or horizontal/side-by-side splits. Ensure all component labels and content are in Portuguese.","id":"im_bedc989e8d0eb4b3"}}
```
