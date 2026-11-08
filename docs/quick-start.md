# Quick Start

From zero to first planned project in 10 minutes.

---

## 1. Install

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh --with-mcp --with-superpowers
```

Flags: `--dry-run` previews without writing · `--with-mcp` registers Playwright MCP (browser testing) ·
`--with-superpowers` installs the Superpowers skills plugin · `--no-hook` skips the hooks in `~/.claude/settings.json`.

**What gets installed:**

```
~/CLAUDE.md                      ← PM core: startup, plan gate, subagent template, handoff, knowledge
~/.claude/ai-dev/enabled         ← toggle flag (system is ON)
~/.claude/ai-dev/planning.md     ← on-demand: atomicity, types, models, personas
~/.claude/ai-dev/execution.md    ← on-demand: rollback, preflight, copilot, parallel, credentials
~/.claude/ai-dev/harness.md      ← on-demand: long-running harness (initializer, sessions, audit, loop)
~/.claude/ai-dev/skills.md       ← on-demand: which skill to use when (ai-dev, Superpowers, Karpathy)
~/.claude/ai-dev/guidelines/     ← Karpathy coding discipline, applied to every subagent
~/.claude/ai-dev/personas/       ← 8 specialist prompt templates
~/.claude/ai-dev/templates/      ← starters, task/report/handoff templates, harness templates
~/.claude/ai-dev/harness/        ← the `aidev` CLI (features, progress, map, brief/recall/learn, handoff, compaction)
~/.claude/ai-dev/knowledge-dir   ← points to <your ai-dev clone>/knowledge (general knowledge, versioned)
~/.claude/skills/ai-dev-*        ← 5 skills: knowledge, long-run session, feature list, e2e verification, storytelling
~/.claude/commands/ai-dev-*.md   ← /ai-dev-on|off|init|exec|review|harness|session|loop|knowledge
~/.claude/settings.json          ← hooks: SessionStart · SubagentStart · PreCompact · PostCompact
```

The installer includes the Copilot plugin (`@github/copilot-sdk`) — it copies the plugin, runs `npm install`, and installs the `/copilot:*` slash commands automatically.

**Verify:**
```bash
ls ~/.claude/ai-dev/
# enabled  execution.md  guidelines/  harness/  harness.md  knowledge-dir  personas/  planning.md  skills.md  templates/
node ~/.claude/ai-dev/harness/aidev.mjs help     # the aidev CLI answers
```
In Claude Code, `/hooks` lists the four ai-dev hooks.

In the rest of this guide, `aidev` means `node ~/.claude/ai-dev/harness/aidev.mjs`.

---

## 2. Open a project

Open any repo in VS Code with Claude Code active. In a project that already has `.ai-dev/`, the SessionStart hook
injects the session state (handoff, plan, session log) and the project knowledge before your first message, and the
PM shows the dashboard. In a new project it responds:

```
This project has no .ai-dev/. Want me to initialize it with /ai-dev-init?
```

Say "yes" or "go ahead".

---

## 3. Initialize

The PM runs `/ai-dev-init`. It:

1. Detects your project type (`python-package`, `databricks-bundle`, `data-pipeline`, or `generic`)
2. Creates `.ai-dev/` with all files, using the matching starter template
3. Pre-fills `context.md` with what it can infer, including the code map (`aidev map` → `discovery/inventory.md`)
4. Creates `handoff.md`, the live "where are we now" file
5. Checks the ai-dev general knowledge for lessons about your stack (`aidev recall`)
6. Adds `.ai-dev/` to `.gitignore` (or `.databricksignore`)

PM response:

```
Initialized. Detected: python-package

Files created:
  .ai-dev/context.md            ← review [TODO] sections; holds map, decisions, gotchas
  .ai-dev/plan.md               ← Status: draft
  .ai-dev/session-log.md
  .ai-dev/handoff.md            ← focus, next step, what awaits you, active persona
  .ai-dev/tasks/_template.md
  .ai-dev/agents/assignments.md
  .ai-dev/agents/roles.md
  .ai-dev/dependencies/graph.md
  .ai-dev/discovery/inventory.md
  .ai-dev/reports/

Sections needing review in context.md:
  - Stack → framework not identified [TODO]
  - Credentials → none mapped yet [TODO]

Next: review context.md and tell me what you want to build.
Execution is blocked until the plan is approved.
```

---

## 4. Review context

Tell the PM to fill in what it couldn't infer:

```
You: the framework is FastAPI, database is PostgreSQL,
     credential is DATABASE_URL via env var
```

The PM updates `context.md` and confirms.

---

## 5. Describe what you want

```
You: I want JWT authentication — login with email/password,
     24h token expiry, protect the /users and /orders routes
```

The PM plans: checks atomicity, assigns executors and models, sequences tasks:

```
Proposal — JWT Authentication

task-001  preflight       Verify PyJWT installed and SECRET_KEY in env
                          claude-code · sonnet

task-002  implementation  Create User model with password hashing
                          claude-code · sonnet · persona: database

task-003  implementation  Create POST /auth/login endpoint
                          claude-code · sonnet · persona: security  (depends on 002)

task-004  implementation  Create JWT middleware and @require_auth decorator
                          copilot · gpt-5.4·high · persona: security  (depends on 003)

task-005  implementation  Protect /users and /orders routes
                          copilot · gpt-5.4·medium  (depends on 004)

task-006  verification    Run pytest and verify coverage
                          claude-code · sonnet · persona: tdd  (depends on 005)

Sequence: 001 → 002 → 003 → 004 → 005 → 006
Parallel groups: none (linear chain)

Want to adjust any task, change an executor or model, before approving?
```

---

## 6. Iterate and approve

```
You: move task-004 to claude-code opus, it's architecturally important
```

```
PM: Updated. task-004 now: claude-code · opus. Confirm the plan?
```

```
You: approved
```

PM writes `Status: approved` to `plan.md`, records it in the changelog and session log.

---

## 7. Execution

You can execute tasks with `/ai-dev-exec`:

```
You: /ai-dev-exec
```

The command detects the next ready task, shows a summary, and asks for confirmation:

```
Ready to execute: task-001 — Verify PyJWT installed and SECRET_KEY in env
  Executor: claude-code · sonnet
  Type: preflight
  Outputs: .ai-dev/discovery/preflight-001.md

Proceed?
```

```
You: go
```

The command dispatches to the right executor automatically — subagent for `claude-code`, Copilot companion for `copilot`, instruction file for `manual`. After completion, PM reads the delivery report:

```
✅ task-001 complete — preflight

What was done: PyJWT 2.8.0 found. SECRET_KEY present in .env.
Files: .ai-dev/discovery/preflight-001.md

Next: task-002 — Create User model (claude-code · sonnet)
Proceed?
```

You can also execute a specific task: `/ai-dev-exec task-003`

### Parallel execution

When multiple tasks are ready and have no dependency between them, the PM offers to run them in parallel:

```
You: /ai-dev-exec
```

```
Parallel batch detected — 3 tasks can run simultaneously:

  🅰 task-007 — Write API docs          (claude-code · haiku · worktree)
  🅱 task-008 — Build settings page      (copilot · gpt-5.4 · background)
  🅲 task-009 — Add rate limiting        (claude-code · sonnet · worktree)

Output overlap check: ✅ no conflicts

Run all in parallel? [or pick specific tasks, or run sequentially]
```

```
You: go parallel
```

Each claude-code task runs in an isolated worktree, copilot tasks run as background jobs. After all complete, worktrees are merged and results reported together.

After implementation tasks, review with `/ai-dev-review`:

```
You: /ai-dev-review task-004
```

This runs a Copilot review aware of the task context — objective, acceptance criteria, and changed files.

And so on — one task at a time, you in control.

---

## 8. When something goes wrong

If a subagent fails, the PM reads the task's rollback section and handles it:

```
❌ task-003 failed — Create POST /auth/login endpoint

What happened: Import error — bcrypt not installed.
Rollback: no files were modified (safe state).

Options:
  1. Add bcrypt to requirements and retry
  2. Adjust the task to use a different hashing library
  3. Stop and review
```

Nothing proceeds without your decision.

---

## 9. Knowledge and continuity (automatic)

You don't manage memory — the files and hooks do:

- **Every task teaches something.** Delivery reports have a `## Conhecimento` section; the PM records it into
  `context.md` with `aidev learn gotcha|decision|note`. Lessons for every project go to the ai-dev repo
  (`aidev learn note --global --applies databricks`), shared with `aidev sync`.
- **The PM keeps `handoff.md` current** (`aidev handoff set --foco task-004 --persona security …`).
- **Compaction doesn't lose the thread.** Before compacting, a hook saves a snapshot and tells the summarizer what
  it must keep; after, the PM role, the active persona, the plan and your last messages come back first.
- **Next day, other machine, cloud session:** the PM reads `.ai-dev/` and picks up where it stopped.

Ask "what do we know about X?" and the PM runs `aidev recall X` across the whole `.ai-dev/`.
Details: [Knowledge & Skills](knowledge-and-skills.md).

---

## 10. Building something big? Use the harness

For an app or product surface (20–300 behaviours), switch to harness mode: `/ai-dev-harness` writes a feature list
(all failing), `init.sh` and a capabilities file; you approve it; `/ai-dev-loop 10` chains fresh sessions that each
implement and browser-test exactly one feature. Details: [Long-Running Harness](long-running-harness.md).

---

## Useful chat commands

| Command / what you say | What happens |
|------------------------|--------------|
| `/ai-dev-exec` | Execute the next ready task (offers parallel if multiple ready) |
| `/ai-dev-exec task-003` | Execute a specific task |
| `/ai-dev-exec --parallel` | Run all parallel-safe ready tasks simultaneously |
| `/ai-dev-exec --parallel-max 6` | Parallel batch with custom max size |
| `/ai-dev-review` | Copilot review of the last completed task |
| `/ai-dev-review --adversarial` | Adversarial review (questions design decisions) |
| `/ai-dev-knowledge` | Refresh the code map in `context.md`; `--promote` moves knowledge to the right place |
| `/ai-dev-harness` · `/ai-dev-session` · `/ai-dev-loop N` | Long builds: feature list, one session, chain of N sessions |
| "what do we know about auth?" | PM runs `aidev recall auth` |
| "remember that the API is paginated by cursor" | PM records it with `aidev learn` |
| "where were we?" | PM reads `handoff.md` and the session log |
| "project status" | PM shows full dashboard |
| "pause here" | PM stops, waits for you |
| "skip to task-004" | PM checks dependencies, warns if blocked |
| "task-003 goes to copilot gpt-5.4 xhigh" | PM updates the task file |
| "add persona security to task-003" | PM sets specialist lens for the task |
| "add a task for API documentation" | PM creates task, updates plan and dependencies |
| "what did task-002 change?" | PM reads and summarizes the delivery report |

---

## Turn it off

```
/ai-dev-off    ← disable, Claude returns to normal behavior
/ai-dev-on     ← re-enable, PM resumes exactly where it left off
```

When off, Claude applies no ai-dev rules — useful for exploratory sessions or quick prototyping. All `.ai-dev/` project files are preserved.

---

## Next

- [System Overview](overview.md) — full architecture, roles, design decisions
- [Copilot Plugin](copilot-plugin.md) — plugin reference: commands, models, effort levels
- [Databricks Example](databricks-example.md) — end-to-end pipeline with Asset Bundle
- [Knowledge & Skills](knowledge-and-skills.md) — memory, handoff, compaction protocol, Superpowers + Karpathy
- [Long-Running Harness](long-running-harness.md) — hours of work, one verified feature per session
