Execute a task from the approved plan. Reads the task file, detects the executor, and dispatches accordingly.

Usage:
- `/ai-dev-exec` — picks the next ready task
- `/ai-dev-exec task-003` — executes a specific task
- `/ai-dev-exec task-003 --model gpt-5.4 --effort xhigh` — override model and/or effort at execution time
- `/ai-dev-exec --model opus` — override model for the next ready task

Supported `--model` values:
- Claude: `opus`, `sonnet`, `haiku`
- Copilot: `gpt-5.4`, `codex`, `gemini`

Supported `--effort` values (Copilot only): `none`, `minimal`, `low`, `medium`, `high`, `xhigh`

If `--model` or `--effort` are not provided, uses the values from the task file.

---

## Step 1 — Resolve which task to execute

If the user provided a task ID (e.g. `task-001`):
- Read `.ai-dev/tasks/task-<ID>.md`
- Verify Status is `pending` (not `done`, `failed`, or `in-progress`)

If no task ID provided:
- Read `.ai-dev/plan.md` and `.ai-dev/dependencies/graph.md`
- Find the next task that is `pending` and has all dependencies `done`
- If no task is ready, tell the user which tasks are blocked and by what

If the task is blocked by an incomplete dependency, stop and tell the user.

---

## Step 2 — Pre-execution checks

1. Read `.ai-dev/plan.md` — verify `Status: approved`. If not, stop: "Plan must be approved before execution."
2. Read the task file fully — extract: Executor, Model, Effort, Type, Objetivo, Contexto necessário, Inputs, Outputs esperados, Critério de aceite
3. Apply overrides: if the user passed `--model` or `--effort`, use those instead of the task file values. Note: `--model` can switch executor implicitly — if the task says `executor: copilot` but the user passes `--model opus`, switch to `claude-code`. Similarly, `--model gpt-5.4` on a `claude-code` task switches to `copilot`.
4. If the task Type is `deployment`, read `~/.claude/ai-dev/execution.md` → Pre-flight section. If no `preflight` task precedes this one, warn the user.
5. Show the user a summary and ask for confirmation:

```
Ready to execute: task-XXX — [title]
  Executor: [claude-code | copilot | manual] · [model] · [effort if copilot]
  Type: [type]
  Outputs: [list of expected outputs]
  [If overridden: "⚡ Model overridden: task file says X, using Y"]

Proceed?
```

Wait for user confirmation before continuing.

---

## Step 3 — Dispatch by executor

### If executor is `claude-code`:

1. Write the subagent prompt to `.ai-dev/tasks/task-XXX-prompt.md`:

```markdown
# Subagent Prompt — task-XXX

Read .ai-dev/tasks/task-XXX.md.
Read every file listed in "## Contexto necessário" and "## Inputs".
Do not read anything else. Do not use context from this conversation.

Execute the task. Stay within "## Outputs esperados" — do not modify files outside that list.

When done:
  1. Write .ai-dev/reports/delivery-XXX.md following the template at
     ~/.claude/ai-dev/templates/reports/_template.md
  2. Set Status: done in the task file
  3. Update .ai-dev/agents/assignments.md with status, session ID, and completion date
  4. Append to .ai-dev/session-log.md: [timestamp] Subagent task-XXX completed. Status: done.

If execution fails:
  1. Write .ai-dev/reports/delivery-XXX.md with what failed and why
  2. Set Status: failed in the task file
  3. Update .ai-dev/agents/assignments.md
  4. Append to .ai-dev/session-log.md: [timestamp] Subagent task-XXX failed.

Do not communicate via chat — write everything to files.
```

2. Spawn an isolated subagent with the resolved model (`sonnet`, `opus`, or `haiku`).
   The subagent's prompt is: "Read and execute `.ai-dev/tasks/task-XXX-prompt.md`."

### If executor is `copilot`:

Read `~/.claude/ai-dev/execution.md` → Copilot section.

1. Read all files from "## Contexto necessário" and "## Inputs"
2. Write a self-contained prompt file to `.ai-dev/tasks/task-XXX-prompt.md` that includes:
   - The task objective
   - All context file contents inline (the Copilot agent cannot read files itself)
   - The expected outputs with file paths
   - The acceptance criteria
   - Instruction to stay within the listed output files only
3. Determine the command flags (resolved model/effort — override takes precedence over task file):
   - `--model <model>` from `--model` override or Modelo (Copilot) field
   - `--effort <effort>` from `--effort` override or Effort field
   - `--write` (always, unless the task type is `discovery` or `verification`)
4. For simple tasks (Type: `preflight`, `discovery`, `verification`, or single-file `implementation`):
   ```bash
   node ~/.claude/plugins/ai-dev-copilot/plugins/copilot/scripts/copilot-companion.mjs \
     task --write --model <model> --effort <effort> \
     --prompt-file .ai-dev/tasks/task-XXX-prompt.md
   ```
5. For complex tasks (Type: `implementation` with multiple outputs or architectural scope):
   Write the prompt file first, then use `/copilot:rescue --model <model> --effort <effort>` — the rescue command will detect the active ai-dev task and read the prompt file.
6. After Copilot completes:
   - Verify acceptance criteria against actual results
   - Write `.ai-dev/reports/delivery-XXX.md` following the template
   - Set Status: `done` or `failed` in the task file
   - Update `.ai-dev/agents/assignments.md`
   - Append to `.ai-dev/session-log.md`

### If executor is `manual`:

1. Generate `.ai-dev/tasks/task-XXX-instructions.md` with:
   - Step-by-step instructions for the user
   - What commands to run, what to configure, what to verify
   - Expected outcome and how to confirm it worked
2. Tell the user:
   ```
   This is a manual task. Instructions written to:
     .ai-dev/tasks/task-XXX-instructions.md

   Execute the steps and tell me when done (or if something went wrong).
   ```
3. Wait for user confirmation, then:
   - Write delivery report based on what the user reports
   - Update task status and assignments

---

## Step 4 — Post-execution

After the task completes (any executor):

1. Read `.ai-dev/reports/delivery-XXX.md`
2. Check `## Impacto no plano`:
   - If "None" → report result, show unblocked tasks, suggest next
   - If has findings → pause, show findings, ask user how to adjust the plan. Read `~/.claude/ai-dev/execution.md` → Feedback section.
3. If the task failed:
   - Read the task's `## Rollback` section
   - If rollback steps exist, ask user if they want to execute them
   - Read `~/.claude/ai-dev/execution.md` → Rollback section
   - Present options: retry, skip, adjust plan, stop
4. Log to session-log.md
5. Show updated project status

---

## What NOT to do

- Do NOT execute without user confirmation
- Do NOT skip pre-execution checks
- Do NOT modify files outside the task's "## Outputs esperados"
- Do NOT proceed to the next task automatically — always report and wait
- Do NOT execute if the plan is not approved
