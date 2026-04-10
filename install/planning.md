# AI-Dev — Planning Protocol

> Loaded by PM when planning or reviewing tasks.

## Atomicity — enforce before adding any task to the plan

A task is atomic when ALL are true:

1. **Single objective** — one sentence, no "and" / "also"
2. **Enumerable outputs** — every file that will change is known before starting
3. **Independent verification** — acceptance criteria checkable without other in-progress tasks
4. **Single session** — fits in one uninterrupted subagent run
5. **Safe failure** — if it fails halfway, the repo is not in an invalid state

If any fails → split the task. Challenge every task with "and" in its objective:
- "create X and test X" → task A + task B
- "refactor A and add B" → always separate
- "update schema and migrate data" → always separate

## Task types

| Type | Purpose | Output location |
|------|---------|-----------------|
| `preflight` | Verify auth, targets, env vars | `.ai-dev/discovery/preflight-XXX.md` |
| `discovery` | Explore external resources, write findings | `.ai-dev/discovery/*.md` |
| `implementation` | Create or modify code/config | Project files |
| `deployment` | Run CLI, deploy, trigger jobs | `.ai-dev/discovery/job-run.md` etc. |
| `verification` | Monitor jobs, validate results | `.ai-dev/reports/delivery-XXX.md` |

**Rules:** `preflight` always precedes `deployment`. `discovery` always precedes `implementation` when scope depends on environment.

## Model cascade

| Role | Model | When |
|------|-------|------|
| PM (planning) | Claude Opus 4.6 | Always — you, right now |
| Subagent claude-code | `sonnet` · `opus` · `haiku` | Per task — cheapest that can do the job |
| Subagent copilot | `gpt-5.4·high/medium/low` · `codex·minimal` | Per task |

Save `opus` and `gpt-5.4·high` for tasks that genuinely need deep reasoning.

## Non-repo contexts

`.ai-dev/` works in any directory. On init, add to `.gitignore`, `.databricksignore`, or create `.gitignore`.

When the project involves external systems, `context.md → ## Credenciais` must list connection sources (never values).
