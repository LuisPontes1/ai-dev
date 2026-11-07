Build or refresh the project's knowledge inside `.ai-dev/` — mainly the code map in `context.md` — so every
future session starts oriented. Knowledge has no separate store: it is `.ai-dev/` itself.

Usage:
- `/ai-dev-knowledge` — refresh `context.md` (map, invariants) from the current code
- `/ai-dev-knowledge --check` — report only (stale paths, modules context.md never mentions)
- `/ai-dev-knowledge --promote` — move knowledge into the right place (see Step 4)

`aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`. Load skill `ai-dev-knowledge-map`.

---

## Step 1 — Inventory (deterministic)

`aidev map` → writes `.ai-dev/discovery/inventory.md` (modules, sizes, languages, entrypoints, commands) — a
discovery finding like any other. With `--check`: run `aidev map --check`, report, stop.

## Step 2 — Curate `context.md` (subagent, `sonnet`)

Write the prompt to `.ai-dev/tasks/knowledge-refresh-prompt.md` and spawn one subagent:

```
Read .ai-dev/context.md, .ai-dev/discovery/inventory.md and every other .ai-dev/discovery/*.md.
Read .ai-dev/harness/features.json if it exists. Follow skill ai-dev-knowledge-map.
Read the code of every module in the inventory (entrypoints first, skim the rest).
Update .ai-dev/context.md — keep its sections and everything already recorded:
- "Estrutura do repositório" (or "Estrutura do projeto/bundle"): tree + "Onde procurar" table; paths in
  backticks; remove paths reported stale by `aidev map --check`; cover every top-level module
- "Invariantes": rules that break something elsewhere, naming the file that enforces them
- "Decisões de arquitetura": add decisions visible in code/commits that are missing (`aidev learn decision`)
- fill [TODO]s you can now answer (Stack, Ambiente de desenvolvimento, comandos)
Do not modify code. Finish with `aidev map --check` showing no stale paths.
```

## Step 3 — Report

Show sections changed, stale removed, modules still uncovered. Log
`[timestamp] Knowledge refreshed: context.md map updated, S stale removed.`

## Step 4 — `--promote`

Knowledge drifts into the wrong place over time. Walk it and propose moves, then apply after the user confirms:

| Found in | Belongs in |
|----------|------------|
| delivery report `## Conhecimento` not yet recorded | `context.md` via `aidev learn` |
| `discovery/*.md` finding that is now a stable fact | `context.md` (Estrutura / Invariantes / Decisões) |
| project gotcha/learning that would help any project | ai-dev general knowledge (`aidev learn … --global`) |
| a gotcha or procedure repeated in ≥ 2 sessions | a project skill in `.claude/skills/` (`superpowers:writing-skills`) |
| rows that are no longer true | deleted (say so in session-log) |

If general knowledge changed, offer `aidev sync` (commit + push in the ai-dev repo) — ask before pushing.
