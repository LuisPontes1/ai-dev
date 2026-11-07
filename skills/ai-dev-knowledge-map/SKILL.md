---
name: ai-dev-knowledge-map
description: Use and maintain ai-dev knowledge — project knowledge lives in the existing .ai-dev/ files (context.md map, Decisões de arquitetura, Invariantes, Gotchas, Aprendizados; discovery/; reports/), general cross-project knowledge lives versioned in the ai-dev repo's knowledge/ folder — through aidev brief, recall, learn, map and sync. Use before working in an unfamiliar area, after losing time to a problem, after making a decision, when code moves, when running /ai-dev-knowledge, or when aidev map --check reports stale paths.
---

# Knowledge in ai-dev

An agent doesn't need a bigger memory, it needs better notes. ai-dev's notes were always `.ai-dev/`;
this skill is how to use them so session N+1 starts smarter than session N.

## Where knowledge lives — nothing new, just the existing files

| Knowledge | Lives in | Written by |
|-----------|----------|------------|
| what the project is, stack, constraints | `.ai-dev/context.md` | PM / `/ai-dev-init` |
| code map: tree + "Onde procurar" | `context.md → Estrutura do repositório` | `/ai-dev-knowledge`, any session that moves code |
| inventory (sizes, languages, entrypoints, commands) | `.ai-dev/discovery/inventory.md` | `aidev map` |
| decisions | `context.md → Decisões de arquitetura` | `aidev learn decision` |
| invariants | `context.md → Invariantes` | agents |
| gotchas | `context.md → Gotchas` | `aidev learn gotcha` |
| project learnings | `context.md → Aprendizados` | `aidev learn note` |
| findings about external systems | `.ai-dev/discovery/*.md` | discovery / preflight tasks |
| what each task learned | `reports/delivery-XXX.md → ## Conhecimento` | subagents |
| plan changes and why | `plan.md → ## Changelog` | PM |
| **general, every project** | `<ai-dev repo>/knowledge/learnings.md`, `gotchas.md` | `aidev learn … --global`, shared with `aidev sync` |

## The loop: load → recall → capture → promote

| Verb | Command | When |
|------|---------|------|
| load | `aidev brief` — injected automatically by the SessionStart hook (startup/resume/clear/compact) | session start; subagents run it themselves |
| recall | `aidev recall <terms>` — ranked across context, discovery, reports, tasks, plan, logs, general knowledge | before touching an area |
| capture | `aidev learn gotcha\|decision\|note [--global]` | the moment it happens |
| promote | `/ai-dev-knowledge --promote` | knowledge in the wrong place, or repeated ≥ 2 sessions → project skill |

**Project or general?** Would it help in a *different* repo (your preferences, a CLI quirk, platform
behaviour)? → `--global`, with `--applies <tech>` so the brief only shows it where it's relevant
(`databricks`, `python`, `react`, or `all`). Otherwise project. Never write secret values — names only.

## Writing the map (context.md → Estrutura)

- **Every path in backticks** (`src/auth/session.ts`) — `aidev map --check` finds stale ones.
- "Onde procurar" answers newcomer questions: "where are routes?", "how do I seed the DB?", "where are jobs defined?".
- Don't duplicate the inventory — it's in `discovery/inventory.md`.
- Update it **in the same commit** as the change that made it wrong.
- context.md is read by every subagent and injected every session: every line costs every session. Prune.

## Writing good rows

"tests hang on CI → db pool never closed → `await pool.end()` in afterAll" — not "fixed tests".
The brief carries only the latest ~12 gotchas / ~10 decisions / ~15 general learnings, so delete rows
that stopped being true.
