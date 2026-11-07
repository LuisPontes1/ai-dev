# AI-Dev — Skills Routing

> Loaded by the PM when planning, before dispatching a subagent, or when the user asks which skills apply.
> Three sources: **ai-dev** skills (installed), **Karpathy** guidelines (bundled), **Superpowers** (optional plugin,
> `install.sh --with-superpowers` or `/plugin install superpowers@claude-plugins-official`).
> If a Superpowers skill is not installed, follow the ai-dev equivalent listed — never block on a missing skill.

---

## Precedence

1. The user's direct instructions
2. ai-dev core (`~/CLAUDE.md`) and protocols — approval gates, files as context, one task/feature at a time
3. Skills (ai-dev, Superpowers) — *how* to do a step well
4. Karpathy guidelines — baseline discipline under everything

Superpowers states the same rule itself ("user instructions take precedence over skills"). When a skill's
workflow contradicts an ai-dev gate, the gate wins.

---

## Routing table

| ai-dev moment | Use | Notes |
|---------------|-----|-------|
| User describes something new, scope is fuzzy | `superpowers:brainstorming` | Design conversation only. Write the result into `.ai-dev/context.md` (or the spec file for `/ai-dev-harness`), **not** `docs/superpowers/`. Skip when the request is already precise. |
| Turning the design into work | ai-dev `planning.md` (tasks) or `ai-dev-feature-list` (harness) | Borrow from `superpowers:writing-plans`: every step ends in a concrete verification. |
| Any subagent writing code | Karpathy guidelines (always, injected) | Think before coding · simplicity · surgical changes · goal-driven verification. |
| Task with `Persona: tdd`, or feature `verify: unit`/`api` | `superpowers:test-driven-development` | Red → green → refactor; the failing test is the first evidence. |
| Smoke test fails, a feature regresses, a test or build breaks | `superpowers:systematic-debugging` | Root cause before fix. Record the cause with `aidev learn gotcha`. |
| About to say "done", `aidev pass`, write a delivery report | `superpowers:verification-before-completion` + `ai-dev-e2e-verification` | Evidence from *this* session, run fresh. |
| After an implementation task / before a deployment | `/ai-dev-review` (Copilot) or `superpowers:requesting-code-review` | Review against the task's acceptance criteria. |
| Review feedback arrives | `superpowers:receiving-code-review` | Verify each point technically; no performative agreement. |
| Parallel batch | ai-dev `execution.md → Parallel` | `superpowers:using-git-worktrees` / `dispatching-parallel-agents` for mechanics only. |
| Plan or loop finished | `superpowers:finishing-a-development-branch` | Present merge / PR / keep options — the user chooses. |
| A gotcha or procedure repeats in ≥ 2 sessions | `superpowers:writing-skills` (or `skill-creator`) | Promote knowledge into a project skill in `.claude/skills/`; list it in `capabilities.md`. |
| Long builds, one feature per session | `ai-dev-long-run-session`, `ai-dev-feature-list`, `ai-dev-e2e-verification` | Harness mode. |
| Map / decisions / gotchas | `ai-dev-knowledge-map` | Every mode. |

---

## Do not use while ai-dev is ON and `.ai-dev/` exists

| Superpowers skill | Why | Use instead |
|-------------------|-----|-------------|
| `writing-plans` | Writes plans to its own folder; the plan of record is `.ai-dev/plan.md` / `features.json` | `planning.md`, `/ai-dev-harness` |
| `executing-plans` | Executes inline in the PM's context — the PM never executes | `/ai-dev-exec` |
| `subagent-driven-development` | Its "never pause between tasks" conflicts with per-task confirmation | `/ai-dev-exec`; for continuous runs `/ai-dev-loop` (budget approved up front) |

Ideas worth keeping from `subagent-driven-development`: a separate **reviewer** after each implementer
(spec compliance, then code quality), and recording judgment calls as
`Ruling: <decision> — <why> — <cost if wrong>` → in ai-dev these go to `aidev learn decision`.

---

## Injecting skills into subagents

Subagents may not see the PM's skill list. In every subagent prompt file, add a `## Skills` block naming
the skills that apply to *this* task (from the table above) with a one-line reason, e.g.:

```
## Skills
- superpowers:test-driven-development — Persona tdd
- superpowers:verification-before-completion — before writing the delivery report
```

For **Copilot** (cannot load skills): inline `~/.claude/ai-dev/guidelines/karpathy-guidelines.md` and a
3–5 line summary of the relevant skill's rule (e.g. "Root cause before fix: reproduce, read the full
error, form one hypothesis, test it").
