---
name: ai-dev-knowledge-map
description: Build, use and maintain ai-dev memory — the project knowledge map in .ai-dev/knowledge/ (modules, where-to-look, invariants, decisions, gotchas) and global learnings in ~/.claude/ai-dev/knowledge/ — with aidev brief, recall, learn and map. Use when running /ai-dev-knowledge, before working in an unfamiliar area, after losing time to a problem, after making a decision, when a session moves or adds modules, or when aidev map --check reports stale paths.
---

# Knowledge map

An agent doesn't need a bigger memory, it needs better notes. The knowledge map is the note that
answers **"where is X, and what will I break if I touch it?"** in one read, so a session spends
its context on the feature instead of rediscovering the codebase.

## The loop: load → recall → capture → promote

| Verb | Command | When |
|------|---------|------|
| load | `aidev brief` (auto-injected by the SessionStart hook on startup/resume/clear/compact) | session start |
| recall | `aidev recall <terms>` — ranked rows from knowledge, global learnings, progress notes, delivery reports | before touching an area |
| capture | `aidev learn gotcha\|decision\|note [--global]` | the moment it happens |
| promote | gotcha/procedure seen in ≥ 2 sessions → project skill in `.claude/skills/` (`superpowers:writing-skills` or `skill-creator`) | when it repeats |

Project vs global: if the lesson would help in a *different* repo (your preferences, a CLI quirk, a cloud
platform's behaviour) use `--global`. Otherwise project. Never write secret values — names only.

## Files

| File | Who writes | Content |
|------|-----------|---------|
| `map.generated.md` | `aidev map` only | inventory: modules, sizes, languages, entrypoints, commands |
| `map.md` | agents | architecture paragraph, module table, where-to-look, invariants, data model, external systems |
| `decisions.md` | `aidev learn decision`, append-only | decisions a future session could undo by accident |
| `gotchas.md` | `aidev learn gotcha` | symptom → cause → fix, for anything that cost >10 min |
| `~/.claude/ai-dev/knowledge/learnings.md` | `aidev learn note --global` | cross-project lessons |
| `~/.claude/ai-dev/knowledge/gotchas.md` | `aidev learn gotcha --global` | cross-project gotchas |

## Writing map.md

- **Every path in backticks** (`src/auth/session.ts`) — that's how `aidev map --check` finds stale entries.
- **Module table links features** (`F-001, F-002`) so a session jumps from feature to code.
- **Where-to-look** is phrased as questions a newcomer asks: "where are routes?", "how do I seed the DB?".
- **Invariants** are the rules that cause bugs elsewhere when broken. Be concrete: name the file that enforces them.
- Don't duplicate the inventory (sizes, file lists) — link to `map.generated.md`.
- Keep it under ~200 lines. It is read at the start of every session; every line costs every session.

## Keeping it fresh

- Update `map.md` **in the same commit** as the change that made it wrong.
- `aidev map` then `aidev map --check`: fix every stale path; cover every uncovered top-level module or note why it's irrelevant.
- The brief only carries the last ~12 gotchas / ~10 decisions / ~15 global learnings: prune rows that stopped
  being true (and say so in the progress note or delivery report), so the brief stays signal.
- Write rows a stranger can act on: "tests hang on CI → db pool never closed → `await pool.end()` in afterAll",
  not "fixed tests".
