# System Overview

---

## Design principles

Three rules drive every decision in the system:

1. **Context lives in files, never in chat.** An agent that reads a file gets the same information regardless of what conversation preceded it. This makes tasks reproducible, auditable, and resumable across sessions.

2. **The PM orchestrates, subagents execute.** The chat session is the PM — it reads `.ai-dev/` files, plans with the user, delegates tasks, and reports results. It never executes work inline. Subagents are isolated: they see only their task file and referenced inputs, nothing else.

3. **Nothing happens without explicit approval.** The plan must be approved. Each task must be confirmed. After failures, the user decides what happens next. The system never takes initiative.

---

## Roles

```
┌────────────────────────────────────────────────────────┐
│                       YOU                              │
│   Talk via chat · approve plan · confirm each task     │
│   Never open files · never run commands                │
└─────────────────────────┬──────────────────────────────┘
                          │ chat
┌─────────────────────────▼──────────────────────────────┐
│              PROJECT MANAGER (PM)                      │
│          Claude Code · Opus 4.6                        │
│                                                        │
│  Reads .ai-dev/ on session start                       │
│  Shows project dashboard                               │
│  Plans tasks, enforces atomicity                       │
│  Assigns executor + model per task                     │
│  Confirms with you before each task                    │
│  Spawns subagents for execution                        │
│  Reads delivery reports, reports results               │
│  Manages rollback on failure                           │
│  Logs every action to session-log.md                   │
└────┬───────────────────┬───────────────────┬───────────┘
     │ spawn             │ spawn             │ generate
     ▼                   ▼                   ▼
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│ SUBAGENT │    │   SUBAGENT   │    │  MANUAL TASK     │
│  claude  │    │    copilot   │    │                  │
│  -code   │    │              │    │  PM writes       │
│          │    │ Reads task   │    │  instructions.md │
│ Reads    │    │ Calls plugin │    │  User executes   │
│ task file│    │ --write      │    │  User confirms   │
│ Executes │    │ --model      │    │                  │
│ Writes   │    │ --effort     │    │                  │
│ report   │    │ Writes       │    │                  │
│          │    │ report       │    │                  │
└────┬─────┘    └──────┬───────┘    └────────┬─────────┘
     │                 │                     │
     └─────────────────┼─────────────────────┘
                       ▼
         ┌──────────────────────────┐
         │        .ai-dev/         │
         │  tasks/ · reports/      │
         │  discovery/ · agents/   │
         │  session-log.md         │
         └──────────────────────────┘
```

---

## Toggle: on and off

| State | Command | Behavior |
|-------|---------|----------|
| **ON** | `/ai-dev-on` or `install.sh` | PM active, planning-first, all protocols applied |
| **OFF** | `/ai-dev-off` | Normal Claude Code, zero overhead, no mention of ai-dev |

The toggle is a file: `~/.claude/ai-dev/enabled`. Present = ON. Absent = OFF. Turning off preserves everything — project `.ai-dev/` folders, templates, protocols. `/ai-dev-on` resumes exactly where you left off.

**When to turn off:** exploratory sessions, quick prototyping, or any conversation where planning overhead isn't worth it.

---

## Architecture: core + on-demand protocols

A common problem with large system prompts is that the model "forgets" rules buried in the middle. ai-dev avoids this by splitting instructions into a slim core and modular protocols loaded just-in-time.

**Core** (`~/CLAUDE.md`, ~80 lines):
- Startup sequence (check toggle → check `.ai-dev/` → show dashboard)
- Context source rule (everything from files)
- Plan gate (nothing executes until approved)
- Subagent prompt template (what the subagent reads and writes)
- On-demand trigger table

**On-demand protocols** (loaded only when triggered):

| File | Sections | Loaded when |
|------|----------|-------------|
| `~/.claude/ai-dev/planning.md` | Atomicity rules, task types, model cascade | PM creates or reviews tasks |
| `~/.claude/ai-dev/execution.md` | Pre-flight | Next task is `deployment` |
| | Rollback | Subagent fails |
| | Copilot | Task executor is `copilot` |
| | Feedback | Delivery report has plan impact |
| | Changelog | Plan changes post-approval |
| | Credentials | Task needs external access |

This means the PM operates with minimal context most of the time. When a deployment task comes up, it reads the pre-flight protocol. When a subagent fails, it reads the rollback protocol. The rest of the time, those sections aren't in context at all.

---

## Session lifecycle

### Opening a session

```
Check ~/.claude/ai-dev/enabled
  └── OFF → normal Claude Code, stop here
  └── ON  → continue

Check .ai-dev/ in current directory
  └── Not found → offer /ai-dev-init, stop
  └── Found → read context.md, plan.md, assignments.md, graph.md, session-log.md (last 5)
               show project dashboard
               log: "Session opened"
```

### Planning phase

The PM reads `~/.claude/ai-dev/planning.md` and works with you to design the plan:

1. Proposes tasks based on what you described
2. Checks each task for **atomicity** — 5 criteria must pass:
   - Single objective (no "and")
   - Enumerable outputs (files known before starting)
   - Independent verification (testable alone)
   - Single session (fits one subagent run)
   - Safe failure (repo stays valid if it breaks mid-way)
3. Assigns **executor** (`claude-code`, `copilot`, `manual`) and **model/effort** per task
4. Sequences tasks respecting dependencies
5. Adds `preflight` tasks before any `deployment`
6. Iterates until you explicitly approve

### Execution phase

For each task, in order:

```
PM shows task summary → you confirm
     │
     ▼
PM spawns isolated subagent
(reads only: task file + referenced files)
     │
     ▼
Subagent executes → writes delivery report → updates status
     │
     ▼
PM reads delivery report
     │
     ├── "## Impacto no plano" is "None"
     │     → PM reports result, proposes next task
     │
     └── "## Impacto no plano" has findings
           → PM pauses, shows findings to you
           → you decide how to adjust the plan
           → PM updates affected tasks, logs to changelog
           → then proposes next task
```

### When a task fails

```
PM reads delivery report → status is "failed"
     │
     ▼
PM reads task's "## Rollback" section
     │
     ├── Rollback steps exist
     │     → PM spawns recovery subagent
     │     → recovery executes rollback steps
     │     → writes rollback-XXX.md
     │
     └── "Não aplicável"
           → PM asks you to confirm partial state is OK
     │
     ▼
PM reports what happened → waits for your decision
(retry? skip? adjust plan? stop?)
```

---

## Task types

| Type | Purpose | What the subagent produces |
|------|---------|---------------------------|
| `preflight` | Verify credentials, targets, env vars exist | `discovery/preflight-XXX.md` (checklist) |
| `discovery` | Explore external resources, map environment | `discovery/*.md` (findings) |
| `implementation` | Create or modify code, config, notebooks | Project files |
| `deployment` | Run CLI commands, deploy, trigger jobs | `discovery/job-run.md` (run IDs, logs) |
| `verification` | Monitor jobs, validate results | `reports/delivery-XXX.md` |

**Sequencing rules:**
- `preflight` always before `deployment` (mandatory — PM creates one if missing)
- `discovery` before `implementation` when scope depends on environment state

---

## Model cascade

| Role | Model | Reasoning |
|------|-------|-----------|
| PM (planning) | Claude Opus 4.6 | Full reasoning for architecture, atomicity, dependencies |
| Subagent (claude-code) | `sonnet` default · `opus` complex · `haiku` simple | Per task, cheapest that works |
| Subagent (copilot) | `gpt-5.4·high/medium/low` · `codex·minimal` | Per task, effort matches complexity |

The PM always runs on the strongest model — that's where architectural decisions happen. Execution subagents use the cheapest model that can do the job. This is assigned during planning and visible in the plan table.

---

## Project file structure

```
.ai-dev/
│
├── context.md
│     Project briefing: objective, stack, architecture, credentials (names only, never values)
│     Read by PM on startup. Referenced by subagents via task files.
│
├── plan.md
│     Status: draft|approved. Task table with executor/model/effort.
│     Sequence, risks, acceptance criteria. Changelog (append-only).
│
├── session-log.md
│     Append-only audit log. PM writes every significant action with timestamp.
│     On session start, PM reads only the last 5 entries for context.
│
├── tasks/
│   ├── _template.md           Atomicity checklist, type, rollback section, all fields
│   ├── task-001.md            Self-contained instruction for the subagent
│   ├── task-001-questions.md  PM writes when task needs clarification before spawning
│   └── task-001-instructions.md  Generated by subagent for manual tasks
│
├── agents/
│   ├── assignments.md         Task → executor · model · status · session ID · dates
│   └── roles.md               Definition of each executor and how it receives context
│
├── dependencies/
│   └── graph.md               DAG: task X only starts after task Y is done
│
├── discovery/
│   ├── preflight-001.md       Credentials/env check result
│   ├── tables-findings.md     Example: schema exploration output
│   └── job-run.md             Example: run_id from deployment task
│
└── reports/
    ├── delivery-001.md        What was done, files changed, criteria met, plan impact
    └── rollback-001.md        What was rolled back after failure
```

---

## Audit trail

The system produces three levels of audit:

1. **session-log.md** — what the PM did: opened session, spawned subagent, reported result, updated plan. Append-only, timestamped.

2. **delivery-XXX.md** — what the subagent did: files changed, acceptance criteria status, deviations, plan impact. One per completed task.

3. **plan.md changelog** — what changed in the plan and why: task added, reordered, executor changed, post-discovery adjustment. Append-only.

Together, these answer: *what was the plan? what actually happened? why did the plan change?*

---

## Why not just use the chat

| | ai-dev system | Chat only |
|---|---|---|
| **Context across sessions** | Persisted in files | Lost when session closes |
| **Subagent receives** | Only the task file | Entire conversation history |
| **Audit** | session-log + delivery reports + changelog | Implicit in chat history |
| **Rollback** | Defined per task, executed automatically | Manual |
| **Resumption** | PM reads files and continues | Requires re-explaining everything |
| **Multi-executor** | Claude Code + Copilot + manual | Claude Code only |
| **Cost control** | Model assigned per task (opus only where needed) | Same model for everything |

---

## Supported project types

| Context | Ignore file | Starter template |
|---------|-------------|-----------------|
| Git repo (Python) | `.gitignore` | `python-package` |
| Git repo (other) | `.gitignore` | `generic` |
| Databricks Bundle | `.databricksignore` | `databricks-bundle` |
| Data pipeline | `.gitignore` | `data-pipeline` |
| Study folder | `.gitignore` (created) | `generic` |

`/ai-dev-init` detects the type automatically and pre-fills `context.md` with the right sections.
