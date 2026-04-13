# Quick Start

From zero to first planned project in 10 minutes.

---

## 1. Install

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh
```

Use `--dry-run` to preview what will be created without writing anything.

**What gets installed:**

```
~/CLAUDE.md                      ← PM core instructions (~80 lines)
~/.claude/ai-dev/enabled         ← toggle flag (system is ON)
~/.claude/ai-dev/planning.md     ← on-demand: atomicity, types, models, personas
~/.claude/ai-dev/execution.md    ← on-demand: rollback, preflight, copilot, parallel, credentials
~/.claude/ai-dev/personas/       ← 8 specialist prompt templates
~/.claude/ai-dev/templates/      ← starters, task/report/agent templates
~/.claude/commands/ai-dev-*.md   ← /ai-dev-init, /ai-dev-on, /ai-dev-off
```

The installer includes the Copilot plugin (`@github/copilot-sdk`) — it copies the plugin, runs `npm install`, and installs the `/copilot:*` slash commands automatically.

**Verify:**
```bash
ls ~/.claude/ai-dev/
# enabled  execution.md  personas/  planning.md  templates/
```

---

## 2. Open a project

Open any repo in VS Code with Claude Code active. The PM reads the project state and responds:

```
This project has no .ai-dev/. Want me to initialize it with /ai-dev-init?
```

Say "yes" or "go ahead".

---

## 3. Initialize

The PM runs `/ai-dev-init`. It:

1. Detects your project type (`python-package`, `databricks-bundle`, `data-pipeline`, or `generic`)
2. Creates `.ai-dev/` with all files, using the matching starter template
3. Pre-fills `context.md` with what it can infer from the project
4. Adds `.ai-dev/` to `.gitignore` (or `.databricksignore`)

PM response:

```
Initialized. Detected: python-package

Files created:
  .ai-dev/context.md            ← review [TODO] sections
  .ai-dev/plan.md               ← Status: draft
  .ai-dev/session-log.md
  .ai-dev/tasks/_template.md
  .ai-dev/agents/assignments.md
  .ai-dev/agents/roles.md
  .ai-dev/dependencies/graph.md
  .ai-dev/discovery/
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

## Useful chat commands

| Command / what you say | What happens |
|------------------------|--------------|
| `/ai-dev-exec` | Execute the next ready task (offers parallel if multiple ready) |
| `/ai-dev-exec task-003` | Execute a specific task |
| `/ai-dev-exec --parallel` | Run all parallel-safe ready tasks simultaneously |
| `/ai-dev-exec --parallel-max 6` | Parallel batch with custom max size |
| `/ai-dev-review` | Copilot review of the last completed task |
| `/ai-dev-review --adversarial` | Adversarial review (questions design decisions) |
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
