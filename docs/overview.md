# AI-Dev System — Overview

## O que é

`.ai-dev/` é uma pasta local (gitignored) que vive em cada repo. Ela implementa um modelo de desenvolvimento onde:

- **Você só fala com o chat** — nunca roda comandos, abre arquivos ou verifica status manualmente
- **O chat é o Project Manager (PM)** — lê os arquivos `.ai-dev/`, mostra o estado do projeto, itera no plano, delega execução
- **Cada task roda como subagent isolado** — recebe apenas o arquivo da task, executa, escreve o resultado em arquivos
- **Todo contexto circula via arquivos** — auditável, reproduzível, sem ambiguidade de chat

---

## Papéis

```
┌─────────────────────────────────────────────────────┐
│                    VOCÊ (usuário)                    │
│         só fala via chat · aprova plano e tasks      │
└──────────────────────────┬──────────────────────────┘
                           │ chat
┌──────────────────────────▼──────────────────────────┐
│              PROJECT MANAGER (PM)                    │
│         Claude Code · modelo: Opus 4.6               │
│                                                      │
│  • Lê .ai-dev/ na abertura da sessão                 │
│  • Mostra status do projeto                          │
│  • Itera no plano com o usuário                      │
│  • Verifica atomicidade das tasks                    │
│  • Confirma com usuário antes de cada task           │
│  • Spawna subagents para execução                    │
│  • Lê delivery reports e reporta resultados          │
└──────┬──────────────────────────────┬───────────────┘
       │ spawn subagent               │ spawn subagent
       ▼                              ▼
┌─────────────┐               ┌──────────────────────┐
│  SUBAGENT   │               │      SUBAGENT        │
│ claude-code │               │      copilot         │
│             │               │                      │
│ Lê task file│               │ Lê task file         │
│ Executa     │               │ Chama companion.mjs  │
│ Escreve     │               │ --write --effort X   │
│ report      │               │ Escreve report       │
└──────┬──────┘               └──────────┬───────────┘
       │ escreve arquivos                 │ escreve arquivos
       ▼                                 ▼
┌─────────────────────────────────────────────────────┐
│                    .ai-dev/                          │
│   tasks/  ·  reports/  ·  agents/  ·  dependencies/ │
└─────────────────────────────────────────────────────┘
```

---

## Fluxo completo

```
Sessão aberta
     │
     ▼
.ai-dev/ existe?
  ├── Não → PM propõe /ai-dev-init → aguarda confirmação → inicializa → para
  └── Sim → PM lê todos os arquivos
              │
              ▼
         PM mostra status do projeto
         (✅ done · 🔄 running · 🔜 next · ⏳ pending · 🚫 blocked)
              │
              ▼
         plan.md aprovado?
           ├── Não → PM itera plano com usuário
           │          PM verifica atomicidade de cada task
           │          PM atribui modelo/effort por task
           │          Usuário aprova → PM escreve Status: approved
           └── Sim → PM identifica próxima task disponível
                      │
                      ▼
                 PM mostra resumo da task e pergunta: "Pronto para iniciar?"
                      │
                 Usuário confirma
                      │
                      ▼
                 PM spawna subagent isolado
                 (prompt = apenas o arquivo da task + arquivos referenciados)
                      │
                      ▼
                 Subagent executa
                 Escreve delivery report
                 Atualiza status nos arquivos
                      │
                      ▼
                 PM lê delivery report
                 PM reporta resultado ao usuário
                 PM mostra tasks desbloqueadas
                      │
                      ▼
                 Próxima task → repete
```

---

## Por que arquivos e não chat

| | Via arquivos | Via chat |
|---|---|---|
| **Auditabilidade** | Toda instrução tem arquivo com data | Perdida ao fechar sessão |
| **Contexto do subagent** | Lê o arquivo — contexto preciso | Receberia histórico inteiro — ruído |
| **Reprodutibilidade** | Qualquer agente retoma de onde parou | Depende do histórico de conversa |
| **Rastreabilidade** | Task file → delivery report → git | Implícita |
| **Colaboração PM/subagent** | PM escreve, subagent lê, escreve de volta | Não suportado |

---

## Subagent: isolamento e contexto

O subagent recebe **apenas**:
1. O arquivo da task (`task-XXX.md`)
2. Os arquivos listados em `## Contexto necessário` e `## Inputs`

Ele não recebe: histórico de chat, outras tasks, plano completo, nada mais.

Isso é intencional — garante que cada task é verdadeiramente autocontida, e que o subagent não toma decisões baseado em contexto que não deveria ter.

---

## Model cascade

| Quem | Modelo | Justificativa |
|------|--------|---------------|
| PM (planejamento) | Claude Opus 4.6 | Raciocínio arquitetural, atomicidade, dependências |
| Subagent claude-code | `sonnet` padrão · `opus` complexo · `haiku` simples | Atribuído por task |
| Subagent copilot | `gpt-5.4·high/medium/low` · `codex·minimal` | Atribuído por task |

O PM usa o modelo mais capaz para planejar bem e atribuir o modelo certo para cada execução. Tasks de geração de código simples não precisam de Opus — saves cost e tempo.

---

## Estrutura de arquivos

```
.ai-dev/
├── context.md               # Briefing do projeto — lido pelo PM no startup
├── plan.md                  # Plano + gate de aprovação
├── tasks/
│   ├── _template.md         # Template com checklist de atomicidade
│   ├── task-001.md          # Instrução do subagent — autocontida
│   └── task-001-questions.md # Dúvidas do PM antes de spawnar
├── agents/
│   ├── assignments.md       # Status de todas as tasks — PM lê para o dashboard
│   └── roles.md             # Definição de executores e modelos
├── dependencies/
│   └── graph.md             # DAG — PM verifica antes de propor próxima task
└── reports/
    └── delivery-001.md      # Escrito pelo subagent — PM lê e resume ao usuário
```
