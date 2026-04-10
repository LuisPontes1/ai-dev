# Visão Geral do Sistema

---

## Princípio central

**Todo contexto circula via arquivos. Nenhum agente recebe instrução via chat ou argumento de linha de comando.**

Isso tem duas consequências práticas:

1. **Auditabilidade por natureza** — qualquer decisão, instrução ou resultado está em algum arquivo com data e autor
2. **Subagents verdadeiramente isolados** — um subagent que lê apenas o arquivo da task não pode tomar decisões baseadas em contexto que não deveria ter

---

## Papéis

```
┌──────────────────────────────────────────────────┐
│                   VOCÊ                           │
│  Só interage via chat · nunca abre arquivo       │
│  nunca roda comando · aprova plano e cada task   │
└───────────────────────┬──────────────────────────┘
                        │ chat
┌───────────────────────▼──────────────────────────┐
│            PROJECT MANAGER (PM)                  │
│       Claude Code · modelo Opus 4.6              │
│                                                  │
│  Lê .ai-dev/ na abertura de sessão               │
│  Mostra status do projeto                        │
│  Itera o plano, verifica atomicidade             │
│  Confirma com você antes de cada task            │
│  Spawna subagents para execução                  │
│  Lê delivery reports, reporta resultados         │
│  Gerencia rollback em caso de falha              │
└────────┬─────────────────────┬───────────────────┘
         │ spawn               │ spawn
         ▼                     ▼
┌──────────────┐    ┌──────────────────────────┐
│   SUBAGENT   │    │         SUBAGENT         │
│ claude-code  │    │         copilot          │
│              │    │                          │
│ Lê task file │    │ Lê task file             │
│ Executa      │    │ Monta prompt             │
│ Escreve      │    │ Chama copilot-companion  │
│ delivery     │    │ --write --model --effort │
│ report       │    │ Escreve delivery report  │
└──────┬───────┘    └────────────┬─────────────┘
       │ escreve                 │ escreve
       ▼                         ▼
┌──────────────────────────────────────────────────┐
│                  .ai-dev/                        │
│  tasks/ · reports/ · discovery/ · agents/        │
└──────────────────────────────────────────────────┘
```

---

## O que o PM faz em cada sessão

### Na abertura

1. Verifica se `.ai-dev/` existe
2. Se não: propõe inicializar e para
3. Se sim: lê todos os arquivos de estado e exibe o dashboard:

```
## Project: minha-api

Plan status: approved

Tasks
  ✅ done     : task-001 — preflight
  ✅ done     : task-002 — criar modelo User
  🔜 next     : task-003 — criar middleware JWT  (claude-code · sonnet)
  ⏳ pending  : task-004, task-005

Next action: Pronto para iniciar task-003. Confirma?
```

### Durante o planejamento

O PM usa Opus para raciocinar sobre o plano. Para cada task proposta, verifica:

- Tem **um único objetivo**? Se não, propõe split
- Os **outputs são enumeráveis** antes de começar?
- Tem **rollback** definido para tasks de deployment?
- A task que precede um deployment tem um **preflight**?
- O modelo/effort está **calibrado** para a complexidade?

### Durante a execução

Para cada task:

1. Mostra resumo e pergunta "pode prosseguir?"
2. Spawna subagent com prompt que contém **apenas** o arquivo da task + arquivos referenciados
3. Aguarda conclusão
4. Lê delivery report — especialmente `## Impacto no plano`
5. Se há impacto: pausa, mostra o que foi encontrado, propõe ajuste nas próximas tasks
6. Resume resultado e propõe próxima task

---

## Fluxo completo

```
Sessão aberta
     │
     ▼
.ai-dev/ existe?
  ├── Não → propõe /ai-dev-init → aguarda confirmação
  └── Sim → lê context.md, plan.md, assignments.md, graph.md
              │
              ▼
         Exibe dashboard de status
              │
              ▼
         plan.md status == approved?
           ├── Não → itera com usuário
           │         verifica atomicidade de cada task
           │         atribui executor/modelo por task
           │         aguarda aprovação explícita
           └── Sim → identifica próxima task disponível (sem dependências pendentes)
                      │
                      ▼
                 Type == deployment?
                   ├── Sim → preflight concluído?
                   │          ├── Não → spawna preflight primeiro
                   │          └── Sim → prossegue
                   └── Não → prossegue
                      │
                      ▼
                 PM mostra resumo da task, aguarda confirmação
                      │
                      ▼
                 Spawna subagent isolado
                 (lê task file + arquivos referenciados, nada mais)
                      │
                      ▼
                 Subagent executa
                 ├── Sucesso: escreve delivery report, atualiza status
                 └── Falha:   executa rollback steps, escreve failure report
                      │
                      ▼
                 PM lê delivery report
                 ├── Impacto no plano? → pausa, avalia, atualiza tasks afetadas
                 └── Sem impacto → resume resultado ao usuário
                      │
                      ▼
                 PM mostra tasks desbloqueadas
                 Aguarda confirmação → próxima task
```

---

## Tipos de task

| Type | Propósito | Output gerado |
|------|-----------|---------------|
| `preflight` | Verifica auth, targets, env vars | `.ai-dev/discovery/preflight-XXX.md` |
| `discovery` | Explora recursos externos, escreve findings | `.ai-dev/discovery/*.md` |
| `implementation` | Cria ou modifica código/config | Arquivos do projeto |
| `deployment` | Executa CLI, publica, dispara jobs | `.ai-dev/discovery/job-run.md` etc. |
| `verification` | Monitora jobs, valida resultados | `.ai-dev/reports/delivery-XXX.md` |

**Regra de sequência obrigatória:**
- `preflight` sempre precede `deployment`
- `discovery` sempre precede `implementation` quando o escopo depende do ambiente

---

## Estrutura de arquivos

```
.ai-dev/
│
├── context.md
│   └── Briefing do projeto: objetivo, stack, arquitetura, credenciais (por nome, nunca por valor)
│       Lido pelo PM no startup e pelos subagents antes de cada task
│
├── plan.md
│   └── Status (draft|approved), tabela de tasks com executor/modelo/effort,
│       sequência, critério de conclusão, aprovação e changelog append-only
│
├── tasks/
│   ├── _template.md         ← checklist de atomicidade + todos os campos
│   ├── task-001.md          ← instrução completa para o subagent
│   ├── task-001-questions.md ← PM escreve quando precisa de clarificação antes de spawnar
│   └── task-001-instructions.md ← gerado para tasks manuais
│
├── agents/
│   ├── assignments.md       ← task → executor · modelo · status · session ID
│   └── roles.md             ← definição de cada executor e como ele recebe contexto
│
├── dependencies/
│   └── graph.md             ← DAG: task X só inicia após task Y concluída
│
├── discovery/
│   ├── preflight-001.md     ← resultado de task preflight
│   ├── tables-findings.md   ← exemplo: resultado de discovery no Databricks
│   └── job-run.md           ← exemplo: run_id de task de deployment
│
└── reports/
    └── delivery-001.md      ← gerado pelo subagent ao concluir task
        Campos: o que foi feito, arquivos modificados, critério de aceite,
                desvios, tasks desbloqueadas, impacto no plano
```

---

## Por que não usar só o chat

| | Sistema .ai-dev/ | Só o chat |
|---|---|---|
| **Contexto entre sessões** | Persistido em arquivos | Perdido ao fechar |
| **Subagent recebe** | Apenas o arquivo da task | Histórico inteiro da conversa |
| **Auditoria** | Cada ação → delivery report | Implícita no histórico |
| **Rollback** | Protocolo definido por task | Manual |
| **Retomada** | PM lê arquivos e continua | Requer re-explicar tudo |
| **Multi-executor** | Claude Code + Copilot + manual | Só Claude Code |

---

## Contextos suportados

`.ai-dev/` funciona em qualquer diretório — não precisa ser um repo git:

| Contexto | Ignore file | Starter |
|----------|-------------|---------|
| Git repo | `.gitignore` | `python-package` ou `generic` |
| Databricks Bundle | `.databricksignore` | `databricks-bundle` |
| Pipeline de dados | `.gitignore` | `data-pipeline` |
| Pasta de estudo | `.gitignore` (criado) | `generic` |

O `/ai-dev-init` detecta o tipo automaticamente e usa o starter correto para pré-preencher `context.md`.
