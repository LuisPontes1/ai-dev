Build or refresh the project's knowledge map (`.ai-dev/knowledge/`) so every future session starts oriented.

Usage:
- `/ai-dev-knowledge` — create if missing, otherwise refresh
- `/ai-dev-knowledge --check` — report only (stale paths, uncovered modules)

`aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`. Load skill `ai-dev-knowledge-map`.

---

## Step 1 — Inventory (deterministic)

`aidev map` → writes `.ai-dev/knowledge/map.generated.md` (modules, sizes, languages, entrypoints, commands).
With `--check`: run `aidev map --check`, report, stop.

## Step 2 — Curate (subagent, `sonnet`)

If `.ai-dev/knowledge/map.md` is missing, copy `~/.claude/ai-dev/templates/knowledge/*.md` into `.ai-dev/knowledge/`.
Spawn one subagent with a prompt file `.ai-dev/knowledge/refresh-prompt.md`:

```
Read .ai-dev/knowledge/map.generated.md, .ai-dev/knowledge/map.md, .ai-dev/context.md,
and .ai-dev/harness/features.json if it exists. Follow skill ai-dev-knowledge-map.
Read the code of every module in the inventory (entrypoints first, skim the rest).
Update .ai-dev/knowledge/map.md:
- one-paragraph architecture, module table (purpose, key files, feature ids), where-to-look,
  invariants, data model, external systems
- every path in backticks; remove stale paths reported by `aidev map --check`
- cover every top-level module, or state why it is irrelevant
Append to decisions.md any decision visible in the code/commits that is not recorded yet.
Do not modify code. Finish with `aidev map --check` showing no stale paths.
```

## Step 3 — Report

Show modules mapped, stale removed, uncovered remaining. If the harness is tracked, commit
`knowledge: refresh map`. Log `[timestamp] Knowledge map refreshed: M modules, S stale removed.`
