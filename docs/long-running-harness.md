# Long-Running Harness

> Keep an AI coding for hours without losing the plot.
> Based on Anthropic's engineering post [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Justin Young, Nov 2025), extended for ai-dev with an enforcement CLI, a knowledge map, skills and MCP-based verification.

---

## The problem

Every context window ends, and each new session starts with no memory of the last. Left alone, agents:

1. try to build everything at once, run out of context mid-feature, and leave half-built code
2. see existing progress and declare the project done
3. start on a broken environment and pile new work on top
4. mark features done after unit tests or `curl`, without using the feature like a user
5. edit the tests to make them pass

None of these is fixed by a better prompt. They are fixed by **structure**: files that every session reads, updates, and is audited against.

## The design

```
                 runs once                          every session: read notes → one feature → update notes
┌──────────────────────┐    ┌──────────────────────────────┐    ┌───────────┐   ┌───────────┐   ┌───────────┐
│  /ai-dev-harness     │───▶│ .ai-dev/harness/             │───▶│ Session 1 │──▶│ Session 2 │──▶│ Session N │
│  (initializer)       │    │   features.json (+ .lock)    │    │ 1 feature │   │ 1 feature │   │ 1 feature │
└──────────────────────┘    │   progress.md                │    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                            │   init.sh                    │          │ audit        │ audit        │ audit
                            │   capabilities.md  (MCP, skills)        ▼              ▼              ▼
                            │ .ai-dev/context.md           │◀───── PM: aidev guard · doctor · commit · progress
                            │   map · decisions · gotchas  │
                            │ git history                  │
                            └──────────────────────────────┘
```

Two roles, as in the article: an **initializer** that sets up the environment once, and a **coding session** that, every time, makes exactly one feature of verified progress and leaves clean notes. ai-dev adds a third: the **PM**, which spawns each session as a fresh subagent (a fresh context window) and audits it before starting the next.

## Failure modes → structural fixes

| How agents fail on long tasks | Fix |
|-------------------------------|-----|
| Tries to build the whole app in one go | feature list, `aidev next`, one feature per session |
| Declares the project done too early | every feature starts `"passes": false`; only `aidev status` says done |
| Forgets everything between sessions | `progress.md` + git history + knowledge map |
| Starts on a broken environment | `init.sh` + smoke test + re-verify recent features first |
| Marks untested work as finished | end-to-end verification (Playwright MCP), `aidev pass` requires `--evidence` |
| Edits tests to make them pass | `features.lock.json` + `aidev guard` after every session *(ai-dev addition)* |
| Re-learns the codebase every session | knowledge map, checked for staleness by `aidev map --check` *(ai-dev addition)* |
| Doesn't know which tools it has | `capabilities.md`: MCP servers, skills, verification ladder *(ai-dev addition)* |

---

## Quick start

```bash
bash install.sh --with-mcp      # --with-mcp registers Playwright MCP for browser verification
```

In a project with `.ai-dev/` (`/ai-dev-init` first):

```
/ai-dev-harness                 → builds features.json, init.sh, capabilities, knowledge map
                                  shows the list → you approve → definitions frozen
/ai-dev-session                 → one session, one feature, audited
/ai-dev-loop 10                 → chain up to 10 sessions, no questions in between
/ai-dev-knowledge               → refresh the knowledge map
```

---

## The files

### `.ai-dev/harness/features.json` — the definition of done

```json
{
  "version": 1,
  "features": [
    { "id": "F-001", "category": "auth", "priority": 1,
      "description": "user can sign up",
      "steps": ["open /signup", "submit form", "see dashboard"],
      "verify": "browser", "touches": ["src/auth/"],
      "passes": true, "evidence": ".ai-dev/harness/evidence/F-001-1.png", "last_session": 3 },
    { "id": "F-002", "category": "auth", "priority": 2,
      "description": "user can reset password",
      "steps": ["open /reset", "submit email", "follow link", "log in"],
      "verify": "browser", "passes": false }
  ]
}
```

- **Definition fields** (`id`, `category`, `priority`, `description`, `steps`, `verify`, `touches`) are frozen by `aidev freeze` once you approve.
- **State fields** (`passes`, `evidence`, `attempts`, `blocked`, `last_session`, `notes`) change only through `aidev pass|fail|regress|unblock`.
- JSON, not Markdown — models are less inclined to rewrite JSON. The lock file makes it a rule rather than a tendency.
- A feature that fails 3 sessions in a row becomes `blocked` and the loop stops for a human.

### `.ai-dev/harness/progress.md` — the handoff note

One entry per session, written with `aidev progress add`: feature, result, commit, what was done, state left, what the next session should do, gotchas. Sessions read the last three with `aidev progress tail`.

### `.ai-dev/harness/init.sh` — solid ground

Idempotent, non-interactive: installs deps, starts services in the background, runs a smoke test of the core path, prints `APP_URL`. Exit 0 only if the app works. Every session runs it first; a failing smoke test makes "fix it" the session's feature.

### `.ai-dev/harness/session-prompt.md` — identical every session

The six steps: bearings → solid ground → one feature → implement and verify like a user → record via `aidev` → clean campsite (guard, knowledge map, commit, progress). It never changes; all variation comes from the files.

### `.ai-dev/harness/capabilities.md` — tools and skills

Which MCP servers are installed, which skills to load, and the **verification ladder** per `verify` value (browser → Playwright MCP → Playwright script; api → real HTTP against the running app; …).

### Project knowledge — the existing `.ai-dev/`

| Where | Written by | Purpose |
|-------|-----------|---------|
| `discovery/inventory.md` | `aidev map` | inventory: modules, sizes, languages, entrypoints, commands |
| `context.md → Estrutura do repositório` | agents | code map: tree + "Onde procurar" |
| `context.md → Decisões de arquitetura` | `aidev learn decision` | decisions a later session could undo by accident |
| `context.md → Invariantes` · `Gotchas` · `Aprendizados` | agents, `aidev learn` | what breaks things, symptom → fix, lessons |

All of it — plus the ai-dev general knowledge — is injected into every session by the SessionStart hook
(see [knowledge-and-skills.md](knowledge-and-skills.md)). `aidev map --check` compares `context.md` against the real tree: stale paths (mentioned but gone) and uncovered modules (exist but never mentioned). The PM runs it in every audit and schedules a refresh session when the map drifts.

---

## The `aidev` CLI

Zero dependencies, Node ≥ 18. Installed at `~/.claude/ai-dev/harness/aidev.mjs`.

| Command | Does |
|---------|------|
| `aidev status [--json]` | passing/total, by category, blocked, next |
| `aidev next [--json]` | highest-priority feature not passing and not blocked |
| `aidev validate` | schema check (ids, steps, verify, evidence on passing) |
| `aidev freeze` | hash every definition into `features.lock.json` |
| `aidev guard` | exit 2 if any feature was removed/edited, or added already passing |
| `aidev pass <id> --evidence <path>` | flip to passing (evidence required) |
| `aidev fail <id> --note <why>` | count an attempt; blocks after 3 |
| `aidev regress <id> --note <what>` | a passing feature broke |
| `aidev unblock <id>` | human decision to retry |
| `aidev progress tail\|add` | read / append the handoff note |
| `aidev map [--check]` | generate inventory / check the curated map |
| `aidev doctor` | all of the above that the PM audits |

---

## Skills

Installed to `~/.claude/skills/`, loaded by sessions on demand:

| Skill | Used when |
|-------|-----------|
| `ai-dev-long-run-session` | every coding session — the six moves, context budgeting, hard rules, how to write the note |
| `ai-dev-feature-list` | initializer / amend — shape, rules, priorities, coverage checklist |
| `ai-dev-e2e-verification` | verifying a feature — Playwright MCP flow, script fallback, API/CLI, blind spots, evidence |
| `ai-dev-knowledge-map` | using and maintaining knowledge in `.ai-dev/` and the general knowledge |

Project-specific skills (e.g. your design system, your data platform) are listed in `capabilities.md` so sessions know to load them.

## MCP

| Server | Why | Install |
|--------|-----|---------|
| Playwright | `verify: browser` — navigate, click, snapshot, screenshot like a user | `bash install.sh --with-mcp` or `claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest` |
| anything your features need (GitHub, Postgres, Databricks…) | data checks, issues | list it in `capabilities.md` |

Without Playwright MCP, sessions fall back to a Node Playwright script (the skill has a template). The article's team used Puppeteer MCP; Playwright MCP is the maintained equivalent. Known blind spot from the article: native `alert()` dialogs don't show in screenshots.

---

## How it fits ai-dev

| | Plan mode (tasks) | Harness mode (features) |
|---|---|---|
| Unit | `task-XXX.md` — discovery, deployment, implementation… | one user-visible behaviour |
| Scale | 3–20 tasks | 20–300 features |
| Done | delivery report vs acceptance criteria | end-to-end check + evidence |
| Rhythm | confirm each task | approve list + budget once, sessions chain |
| Best for | ops, data, infra, one-off changes | building an app over hours/days |

Both coexist. When a session hits a credential, deployment or product question, it stops and writes it in the note — that becomes a plan task or your decision.

### Tracking in git

`.ai-dev/` is gitignored by default. The harness only survives a fresh clone or a cloud session if its notes are committed, so `/ai-dev-harness` asks once and, if you agree, tracks `.ai-dev/harness/`, `context.md` and `discovery/` while keeping the rest of `.ai-dev/` local.

---

## The long-run rule

> An agent doesn't need a bigger memory, it needs better notes. Design every session so a stranger could pick it up cold.
