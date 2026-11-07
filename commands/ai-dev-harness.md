Initialize the long-running harness in this project (the "initializer agent"). Runs once per project.

Usage:
- `/ai-dev-harness` — build the feature list from `.ai-dev/context.md` (and README / what the user described)
- `/ai-dev-harness <spec-file>` — use a specific spec file (PRD, issue export, design doc)
- `/ai-dev-harness --amend` — after approval: propose NEW features only (existing ones are frozen)

Read `~/.claude/ai-dev/harness.md` first. `aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`.

---

## Step 0 — Preconditions

1. `.ai-dev/` must exist. If not, run the `/ai-dev-init` steps first.
2. If `.ai-dev/harness/features.lock.json` exists and `--amend` was not passed: stop —
   "Harness already initialized. Use `/ai-dev-session`, `/ai-dev-loop`, or `/ai-dev-harness --amend`."
3. Ask the user ONE question (use AskUserQuestion if available):
   "Track `.ai-dev/harness` in git (knowledge is already tracked)? Recommended — otherwise a fresh clone or
   cloud session starts with no feature list or progress log." Apply the answer per `harness.md → Tracking the harness in git`.

## Step 1 — Feature list

If the scope is still fuzzy, run `superpowers:brainstorming` with the user first (if installed) and write the
outcome into the spec — the feature list is only as good as the spec.
Load skill `ai-dev-feature-list`. Spawn ONE subagent (`opus`) with a prompt file
`.ai-dev/harness/initializer-prompt.md` that says:

```
Read <spec> and .ai-dev/context.md. Read the repository enough to know what already exists.
Write .ai-dev/harness/features.json following ~/.claude/ai-dev/templates/harness/features.json
and the rules of skill ai-dev-feature-list:
- user-visible, end-to-end behaviours; one behaviour per feature
- 20–300 features depending on scope; err on the side of more, smaller features
- every feature passes:false, even if the code seems to exist (nothing passes until verified)
- priority 1 = foundation (app boots, core path), higher numbers later
- steps are what a user does and sees, not implementation
- verify: browser | api | cli | unit | manual
- touches: best-guess paths, used for parallel safety and the knowledge map
Then run `aidev validate` and fix until it passes. Do not write code.
```

## Step 2 — Environment (`init.sh`)

Copy `~/.claude/ai-dev/templates/harness/init.sh` to `.ai-dev/harness/init.sh`, fill steps 1–3 for this
project (install deps, start services in background, smoke-test the core path). Run it. It must exit 0.
If it cannot (missing credential, service), stop and ask — the harness is useless on a broken base.

## Step 3 — Capabilities (MCP + skills)

1. Run `claude mcp list` (if the CLI is available) and list skills in `~/.claude/skills/` and `.claude/skills/`.
2. Copy `~/.claude/ai-dev/templates/harness/capabilities.md` to `.ai-dev/harness/capabilities.md` and fill it with
   what is ACTUALLY installed. If any feature has `verify: browser` and no Playwright MCP is installed, tell the user:
   `claude mcp add playwright -- npx -y @playwright/mcp@latest` (or `bash install.sh --with-mcp`).
   Fallback works without it (Node `require('playwright')`), but mark it in the table.

## Step 4 — Knowledge map

Run the `/ai-dev-knowledge` steps (generate inventory, curate `map.md`, seed `decisions.md` and `gotchas.md`).

## Step 5 — Notes and first commit

1. Copy `~/.claude/ai-dev/templates/harness/session-prompt.md` → `.ai-dev/harness/session-prompt.md` (verbatim).
2. Copy `~/.claude/ai-dev/templates/harness/progress.md` → `.ai-dev/harness/progress.md`; fill Session 0.
3. `git add` the harness (if tracked) plus any project files init.sh needed; commit `harness: initialize long-running harness`.

## Step 6 — Approval gate

Show:

```
## Harness ready — awaiting approval
Features: N (all failing)   Categories: auth 12 · chat 40 · settings 9 · …
Verification: browser 31 (Playwright MCP ✅) · api 14 · unit 5
init.sh: ✅ smoke passed
Knowledge map: M modules mapped

First 10 by priority:
  F-001 [p1] app boots and shows the home page
  …

Approve? After approval the definitions are frozen — sessions may only flip `passes`.
```

On approval: `aidev freeze`, log `[timestamp] Harness approved and frozen: N features.`, then suggest
`/ai-dev-session` (one) or `/ai-dev-loop 5` (chain).

## --amend

Propose new features only (append, `passes:false`). Show the diff, on approval `aidev freeze` again and log it to
`plan.md → ## Changelog`. Existing definitions are never edited; a wrong feature is fixed by the user, explicitly,
and recorded in the changelog.

## What NOT to do

- Do NOT implement features during initialization
- Do NOT mark anything as passing
- Do NOT freeze without explicit user approval
