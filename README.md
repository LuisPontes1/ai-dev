# ai-dev

Planning-first development system for Claude Code + GitHub Copilot.

Every repo gets a `.ai-dev/` folder (gitignored) that Claude Code reads before doing anything — context, plan, tasks, dependencies, reports. Agents read files, not chat messages.

## Install

```bash
git clone https://github.com/user/ai-dev
cd ai-dev
bash install.sh
```

This writes `~/CLAUDE.md` (global) and installs `/ai-dev-init` as a slash command in `~/.claude/commands/`.

## Usage

1. Open any repo in VS Code with Claude Code
2. Claude detects no `.ai-dev/` → prompts you to run `/ai-dev-init`
3. Review `.ai-dev/context.md` — fill in what Claude couldn't infer
4. Tell Claude what you want to build → it creates tasks in `.ai-dev/tasks/`
5. Review `.ai-dev/plan.md` → when ready, change `Status: draft` to `Status: approved`
6. Claude executes one task at a time, respecting dependencies, writing a delivery report for each

## How it works

```
.ai-dev/
├── context.md          # Project briefing — agents read this first
├── plan.md             # Plan + approval gate (nothing runs until approved)
├── tasks/              # One file per task — self-contained context
├── agents/             # Executor assignments + role definitions
├── dependencies/       # DAG: which tasks block which
└── reports/            # Auto-generated delivery reports
```

Tasks support three executors:

| Executor | What happens |
|----------|-------------|
| `claude-code` | Reads task file, executes autonomously |
| `copilot` | Claude generates a brief → you run it in VS Code inline chat |
| `manual` | Claude generates instructions → you execute |

## Docs

- [Overview](docs/overview.md) — full system explanation and flow
- [Copilot setup](docs/copilot-setup.md) — install Copilot in VS Code + integration guide

## Design principles

- **Context from files only.** Agents never receive context via chat, arguments, or env vars. Everything is in `.ai-dev/` files — auditable by nature.
- **Plan before execute.** Nothing runs until `plan.md` is explicitly approved.
- **One task at a time.** No parallel execution unless explicitly authorized.
- **Strict scope.** Agents only touch files listed in the task's `## Outputs` section.
- **Full audit trail.** Every task completion writes a delivery report.

## .gitignore

The installer adds `.ai-dev/` to your `.gitignore` automatically. For Databricks repos, it also adds to `.databricksignore`.
