# ai-dev

> Planning-first development for Claude Code + GitHub Copilot.
> You talk to the chat. Agents do the work. Files carry the context.
> **New:** a long-running harness that keeps agents building for hours — one verified feature per session —
> and **knowledge that persists between sessions** and is injected into every one, plus Superpowers + Karpathy skills.

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

## Long-running harness — hours of work, one verified feature at a time

Based on Anthropic's [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). For builds too big for one plan (an app, 20–300 behaviours):

```
/ai-dev-harness     initializer: features.json (all failing) · init.sh · capabilities (MCP, skills) · knowledge map
                    → you approve → definitions frozen
/ai-dev-loop 10     chains fresh-context sessions; each one: read notes → smoke test → ONE feature
                    → verify in a real browser (Playwright MCP) → aidev pass --evidence → commit → handoff note
                    PM audits every session (aidev guard/doctor) and stops on anything suspicious
```

```
Harness: 42/120 features passing  ███████░░░░░░░░░  35%   blocked: 1
Last session (14): F-031 ✅ — "Next: F-032, mail is captured in tmp/mail"
```

What makes it hold over many sessions is structure, not prompting: a frozen feature list with a lock file (no rewriting tests), evidence-gated `passes`, an append-only progress log, an `init.sh` smoke test, and the project knowledge in `.ai-dev/context.md` (code map, decisions, gotchas) checked for staleness against the real tree. Full guide: [docs/long-running-harness.md](docs/long-running-harness.md).

---

## Knowledge that survives sessions — and is always used

Knowledge has no separate store — it is the `.ai-dev/` you already have, plus a general folder in this repo:

```
project:  .ai-dev/context.md   map · Decisões de arquitetura · Invariantes · Gotchas · Aprendizados
          .ai-dev/discovery/   findings (+ inventory.md from `aidev map`)
          .ai-dev/reports/     "## Conhecimento" of every task · plan.md changelog · session-log
general:  ai-dev/knowledge/    learnings.md · gotchas.md — versioned here, every project, every machine
              └──── SessionStart hook: startup · resume · /clear · after compaction ────┘
                         → "## ai-dev knowledge brief" in context, every time
```

- **Load** automatically (hook; general lessons filtered to the project's stack) · **recall** with `aidev recall <terms>` · **capture** with `aidev learn gotcha|decision|note` (into `context.md`; `--global` into `ai-dev/knowledge/`) · **share** with `aidev sync` · **promote** with `/ai-dev-knowledge --promote`
- Every subagent starts with `aidev brief` + `recall`; every delivery report has a `## Conhecimento` section the PM records
- **Karpathy guidelines** (bundled) are the baseline discipline for every subagent and Copilot prompt
- **Storytelling** skill for anything people will read (posts, talks, executive summaries): hook, ABT, papers introduced organically, Akita-style closing, no "AI smell" — and it learns your voice in `knowledge/voz.md`
- **Superpowers** (optional plugin) skills are routed by moment: brainstorming before planning, systematic-debugging on failures, verification-before-completion before "done", TDD, code review, writing-skills to promote knowledge

### Compaction doesn't make the PM forget who it is

`.ai-dev/` also carries the working state — `plan.md` + `tasks/`, `session-log.md` and **`handoff.md`** (where we
are now: focus, next step, what awaits the user, active persona). Four hooks keep it across compactions:

| Hook | Does |
|------|------|
| `PreCompact` | snapshot into `handoff.md` (plan, tasks + personas, log, git, loaded protocols, the user's last words) and **tells the summarizer what it must keep** — PM role, focus, persona, pending approvals |
| `PostCompact` | stores the summary and flags what it dropped |
| `SessionStart` (compact/resume/clear/startup) | restores **role → persona (full text) → protocols to re-read → handoff → plan → log → knowledge** |
| `SubagentStart` | gives every subagent the project knowledge |

Full guide: [docs/knowledge-and-skills.md](docs/knowledge-and-skills.md).

---

## Install

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh        # --dry-run · --with-mcp (Playwright MCP) · --with-superpowers · --no-hook
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
| Harness protocol | `~/.claude/ai-dev/harness.md` | Initializer, session, audit, loop rules |
| Harness CLI | `~/.claude/ai-dev/harness/aidev.mjs` | Feature list, guard, progress log, knowledge map (zero deps) |
| Skills | `~/.claude/skills/ai-dev-*` | Long-run session, feature list, e2e verification, knowledge, storytelling, video |
| MCP (opt-in) | user scope | Playwright MCP for browser verification (`--with-mcp`) |
| Hooks | `~/.claude/settings.json` | SessionStart · SubagentStart · PreCompact · PostCompact — session state, knowledge, compaction protocol |
| General knowledge | `knowledge/` in this repo | Cross-project learnings and gotchas, versioned; installer points the CLI here |
| Guidelines | `~/.claude/ai-dev/guidelines/` | Karpathy coding discipline |
| Skills routing | `~/.claude/ai-dev/skills.md` | When to use which ai-dev / Superpowers skill |
| Superpowers (opt-in) | Claude Code plugin | `--with-superpowers` |

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

The system is designed to use minimal context. `~/CLAUDE.md` contains only the core (~215 lines): startup, context rule, plan gate, subagent template, handoff and compaction rules, knowledge rules.

Heavy protocols are loaded **only when triggered**:

| Event | Protocol loaded |
|-------|----------------|
| Planning or reviewing tasks | `~/.claude/ai-dev/planning.md` |
| Task is `executor: copilot` | `~/.claude/ai-dev/execution.md` → Copilot section |
| Next task is `deployment` | `~/.claude/ai-dev/execution.md` → Pre-flight section |
| Subagent fails | `~/.claude/ai-dev/execution.md` → Rollback section |
| Discovery finds something unexpected | `~/.claude/ai-dev/execution.md` → Feedback section |
| Project has `.ai-dev/harness/` or a long build starts | `~/.claude/ai-dev/harness.md` |

This keeps the PM's context window clean — protocols are pulled in just-in-time, not preloaded.

---

## Project structure

Each project gets this (created by `/ai-dev-init`, gitignored):

```
.ai-dev/
├── context.md            # Project knowledge: stack, code map, decisions, invariants, gotchas, learnings, credentials (names)
├── plan.md               # Plan + approval gate + changelog
├── session-log.md        # Append-only PM action log (audit trail)
├── handoff.md            # Live state: focus, next step, awaiting user, active persona (+ compaction snapshots)
├── tasks/
│   ├── _template.md      # Task template with atomicity checklist
│   └── task-001.md       # One file per task — subagent's only instruction
├── agents/
│   ├── assignments.md    # Task → executor · model · status
│   └── roles.md          # Executor definitions
├── dependencies/
│   └── graph.md          # DAG: which tasks block which
├── discovery/            # Findings from discovery/preflight/deployment tasks (+ inventory.md from `aidev map`)
├── reports/
│   └── delivery-001.md   # Written by subagent on task completion (incl. ## Conhecimento)
├── harness/              # Long-running harness (created by /ai-dev-harness, optionally tracked in git)
│   ├── features.json     # Definition of done — all features start passes:false
│   ├── features.lock.json# Frozen definitions; `aidev guard` detects edited/removed tests
│   ├── progress.md       # Handoff note, one entry per session
│   ├── init.sh           # Bootstrap + smoke test, run first in every session
│   ├── session-prompt.md # Identical prompt for every coding session
│   ├── capabilities.md   # MCP servers, skills, verification ladder
│   └── evidence/         # Screenshots and logs proving each passing feature
```

General knowledge (all projects) lives in this repo, in `knowledge/`.

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
| [Long-Running Harness](docs/long-running-harness.md) | Initializer + session chain, feature list, knowledge map, skills, MCP |
| [Knowledge & Skills](docs/knowledge-and-skills.md) | Persistent memory (hook, recall, learn), Karpathy + Superpowers integration |

## Slash commands

| Command | What it does |
|---------|-------------|
| `/ai-dev-on` | Enable planning-first mode |
| `/ai-dev-off` | Disable, return to normal Claude Code |
| `/ai-dev-init` | Initialize `.ai-dev/` in current project |
| `/ai-dev-exec` | Execute next task (auto-detects executor: claude-code, copilot, or manual) |
| `/ai-dev-exec task-003` | Execute a specific task |
| `/ai-dev-review` | Copilot review aware of task context (objective, criteria, changed files) |
| `/ai-dev-harness` | Initialize the long-running harness (feature list, init.sh, capabilities, knowledge map) |
| `/ai-dev-session` | One fresh-context coding session: one feature, verified end to end, audited |
| `/ai-dev-loop N` | Chain up to N sessions, stopping on guard violations, blocked features or budget |
| `/ai-dev-knowledge` | Build or refresh the knowledge map |
| `/copilot:setup` | Verify Copilot plugin status and authentication |
| `/copilot:review` | Code review via Copilot (working tree or branch) |
| `/copilot:adversarial-review` | Review that questions design decisions and trade-offs |
| `/copilot:rescue` | Delegate a task to Copilot (ai-dev-aware when system is ON) |
| `/copilot:status` | Check background job status |
| `/copilot:result` | Retrieve result of a finished job |
| `/copilot:cancel` | Cancel an active job |
