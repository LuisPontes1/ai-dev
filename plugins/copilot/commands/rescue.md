---
description: Delegate investigation, an explicit fix request, or follow-up rescue work to the Copilot rescue subagent
argument-hint: "[--background|--wait] [--resume|--fresh] [--model <model>] [--effort <none|minimal|low|medium|high|xhigh>] [what Copilot should investigate, solve, or continue]"
context: fork
allowed-tools: Bash(node:*), AskUserQuestion
---

Route this request to the `copilot:copilot-rescue` subagent.
The final user-visible response must be Copilot's output verbatim.

Raw user request:
$ARGUMENTS

## ai-dev context enrichment

Before routing, check if ai-dev is active and has a relevant task:

1. Check if `~/.claude/ai-dev/enabled` exists AND `.ai-dev/` exists in the current directory.
2. If ai-dev is active:
   - Read `.ai-dev/agents/assignments.md`
   - Find any task with status `in-progress` and `executor: copilot`
   - If found, read `.ai-dev/tasks/task-XXX.md` and all files in "## Contexto necessário" and "## Inputs"
   - Prepend the task context to the user's request:
     ```
     Context from ai-dev task-XXX:
     Objective: [from task file]
     Expected outputs: [from task file]
     Acceptance criteria: [from task file]

     Relevant context:
     [contents of context files, inline]

     User request: [original $ARGUMENTS]
     ```
   - Use the model and effort from the task file unless the user explicitly overrides with `--model` or `--effort`
3. If ai-dev is not active or no copilot task is in-progress, proceed with the raw request as-is.

## Execution mode

- If the request includes `--background`, run the `copilot:copilot-rescue` subagent in the background.
- If the request includes `--wait`, run the `copilot:copilot-rescue` subagent in the foreground.
- If neither flag is present, default to foreground.
- `--background` and `--wait` are execution flags for Claude Code. Do not forward them to `task`, and do not treat them as part of the natural-language task text.
- `--model` and `--effort` are runtime-selection flags. Preserve them for the forwarded `task` call, but do not treat them as part of the natural-language task text.
- If the request includes `--resume`, do not ask whether to continue. The user already chose.
- If the request includes `--fresh`, do not ask whether to continue. The user already chose.
- Otherwise, before starting Copilot, check for a resumable rescue thread from this Claude session by running:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/copilot-companion.mjs" task-resume-candidate --json
```

- If that helper reports `available: true`, use `AskUserQuestion` exactly once to ask whether to continue the current Copilot thread or start a new one.
- The two choices must be:
  - `Continue current Copilot thread`
  - `Start a new Copilot thread`
- If the user is clearly giving a follow-up instruction such as "continue", "keep going", "resume", "apply the top fix", or "dig deeper", put `Continue current Copilot thread (Recommended)` first.
- Otherwise put `Start a new Copilot thread (Recommended)` first.
- If the user chooses continue, add `--resume` before routing to the subagent.
- If the user chooses a new thread, add `--fresh` before routing to the subagent.
- If the helper reports `available: false`, do not ask. Route normally.

Operating rules:

- The subagent is a thin forwarder only. It should use one `Bash` call to invoke `node "${CLAUDE_PLUGIN_ROOT}/scripts/copilot-companion.mjs" task ...` and return that command's stdout as-is.
- Return the Copilot companion stdout verbatim to the user.
- Do not paraphrase, summarize, rewrite, or add commentary before or after it.
- Do not ask the subagent to inspect files, monitor progress, poll `/copilot:status`, fetch `/copilot:result`, call `/copilot:cancel`, summarize output, or do follow-up work of its own.
- Leave `--effort` unset unless the user explicitly asks for a specific reasoning effort.
- Leave the model unset unless the user explicitly asks for one. If they ask for `spark`, map it to `gpt-5.3-codex`.
- Leave `--resume` and `--fresh` in the forwarded request. The subagent handles that routing when it builds the `task` command.
- If the helper reports that Copilot is missing or unauthenticated, stop and tell the user to run `/copilot:setup`.
- If the user did not supply a request, ask what Copilot should investigate or fix.
