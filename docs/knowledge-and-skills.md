# Knowledge & Skills

> Memory that persists between sessions and gets used every time, plus the external skills (Superpowers,
> Karpathy) wired into the right moments of ai-dev.

---

## Knowledge: always on, across sessions

### Where it lives

| Scope | Path | In git | Content |
|-------|------|--------|---------|
| Project | `.ai-dev/knowledge/map.md` | yes | architecture, modules ↔ features, where to look, invariants, data model |
| Project | `.ai-dev/knowledge/map.generated.md` | yes | inventory from `aidev map` (ground truth for the map) |
| Project | `.ai-dev/knowledge/decisions.md` | yes | decisions a later session could undo by accident |
| Project | `.ai-dev/knowledge/gotchas.md` | yes | symptom → cause → fix |
| Global | `~/.claude/ai-dev/knowledge/learnings.md` | — | lessons for every project: your preferences, tool quirks, platform behaviour |
| Global | `~/.claude/ai-dev/knowledge/gotchas.md` | — | cross-project gotchas |

`/ai-dev-init` creates the project knowledge in every project (not only harness mode) and writes
`.gitignore` as `.ai-dev/*` + `!.ai-dev/knowledge/`: plans stay local, knowledge survives clones, other
machines and cloud sessions. The installer creates the global files once and never overwrites them.

### How it gets used — automatically

```
SessionStart hook  (startup · resume · /clear · after compaction)
   └─ node ~/.claude/ai-dev/harness/aidev.mjs brief --hook
        └─ injects "## ai-dev knowledge brief" into context:
             your learnings (all projects) · architecture · modules · where to look · invariants
             · last gotchas · decisions · harness status + last progress note
```

The model doesn't have to remember to read anything: the brief is in context from the first turn, and
re-injected after compaction (the moment long sessions usually "forget"). It is silent when ai-dev is OFF,
works from any subfolder of the project, and is capped (~9k chars) so it never crowds the window — older
rows are reachable with `recall`.

Subagents don't get SessionStart hooks, so every subagent prompt starts with `aidev brief` + `aidev recall <task terms>`.
Copilot can't run commands, so the PM inlines the brief into Copilot prompt files.

### How it grows

| Moment | Command |
|--------|---------|
| Lost >10 min to something | `aidev learn gotcha --symptom "…" --cause "…" --fix "…" [--global]` |
| Made a choice a later session could undo | `aidev learn decision --decision "…" --why "…" --rejected "…"` |
| Lesson that applies beyond this repo | `aidev learn note --global --learning "…" --applies "databricks"` |
| Moved / added modules | edit `map.md` in the same commit, then `aidev map` |
| Task finished | delivery report `## Conhecimento` → PM records anything missing |
| Same gotcha / procedure in ≥ 2 sessions | promote to a project skill (`.claude/skills/`) |

`learn` writes one table row, deterministically, and ignores exact duplicates. `aidev map --check` reports
paths in `map.md` that no longer exist and modules it never mentions.

### Searching

```
aidev recall login cookie
[project] .ai-dev/knowledge/gotchas.md:7
| Symptom | Cause | Fix / workaround | Found in |
| login redirect loop | cookie SameSite=None on http | set SameSite=Lax in dev | session 12 |
```

Ranked across project knowledge, global learnings, `progress.md` and delivery reports.

### Installing the hook by hand

`install.sh` merges this into `~/.claude/settings.json` (backup in `settings.json.bak`; `--no-hook` to skip):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [{ "type": "command", "command": "node \"$HOME/.claude/ai-dev/harness/aidev.mjs\" brief --hook", "timeout": 10 }]
      }
    ]
  }
}
```

---

## Skills

### Karpathy guidelines — bundled, always applied

[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) (MIT): four
principles from Andrej Karpathy's observations on LLM coding mistakes.

1. **Think before coding** — state assumptions, surface ambiguity, ask
2. **Simplicity first** — minimum code, nothing speculative
3. **Surgical changes** — every changed line traces to the request
4. **Goal-driven execution** — turn tasks into verifiable goals, loop until verified

Installed at `~/.claude/ai-dev/guidelines/karpathy-guidelines.md`. Every subagent prompt tells the subagent
to follow it, Copilot prompts inline it, and the task template's acceptance criteria use its
"step → verify" form. It's small and stable, so it's vendored (see `THIRD_PARTY_NOTICES.md`).

### Superpowers — optional plugin, routed by moment

[obra/superpowers](https://github.com/obra/superpowers) (MIT, Jesse Vincent): 14 process skills. They're
actively maintained, so ai-dev **installs the plugin instead of copying it** and routes to skills by name:

```bash
bash install.sh --with-superpowers
# or inside Claude Code:
/plugin install superpowers@claude-plugins-official
```

| ai-dev moment | Superpowers skill |
|---------------|-------------------|
| Fuzzy request, before plan or feature list | `brainstorming` (output → `context.md` / spec) |
| Smoke test fails, regression, broken build | `systematic-debugging` |
| `Persona: tdd`, `verify: unit`/`api` features | `test-driven-development` |
| Before `aidev pass` / delivery report | `verification-before-completion` |
| After implementation, before deployment | `requesting-code-review` (or `/ai-dev-review`) |
| Review feedback | `receiving-code-review` |
| Plan or loop finished | `finishing-a-development-branch` |
| Knowledge repeats in ≥ 2 sessions | `writing-skills` → project skill |

**Not used while ai-dev is on** — they duplicate the PM: `writing-plans` (plan of record is `.ai-dev/`),
`executing-plans` (PM never executes inline), `subagent-driven-development` (its "never pause" conflicts with
per-task approval; `/ai-dev-loop` is the continuous mode, with a budget approved up front). Two ideas from it
are adopted: recording judgment calls as decisions (`aidev learn decision`), and a reviewer pass after implementers.

Full routing and precedence: `install/skills.md`. Without Superpowers everything still works — each row has
an ai-dev equivalent.

### ai-dev's own skills

| Skill | Used when |
|-------|-----------|
| `ai-dev-knowledge-map` | load → recall → capture → promote; building or refreshing the map |
| `ai-dev-long-run-session` | every harness session |
| `ai-dev-feature-list` | initializer / amend |
| `ai-dev-e2e-verification` | verifying a feature like a user (Playwright MCP) |
