Chain long-running-harness sessions until a stop condition — hours of work, one verified feature per session.

Usage:
- `/ai-dev-loop` — up to 5 sessions
- `/ai-dev-loop 20` — up to 20 sessions
- `/ai-dev-loop 20 --until F-080` — stop once F-080 passes
- `/ai-dev-loop 20 --category auth` — only features in a category
- `/ai-dev-loop --model opus`

Read `~/.claude/ai-dev/harness.md` → "Loop". `aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`.

---

## Step 1 — Budget approval (the only question asked)

Run `aidev status`. Show:
```
Loop budget: up to N sessions · model sonnet · stop at: <condition>
Currently: X/Y passing · next F-XXX
I will not ask between sessions. I stop on: guard violation, failed audit, blocked feature,
same feature failing twice, broken init.sh, or budget reached.
Start?
```
Log: `[timestamp] Loop started: budget N.`

## Step 2 — Loop

For i in 1..N:
1. Preconditions from `/ai-dev-session` Step 1 (no confirmation prompt).
2. With `--category`: write the next failing feature of that category into `.ai-dev/harness/next-override.txt`.
3. Spawn the session subagent (foreground — the next session depends on this one's commit).
4. `aidev handoff set --modo "harness loop i/N" --foco <feature> --proximo <next feature>` — so a compaction mid-loop
   resumes the loop instead of restarting it. Run the full post-session audit. One line per session to the user:
   `[i/N] session 14 · F-031 ✅ · 32/120 passing`
5. Check stop conditions. Every 10 sessions or when `aidev map --check` reports ≥ 3 stale paths,
   run one knowledge refresh session (`/ai-dev-knowledge` steps) — it does not count against the budget.

## Step 3 — Final report

```
## Loop finished — <reason>
Sessions: 12 · Features passed: 10 · Regressions found & fixed: 1 · Failed: 1
Passing: 42/120  ██████░░░░░░░░░░░░ 35%
Blocked (need you): F-019 — OAuth needs a real client id
Knowledge map: 3 modules added, 0 stale
Next: F-043 — <description>
```
Log: `[timestamp] Loop finished: reason, sessions, passed, blocked.`
