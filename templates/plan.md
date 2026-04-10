# Project Plan

Status: draft
<!-- IMPORTANT: Change to "Status: approved" only after explicit user review.
     Claude Code will NOT execute any task while status is draft or pending. -->

Approved by: —
Approved on: —
Last updated: YYYY-MM-DD

---

## Visão geral

[High-level description of what will be built, fixed, or changed in this planning cycle]

## Objetivo de negócio / técnico

[Why this work is being done. What success looks like at the end.]

---

## Tasks

<!-- Modelo para claude-code: opus | sonnet | haiku
     Modelo para copilot: gpt-5.4·high | gpt-5.4·medium | gpt-5.4·low | codex·minimal -->

| ID | Título | Executor | Modelo / Effort | Prioridade | Status |
|----|--------|----------|-----------------|------------|--------|
| [task-001](tasks/task-001.md) | ... | claude-code | opus | high | pending |
| [task-002](tasks/task-002.md) | ... | copilot | gpt-5.4·high | medium | pending |
| [task-003](tasks/task-003.md) | ... | copilot | gpt-5.4·medium | medium | pending |
| [task-004](tasks/task-004.md) | ... | manual | — | low | pending |

## Sequência de execução

[Order of execution considering dependencies. Claude Code will follow this and check the dependency graph.]

1. `task-001` — [why first]
2. `task-002` — depends on task-001
3. `task-003` — can run after task-001 or task-002

## Riscos e dependências externas

| Risco | Mitigação |
|-------|-----------|
| [e.g., API de terceiro pode estar fora] | [e.g., usar mock em dev] |

## Critério de conclusão do plano

[ ] Todos os tasks com status `done`
[ ] Testes passando
[ ] [Outros critérios específicos do projeto]

---

## Aprovação

> Revise os itens abaixo antes de aprovar. Após aprovação, Claude Code iniciará execução.

- [ ] Contexto em `context.md` está correto e completo
- [ ] Tasks estão bem definidas e autocontidas
- [ ] Dependências estão mapeadas em `dependencies/graph.md`
- [ ] Executores e modelos estão corretos para cada task
- [ ] Sequência de execução faz sentido

**Para aprovar:** mude a linha do topo para `Status: approved` e preencha `Approved by` e `Approved on`.

---

## Changelog

<!-- Append-only — nunca editar entradas anteriores, só adicionar novas.
     O PM adiciona uma entrada sempre que o plano é alterado após aprovação. -->

| Data | Alteração | Motivo |
|------|-----------|--------|
| YYYY-MM-DD | Plano criado | — |
