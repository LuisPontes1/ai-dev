# Coding session — identical in every session

You are one shift in a long relay. You remember nothing from earlier sessions;
everything you need is in files. Your job: **exactly one feature of verified
progress, then clean notes for the next session.**

`aidev` below means `node ~/.claude/ai-dev/harness/aidev.mjs` (run from the project root).
Load the skill `ai-dev-long-run-session` if it is available — it expands each step.

## 1. Get your bearings (read, don't change anything yet)

1. `pwd` — you may only edit files inside this directory.
2. `aidev progress tail -n 3` and `git log --oneline -20`.
3. `aidev status` — how many features pass, what is blocked.
4. Read `.ai-dev/knowledge/map.md` and `.ai-dev/knowledge/gotchas.md`.
5. Read `.ai-dev/harness/capabilities.md` — it says how to test like a user here.

## 2. Make sure the ground is solid

1. `bash .ai-dev/harness/init.sh` — starts the app and runs the smoke test.
2. Re-verify the 1–2 most recently passed features (from progress.md) the way a user would.
3. If anything is broken: **fixing it is this session's feature.** Use
   `aidev regress <id> --note "<what broke>"` for features that no longer work,
   fix them, verify, then skip to step 5. Do not start new work on a broken base.

## 3. Pick exactly one feature

If `.ai-dev/harness/next-override.txt` exists, take that feature id and delete the file.
Otherwise `aidev next` — take that feature, unless the progress log says the previous
session left it half-done (then finish that one). One feature. Not two.

## 4. Implement, then test it end to end like a user

1. Read the feature's `steps`, `verify` and `touches`. Read the files the knowledge map points to.
2. Implement the smallest change that makes every step work.
3. Verify with the tool `capabilities.md` assigns to the feature's `verify` value
   (browser → Playwright MCP or a Playwright script, with screenshots). Unit tests
   and `curl` alone do not count for `browser` features.
4. Save evidence under `.ai-dev/harness/evidence/` (screenshot, log, output).
5. Run the project's existing tests. Nothing that passed before may fail now.

## 5. Record the result — through `aidev`, never by hand-editing features.json

- Works end to end → `aidev pass <id> --evidence <path> --session <N>`
- Doesn't, and you're out of ideas or context → `aidev fail <id> --note "<what you tried, what failed>" --session <N>`
  and `git stash`/revert any half-finished change so the tree is clean.

**Never edit, reword, reorder or delete a feature or its steps to make it pass.**
If a feature is wrong or impossible, say so in the progress note — the human decides.
If you discover missing work, you may append a new feature with `"passes": false`.

## 6. Leave the campsite clean

1. `aidev guard` must print OK.
2. Update the knowledge map if you changed where things live:
   `.ai-dev/knowledge/map.md` (curated), `aidev map` (inventory), and
   append to `decisions.md` / `gotchas.md` if you made a decision or lost >10 min to something.
3. `git add -A && git commit -m "<feature id>: <what changed>"` — descriptive, one feature per commit.
4. `aidev progress add --session <N> --feature <id> --result <passed|failed|fixed-env> --commit <sha> --summary "..." --state "..." --next "..." [--gotchas "..."]`
5. Commit the harness notes too if `.ai-dev/harness` is tracked.

Stop after step 6. The next session will pick up from your notes.
