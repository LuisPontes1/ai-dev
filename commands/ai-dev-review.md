Run a Copilot code review aware of the current ai-dev task context.

Usage:
- `/ai-dev-review` — review changes from the most recently completed task
- `/ai-dev-review task-003` — review changes from a specific task
- `/ai-dev-review --adversarial` — adversarial review (questions design decisions, not just bugs)
- `/ai-dev-review --scope branch` — review full branch instead of task-specific changes

---

## Step 1 — Determine review context

If the user provided a task ID:
- Read `.ai-dev/reports/delivery-<ID>.md`
- Extract the list of modified files from `## Arquivos modificados`

If no task ID:
- Read `.ai-dev/agents/assignments.md`
- Find the most recently completed task (status: `done`)
- Read its delivery report

If no completed task exists:
- Fall back to a regular `/copilot:review` with no task context

---

## Step 2 — Build review scope

From the delivery report, build context:
- **Files changed** — the specific files from `## Arquivos modificados`
- **Task objective** — from the task file's `## Objetivo`
- **Acceptance criteria** — from the task file's `## Critério de aceite`
- **Plan impact** — from `## Impacto no plano` (if not "None")

---

## Step 3 — Execute review

Determine review type:
- Default: normal review (`/copilot:review`)
- If `--adversarial` flag: adversarial review (`/copilot:adversarial-review`)

Build a focus text that includes the ai-dev context:

```
Review the changes from task-XXX: [objective].

Acceptance criteria that should be met:
[list from task file]

Files modified:
[list from delivery report]

[If adversarial: Also question whether the approach chosen is the right one
for the task objective, not just whether the implementation is correct.]
```

Execute the review:
- If normal: run `/copilot:review --wait` with the focus text
- If adversarial: run `/copilot:adversarial-review --wait` with the focus text
- If `--scope branch`: add `--scope branch` to the command

---

## Step 4 — Report results

1. Present the Copilot review output to the user verbatim
2. If the review found issues:
   - Cross-reference with the task's acceptance criteria
   - Suggest whether to:
     - Fix issues in the current task (reopen it)
     - Create a follow-up task for non-critical items
     - Accept as-is if findings are minor
3. If the review is clean:
   - Confirm the task passes review
   - Suggest proceeding to the next task
4. Log to `.ai-dev/session-log.md`:
   ```
   [timestamp] Review of task-XXX completed via Copilot [normal|adversarial]. Verdict: [approve|needs-attention].
   ```

---

## When to suggest this command

As the PM, proactively suggest `/ai-dev-review` after:
- Any `implementation` task with multiple files changed
- Any task where the delivery report has `## Desvios do plano original` that is not "None"
- Before proceeding to a `deployment` task (review the implementation that precedes it)

---

## What NOT to do

- Do NOT auto-fix issues found in the review — present them and let the user decide
- Do NOT skip the review if the user explicitly requested it
- Do NOT run adversarial review by default — only when the user asks or for architectural tasks
