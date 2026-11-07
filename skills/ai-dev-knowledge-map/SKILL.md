---
name: ai-dev-knowledge-map
description: Build and maintain .ai-dev/knowledge/ — the curated knowledge map (modules, where-to-look, invariants, data model), decision log and gotchas — checked against the generated inventory from aidev map. Use when running /ai-dev-knowledge, when a session moves or adds modules, or when aidev map --check reports stale paths.
---

# Knowledge map

An agent doesn't need a bigger memory, it needs better notes. The knowledge map is the note that
answers **"where is X, and what will I break if I touch it?"** in one read, so a session spends
its context on the feature instead of rediscovering the codebase.

## Files

| File | Who writes | Content |
|------|-----------|---------|
| `map.generated.md` | `aidev map` only | inventory: modules, sizes, languages, entrypoints, commands |
| `map.md` | agents | architecture paragraph, module table, where-to-look, invariants, data model, external systems |
| `decisions.md` | agents, append-only | decisions a future session could undo by accident |
| `gotchas.md` | agents | symptom → cause → fix, for anything that cost >10 min |

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
- A decision → one row in `decisions.md` (date · decision · why · rejected · F-id/session).
- A gotcha → one row in `gotchas.md`, symptom first so it's greppable.
