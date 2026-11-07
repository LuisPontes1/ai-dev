---
name: ai-dev-long-run-session
description: Protocol for one coding session in an ai-dev long-running harness — get bearings from progress notes and git, run init.sh and a smoke test, implement exactly one feature from .ai-dev/harness/features.json, verify it end to end, record it with the aidev CLI, commit, and leave handoff notes. Use whenever a prompt says "execute .ai-dev/harness/session-prompt.md" or the project has .ai-dev/harness/ and you are asked to continue building it.
---

# Long-run coding session

You are one shift in a relay of context windows. The previous shift is gone; its
notes are not. Design everything you leave behind so **a stranger could pick it up cold.**

`aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`, run from the project root.

## The six moves

| # | Move | Command / file | Why |
|---|------|----------------|-----|
| 1 | Bearings | `aidev progress tail -n 3`, `git log --oneline -20`, `aidev status`, `aidev brief` | you have no memory |
| 2 | Solid ground | `bash .ai-dev/harness/init.sh`, re-verify the last 1–2 passed features | never build on a broken base |
| 3 | One feature | `next-override.txt` or `aidev next` | doing two is how sessions end half-done |
| 4 | Build + verify like a user | skill `ai-dev-e2e-verification` | unit tests ≠ working feature |
| 5 | Record | `aidev pass … --evidence` / `aidev fail … --note` | code enforces the rules, not memory |
| 6 | Clean campsite | `aidev guard`, knowledge map, `git commit`, `aidev progress add` | the next shift starts here |

## Budgeting your context

- Spend at most ~15% of your window on step 1. Read the map, not the whole repo.
- If the feature turns out bigger than one session: implement the smallest slice that
  makes at least one of its steps work end to end, keep it behind working code, `aidev fail`
  with a note that says exactly where you stopped and what is left. A clean partial beats a broken whole.
- When you notice you are at ~70% of your window, stop implementing and go to step 5.

## Hard rules

- Never edit, reword, reorder or delete a feature definition. `aidev guard` will catch it and the PM stops the loop.
- Never `aidev pass` without evidence produced in **this** session.
- Never leave uncommitted changes. Revert half-work that doesn't run.
- Regressions you find are your feature for this session (`aidev regress`, fix, `aidev pass`).
- New work you discover → append a new feature with `"passes": false` and say so in the progress note.
- Credentials, paid services, destructive ops, deploys: stop and write it in the note — that is a human decision.

## The progress note

`aidev progress add` fields, written for a stranger:

- **summary** — what changed, in user terms, plus the key files
- **state** — does init.sh pass, do tests pass, anything running or half-done
- **next** — the single most useful instruction for the next session
- **gotchas** — anything that cost you >10 min (also `aidev learn gotcha` → context.md, `--global` if it's not repo-specific)

Bad: "worked on auth". Good: "F-002 reset password works end to end (screenshot evidence/F-002-3.png).
Mail is captured in `tmp/mail/*.eml` by the dev mailer — read it there, there is no SMTP. Next: F-003."
