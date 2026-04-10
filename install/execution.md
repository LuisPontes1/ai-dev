# AI-Dev — Execution Protocols

> Loaded by PM on demand. Each section is triggered by a specific event.
> Do not read this file in full — jump to the relevant section.

---

## Pre-flight section

**Trigger:** next task has `Type: deployment`

Before spawning the deployment subagent, check `assignments.md` for a completed preflight task linked to this deployment. If none exists:

1. Create `task-XXX-preflight.md` (executor: claude-code · sonnet, type: preflight)
2. The preflight subagent reads `context.md → ## Credenciais` and verifies:
   - Every credential is accessible (CLI auth, env vars, config files)
   - Target environments exist (validate commands, bucket access, etc.)
   - Any preconditions in the deployment task's `## Notas`
3. Preflight writes `.ai-dev/discovery/preflight-XXX.md` — checklist of what was verified
4. **If preflight fails:** stop, report exactly what is missing. Do not proceed to deployment.
5. Log: `[timestamp] Preflight task-XXX: passed|failed.`

---

## Rollback section

**Trigger:** subagent returns failure or reports partial completion

1. Read the failed task's `## Rollback` section
2. If steps exist: spawn a recovery subagent with only those rollback steps. It writes `.ai-dev/reports/rollback-XXX.md`.
3. If rollback is "Não aplicável": confirm with user that partial state is acceptable before continuing.
4. **Never start the next task after failure without explicit user confirmation.**
5. Update task status to `failed` in `assignments.md` and task file.
6. Log: `[timestamp] Task-XXX failed. Rollback: executed|skipped. User decision: [decision].`
7. Append to `plan.md → ## Changelog`: what failed, what was rolled back, user decision.

---

## Copilot section

**Trigger:** task has `executor: copilot`

1. Read the task file fully (objective, inputs, outputs, acceptance criteria)
2. Read all files in `## Contexto necessário` and `## Inputs`
3. Write a self-contained prompt to `.ai-dev/tasks/task-XXX-prompt.md` — all context inline, must not rely on anything outside the file
4. Invoke via companion script using `--prompt-file` (never pass prompt inline):
   ```bash
   node ~/.claude/plugins/ai-dev-copilot/plugins/copilot/scripts/copilot-companion.mjs \
     task --write --model <model> --effort <effort> \
     --prompt-file .ai-dev/tasks/task-XXX-prompt.md
   ```
   For complex reasoning tasks (`Type: implementation` with architectural scope): use `/copilot:rescue` instead — it detects the prompt file when ai-dev is active.
5. Monitor with `/copilot:status`, retrieve with `/copilot:result`
6. Verify acceptance criteria, write delivery report, update `assignments.md`

**Model selection:**
| Complexity | Model | Effort |
|------------|-------|--------|
| Architectural, multi-file | `gpt-5.4` | `high` or `xhigh` |
| Standard feature/fix | `gpt-5.4` | `medium` |
| Simple, well-scoped | `gpt-5.4` | `low` |
| Pure code generation | `codex` | `minimal` |

If plugin unavailable (`/copilot:setup` fails): fall back to `executor: claude-code`, note in delivery report.

---

## Feedback section

**Trigger:** delivery report `## Impacto no plano` is not "None"

1. Show the user: "Task XXX found something that may affect the plan: [finding]"
2. Propose concrete adjustments to affected task files
3. Wait for user confirmation
4. Update affected task files
5. Append to `plan.md → ## Changelog`: what changed and why
6. Log: `[timestamp] Plan updated after task-XXX finding: [summary].`
7. Only then proceed to next task

This is mandatory for `discovery` tasks — their purpose is to find things that change the plan.

---

## Changelog section

**Trigger:** plan changes after initial approval (task added/removed/reordered, executor/model changed)

Append to `plan.md → ## Changelog`:
```
| YYYY-MM-DD | [description of change] | [reason] |
```
Never edit existing entries — append only.
Log: `[timestamp] Plan changelog updated: [summary].`

---

## Credentials section

**Trigger:** task requires external access (Databricks, APIs, cloud)

1. Subagent reads `context.md → ## Credenciais`
2. Resolves each credential from its declared source (file path or env var name — never values in files)
3. If any credential is missing or inaccessible: stop, write blocker to delivery report
4. PM reads report, surfaces the blocker to user
5. Log: `[timestamp] Credentials check for task-XXX: ok|blocked on [credential name].`
