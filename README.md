# ai-dev

> Planning-first development for Claude Code + GitHub Copilot.
> You talk to the chat. Agents do the work. Files carry the context.

---

## The problem

When you use Claude Code directly, context lives in the chat, decisions are implicit, and when you reopen the session the next day there's no record of what was planned, executed, or why. If something breaks mid-way, there's no rollback, no audit trail, no way to resume.

`ai-dev` adds structure. A local `.ai-dev/` folder (gitignored) in each project defines a contract:

- **You only interact via chat** — you never open a file, run a command, or check status manually
- **Claude Code becomes the Project Manager (PM)** — reads project state from files, iterates the plan with you, delegates execution to subagents
- **Each task runs as an isolated subagent** — it reads only its task file, executes, writes results to files, and exits
- **All context flows through files** — auditable, reproducible, resumable across sessions

---

## What it looks like

You open a repo. The PM reads `.ai-dev/` and shows a dashboard:

```
## Project: minha-api
Plan: approved

  ✅ done    : task-001 — Verificar dependências
  ✅ done    : task-002 — Criar modelo User
  🔜 next    : task-003 — Criar middleware JWT (copilot · gpt-5.4·high)
  ⏳ pending : task-004, task-005

Next: Ready to start task-003. Confirm?
```

You say "go". PM spawns a subagent. When it's done, PM reads the delivery report and tells you what happened. You confirm. Next task. One at a time, you in control.

Before any execution, the PM plans with you — proposes tasks, checks each one is atomic, assigns executors and models, and waits for your explicit approval.

---

## Install

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh        # pass --dry-run to preview without writing
```

**What gets installed:**

| What | Where | Purpose |
|------|-------|---------|
| Core instructions | `~/CLAUDE.md` | PM behavior, startup protocol, subagent template |
| Protocol files | `~/.claude/ai-dev/planning.md` | Atomicity rules, model cascade, task types |
| | `~/.claude/ai-dev/execution.md` | Rollback, preflight, copilot, credentials, feedback |
| Templates | `~/.claude/ai-dev/templates/` | Starters, task/report/agent templates |
| Toggle flag | `~/.claude/ai-dev/enabled` | System is ON when this file exists |
| Slash commands | `~/.claude/commands/` | `/ai-dev-init`, `/ai-dev-on`, `/ai-dev-off` |
| Copilot plugin | `~/.claude/plugins/ai-dev-copilot/` | Copilot SDK + programmatic integration |
| Copilot commands | `~/.claude/commands/copilot/` | `/copilot:setup`, `/copilot:review`, `/copilot:rescue`, ... |

The installer includes the Copilot plugin with `@github/copilot-sdk` — no separate installation needed. Requires Node.js >= 18.18 and `gh auth login` for GitHub authentication.

---

## Turn it on and off

```
/ai-dev-on     ← activate planning-first mode
/ai-dev-off    ← back to normal Claude Code
```

When off: zero overhead, no mentions, Claude behaves normally. Your `.ai-dev/` folders and all project state are preserved. Turn it back on with `/ai-dev-on` and the PM picks up where you left off.

---

## Usage

1. Open any project in VS Code with Claude Code active
2. PM detects no `.ai-dev/` → offers to initialize
3. `/ai-dev-init` creates the structure using the right starter for your project type
4. Review `.ai-dev/context.md`, describe what you want to build
5. PM proposes tasks — you adjust executors, models, ordering
6. Approve the plan → execution starts, one task at a time
7. After each task: PM reads the delivery report and tells you what happened

---

## Architecture: core + on-demand

The system is designed to use minimal context. `~/CLAUDE.md` contains only the core (~80 lines): startup, context rule, plan gate, subagent template.

Heavy protocols are loaded **only when triggered**:

| Event | Protocol loaded |
|-------|----------------|
| Planning or reviewing tasks | `~/.claude/ai-dev/planning.md` |
| Task is `executor: copilot` | `~/.claude/ai-dev/execution.md` → Copilot section |
| Next task is `deployment` | `~/.claude/ai-dev/execution.md` → Pre-flight section |
| Subagent fails | `~/.claude/ai-dev/execution.md` → Rollback section |
| Discovery finds something unexpected | `~/.claude/ai-dev/execution.md` → Feedback section |

This keeps the PM's context window clean — protocols are pulled in just-in-time, not preloaded.

---

## Project structure

Each project gets this (created by `/ai-dev-init`, gitignored):

```
.ai-dev/
├── context.md            # Project briefing: stack, architecture, credentials
├── plan.md               # Plan + approval gate + changelog
├── session-log.md        # Append-only PM action log (audit trail)
├── tasks/
│   ├── _template.md      # Task template with atomicity checklist
│   └── task-001.md       # One file per task — subagent's only instruction
├── agents/
│   ├── assignments.md    # Task → executor · model · status
│   └── roles.md          # Executor definitions
├── dependencies/
│   └── graph.md          # DAG: which tasks block which
├── discovery/            # Findings from discovery/preflight/deployment tasks
└── reports/
    └── delivery-001.md   # Written by subagent on task completion
```

---

## Executors

| Executor | How it works | When to use |
|----------|-------------|-------------|
| `claude-code` | Subagent reads task file, executes autonomously | Multi-file changes, architecture, tests |
| `copilot` | PM invokes Copilot plugin directly (no manual VS Code interaction) | Code generation, refactors, CRUD |
| `manual` | PM generates instruction file, you execute and confirm | Credentials, external systems, judgment calls |

The `copilot` executor uses the integrated Copilot plugin (`@github/copilot-sdk`), installed automatically by `install.sh`. See [docs/copilot-plugin.md](docs/copilot-plugin.md) for commands, models, and effort levels.

---

## Works beyond git repos

`.ai-dev/` works in any directory: Databricks Asset Bundles, study folders, pipelines. The `/ai-dev-init` command detects the project type and uses the right starter template. See [Databricks example](docs/databricks-example.md).

---

## Documentation

| Doc | What it covers |
|-----|---------------|
| [Quick Start](docs/quick-start.md) | Zero to first planned project, step by step |
| [System Overview](docs/overview.md) | Full architecture, roles, flows, design decisions |
| [Copilot Plugin](docs/copilot-plugin.md) | Plugin reference: commands, models, effort levels |
| [Databricks Example](docs/databricks-example.md) | End-to-end pipeline with Asset Bundle |

## Slash commands

| Command | What it does |
|---------|-------------|
| `/ai-dev-on` | Enable planning-first mode |
| `/ai-dev-off` | Disable, return to normal Claude Code |
| `/ai-dev-init` | Initialize `.ai-dev/` in current project |
| `/ai-dev-exec` | Execute next task (auto-detects executor: claude-code, copilot, or manual) |
| `/ai-dev-exec task-003` | Execute a specific task |
| `/ai-dev-review` | Copilot review aware of task context (objective, criteria, changed files) |
| `/copilot:setup` | Verify Copilot plugin status and authentication |
| `/copilot:review` | Code review via Copilot (working tree or branch) |
| `/copilot:adversarial-review` | Review that questions design decisions and trade-offs |
| `/copilot:rescue` | Delegate a task to Copilot (ai-dev-aware when system is ON) |
| `/copilot:status` | Check background job status |
| `/copilot:result` | Retrieve result of a finished job |
| `/copilot:cancel` | Cancel an active job |
