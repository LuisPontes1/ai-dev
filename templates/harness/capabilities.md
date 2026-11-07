# Capabilities — tools, MCP servers and skills this project can use

> Written by the initializer (`/ai-dev-harness`), refreshed when tooling changes.
> Sessions read this to know HOW to verify a feature like a user, and which
> specialist knowledge to load. Never store secret values here — names only.

## Verification ladder (use the first that is available)

| `verify` value | Primary tool | Fallback | Evidence to save |
|----------------|--------------|----------|------------------|
| `browser` | Playwright MCP (`browser_navigate`, `browser_click`, `browser_snapshot`, `browser_take_screenshot`) | Node script with `require('playwright')` | screenshot in `.ai-dev/harness/evidence/F-XXX-*.png` |
| `api` | `curl` / HTTP client against the running app from `init.sh` | test runner integration test | request + response log `.ai-dev/harness/evidence/F-XXX.log` |
| `cli` | run the real command as a user would | — | command + output log |
| `unit` | project test runner (only for libraries with no UI/API) | — | test output |
| `manual` | human confirms | — | user's confirmation in progress.md |

Known blind spots: browser-native `alert()`/`confirm()` dialogs are not visible in screenshots — handle them via the dialog API or avoid them.

## MCP servers available

| Server | Status | Used for |
|--------|--------|----------|
| playwright | [installed / missing] | `verify: browser` features |
| [e.g. github] | | issues, PRs |
| [e.g. databricks / postgres] | | data checks |

## Skills to load

| Situation | Skill |
|-----------|-------|
| Every coding session | `ai-dev-long-run-session` + Karpathy guidelines |
| Verifying a feature | `ai-dev-e2e-verification` + `superpowers:verification-before-completion` |
| Smoke test / feature broken | `superpowers:systematic-debugging` |
| `verify: unit` or `api` features | `superpowers:test-driven-development` |
| Writing or amending features | `ai-dev-feature-list` (+ `superpowers:brainstorming` for fuzzy scope) |
| Updating the knowledge map | `ai-dev-knowledge-map` |
| A gotcha repeated in 2+ sessions | `superpowers:writing-skills` → new project skill, add it here |
| [project-specific] | [skill name] |

Superpowers installed: [yes / no — without it, follow the ai-dev equivalent in `~/.claude/ai-dev/skills.md`]

## Personas by category

| Feature category | Persona |
|------------------|---------|
| auth, payments | `security` |
| data, migrations | `database` |
| ui | `frontend` |
