# AI-Dev — Long-Running Harness Protocol

> Loaded by the PM when the project has `.ai-dev/harness/` or the user runs
> `/ai-dev-harness`, `/ai-dev-session`, `/ai-dev-loop` or `/ai-dev-knowledge`.
> Based on Anthropic's "Effective harnesses for long-running agents" (Nov 2025).

`aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs` (run from the project root).

---

## When to use harness mode vs plan mode

| | Plan mode (tasks) | Harness mode (features) |
|---|---|---|
| Unit of work | `task-XXX.md` — any type (discovery, deployment, …) | one entry in `features.json` — user-visible behaviour |
| Size | 3–20 tasks | 20–300 features |
| Done means | acceptance criteria in a delivery report | end-to-end check + evidence, flipped by `aidev pass` |
| Rhythm | PM confirms each task | user approves the list + a budget, then sessions chain |
| Best for | ops, data, infra, one-off changes | building an app / product surface over many hours |

Both can coexist: a plan task can be "run 10 harness sessions", and a harness
session that hits a deployment/credential question stops and becomes a plan task.

---

## Failure modes → structural fixes

| How agents fail on long tasks | Fix in ai-dev |
|-------------------------------|---------------|
| Tries to build everything at once | `features.json`, `aidev next`, one feature per session |
| Declares the project done too early | every feature starts `passes:false`; only `aidev status` says done |
| Forgets everything between sessions | `progress.md` + git history + knowledge map |
| Starts on a broken environment | `init.sh` + smoke test + re-verify last features first |
| Marks untested work as finished | `aidev pass` requires `--evidence`; browser features need screenshots |
| Rewrites tests to make them pass | `features.lock.json` + `aidev guard` after every session |
| Relearns the codebase every session | `knowledge/map.md` checked by `aidev map --check` |
| Doesn't know which tools it has | `capabilities.md` (MCP servers, skills, verification ladder) |

---

## Initializer (runs once — `/ai-dev-harness`)

Creates, in this order, then stops for user approval:

1. `.ai-dev/harness/features.json` — expanded from the spec (`context.md`, README, issue, or what the user said).
   Load skill `ai-dev-feature-list`. Every feature: id, category, priority, description, steps, verify, touches, `passes:false`.
2. `.ai-dev/harness/init.sh` — idempotent bootstrap + smoke test. Must be run once and work before handoff.
3. `.ai-dev/harness/capabilities.md` — real MCP servers (`claude mcp list`), installed skills, verification ladder.
4. `.ai-dev/knowledge/` — `aidev map`, then curate `map.md`, seed `decisions.md`, `gotchas.md`.
5. `.ai-dev/harness/session-prompt.md` — copied verbatim from the template. Never customised per session.
6. `.ai-dev/harness/progress.md` — Session 0 entry.
7. Initial git commit of the skeleton.

**Approval gate:** show the user the feature count by category, the first 10 by priority, and the
verification tool per `verify` value. Only after explicit approval: `aidev freeze`. Log it.

---

## One session (`/ai-dev-session`)

The PM never implements. It spawns ONE fresh subagent (`claude-code`, model from
`/ai-dev-session --model`, default `sonnet`; `opus` for features with `priority` 1 and
category `architecture`) whose prompt is exactly:

> Read and execute `.ai-dev/harness/session-prompt.md`. You are session N.

Fresh subagent = fresh context window = the article's "new session". The prompt is identical every time;
all variation comes from the files.

## Post-session audit (PM, after EVERY session — never skip)

Run and read, do not trust the subagent's summary:

1. `aidev guard` — exit 2 → **stop the loop**, show the violation, `git diff .ai-dev/harness/features.json`, ask the user.
2. `aidev doctor`
3. `aidev progress tail -n 1` — an entry for session N exists.
4. `git log -1 --oneline` — a new commit exists, `git status --porcelain` is empty (or only untracked evidence).
5. If a feature flipped to passing: its `evidence` path exists.
6. `aidev status`

Any check failing → the session is **not** counted as progress. Report it and stop (loop) or ask (single).

Log: `[timestamp] Harness session N: feature F-XXX → passed|failed|fixed-env. Guard: ok. Passing: X/Y.`

---

## Loop (`/ai-dev-loop`)

The user approves a **budget** once: max sessions (default 5), optional stop-at-category or stop-at-feature.
Then the PM chains sessions without asking between them, running the audit after each.

Stop immediately when any is true:
- audit fails (guard violation, no commit, no progress entry, missing evidence)
- `init.sh` fails at session start and the session could not fix it
- a feature becomes `blocked` (3 failed attempts) — needs a human
- the same feature failed in 2 consecutive sessions
- `aidev next` returns nothing (all pass or all remaining blocked) → report completion
- budget reached

At the end: one summary — features passed this run, regressions found and fixed,
blocked features with their notes, knowledge-map changes, next feature.

Parallel sessions are **off** by default. Allowed only when the user asks and
the candidate features have disjoint `touches`; each runs in a worktree, merge sequentially, guard after merge.

---

## Knowledge map upkeep

- Sessions update `map.md` in the same commit as the change that made it wrong.
- The PM runs `aidev map --check` in the audit; stale paths are a warning in single mode
  and trigger a `/ai-dev-knowledge` refresh session (not a feature) in loop mode every 10 sessions or when stale ≥ 3.

## Tracking the harness in git

`.ai-dev/` is gitignored by default (plan mode is personal). The harness only works across
machines and cloud sessions if its notes survive, so `/ai-dev-harness` asks once:

- **Track (recommended for harness):** replace `.ai-dev/` in `.gitignore` with
  ```
  .ai-dev/*
  !.ai-dev/harness/
  !.ai-dev/knowledge/
  .ai-dev/harness/logs/
  ```
- **Local only:** keep as is; warn that a fresh clone/cloud container starts with no harness.
