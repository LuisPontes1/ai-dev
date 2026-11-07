Run ONE long-running-harness coding session: one fresh subagent, exactly one feature of verified progress.

Usage:
- `/ai-dev-session` — next feature from `aidev next`
- `/ai-dev-session F-042` — force a specific feature (written into the session note, not the prompt)
- `/ai-dev-session --model opus` — model for the session subagent (default `sonnet`)

Read `~/.claude/ai-dev/harness.md` → "One session" and "Post-session audit". `aidev` = `node ~/.claude/ai-dev/harness/aidev.mjs`.

---

## Step 1 — Preconditions

1. `.ai-dev/harness/features.lock.json` exists (harness approved). If not → "Run `/ai-dev-harness` first."
2. `aidev guard` passes. If not → stop and show the violation; never run a session on a tampered list.
3. `git status --porcelain` is clean. If not → show it and ask (commit, stash, or abort).
4. Session number N = last `## Session` in `progress.md` + 1.
5. Show and confirm (single-session mode only; `/ai-dev-loop` skips this):
   ```
   Session N → F-XXX — <description> (verify: browser · Playwright MCP)
   Passing so far: X/Y. Proceed?
   ```

## Step 2 — Spawn

If a feature was forced, write its id to `.ai-dev/harness/next-override.txt` (the session reads and deletes it —
the prompt itself never changes). Spawn one isolated subagent with the chosen model:

> Read and execute `.ai-dev/harness/session-prompt.md`. You are session N.

Log: `[timestamp] Harness session N spawned (model).`

## Step 3 — Audit (mandatory)

Run every check from `harness.md → Post-session audit` yourself. Then report:

```
Session N — F-XXX ✅ passed  (evidence: .ai-dev/harness/evidence/F-XXX-1.png)
Commit: abc1234 F-XXX: add password reset flow
Guard ✅  Doctor ✅  Passing: X+1/Y  ███████░░░░░░
Notes for next session: <the "Next session should" line>
Next: F-YYY — <description>
```

Failures: show what the audit found, the session's own note, and options (retry, `--model opus`, unblock, edit spec via `/ai-dev-harness --amend`).
