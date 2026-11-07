---
name: ai-dev-e2e-verification
description: Verify a feature end to end like a real user before marking it as passing in the ai-dev harness — Playwright MCP browser automation with screenshots, a Playwright script fallback, API and CLI checks, and how to save evidence for aidev pass. Use whenever a feature from .ai-dev/harness/features.json is implemented and needs verification, or when re-verifying features after init.sh.
---

# End-to-end verification

The most common way long-running agents fail is marking work done after unit tests or a
`curl`. Users don't run unit tests. **Run the feature's `steps` the way a user would, and keep proof.**

Evidence goes in `.ai-dev/harness/evidence/` named `F-XXX-<n>.<ext>`. That path is what you pass to
`aidev pass F-XXX --evidence <path>`.

## verify: browser

### Preferred — Playwright MCP

If tools named like `browser_navigate` / `browser_click` / `browser_snapshot` are available:

1. `browser_navigate` to the `APP_URL` printed by `init.sh`
2. For each step: act (`browser_click`, `browser_type`, `browser_select_option`), then `browser_snapshot` and
   check the expected outcome is in the accessibility tree — not just "no error"
3. `browser_take_screenshot` at the final state → save under `evidence/`
4. Check `browser_console_messages` for errors; a passing flow with console errors is a note, not a pass

### Fallback — Playwright script

```js
// .ai-dev/harness/evidence/F-XXX.check.mjs — run with: node <file>
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(process.env.APP_URL ?? "http://localhost:3000");
await p.getByRole("link", { name: "Sign up" }).click();
await p.getByLabel("Email").fill(`u${Date.now()}@test.dev`);
await p.getByRole("button", { name: "Create account" }).click();
await p.getByText("Dashboard").waitFor();
await p.screenshot({ path: ".ai-dev/harness/evidence/F-XXX-1.png", fullPage: true });
await b.close();
if (errors.length) { console.error(errors); process.exit(1); }
```

Keep the script — it becomes a regression check the next session can rerun in seconds.

### Blind spots

- Native `alert`/`confirm`/`prompt` dialogs don't show in screenshots: handle with `page.on("dialog")` / MCP dialog tools.
- Look at the screenshot. A blank page with a 200 status is a failure.
- Animations/async: wait for the observable outcome, never fixed sleeps.

## verify: api

Hit the running app (not a mocked handler): request + status + body assertions, saved as a log:
`curl -sS -i -X POST "$APP_URL/api/x" -d '…' | tee .ai-dev/harness/evidence/F-XXX.log`.
Include the negative case if the steps include one (401, 422…).

## verify: cli

Run the real command from a clean shell as documented; save command + output. Check exit code.

## verify: unit / manual

`unit` — only for pure libraries; save the test runner output for the specific tests.
`manual` — write what the human must check in the progress note, `aidev fail` with note "awaiting human verification"; the PM asks the user.

## Before `aidev pass`

- [ ] every step in `steps` was performed, in order, against the running app
- [ ] the expected outcome was observed, not inferred
- [ ] evidence file exists and shows the final state
- [ ] existing test suite still passes
