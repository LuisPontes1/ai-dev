# Knowledge & Skills

> Session state and knowledge that persist between sessions and survive compaction. Knowledge — in `.ai-dev/` for each project and in the ai-dev repo for all of
> them — loaded into every session automatically, plus the external skills (Superpowers, Karpathy) wired into
> the right moments of ai-dev.

---

## Knowledge: always on, across sessions

Knowledge has no separate store. It is **`.ai-dev/` itself** — the structure ai-dev always had — plus a
**general knowledge** folder inside the ai-dev repo for what applies to every project.

### Where it lives

**Project — `.ai-dev/` (local, gitignored as always)**

| Knowledge | Where | How it gets there |
|-----------|-------|-------------------|
| objective, stack, constraints, credentials (names) | `context.md` | `/ai-dev-init`, PM |
| code map: tree + "Onde procurar" | `context.md → Estrutura do repositório` | `/ai-dev-init`, `/ai-dev-knowledge`, sessions that move code |
| decisions | `context.md → Decisões de arquitetura` | `aidev learn decision` |
| invariants | `context.md → Invariantes` | agents |
| gotchas | `context.md → Gotchas` | `aidev learn gotcha` |
| learnings | `context.md → Aprendizados` | `aidev learn note` |
| inventory (modules, languages, entrypoints, commands) | `discovery/inventory.md` | `aidev map` |
| findings about external systems | `discovery/*.md` | discovery / preflight tasks |
| what each task learned | `reports/delivery-XXX.md → ## Conhecimento` | subagents; PM records it via `aidev learn` |
| why the plan changed | `plan.md → ## Changelog` | PM |
| harness handoff notes | `harness/progress.md` | harness sessions |

`context.md` already said it was "the single source of truth… agents read this before starting any task"; it
now also carries the map, invariants, gotchas and learnings, so that one file is what every session loads.

**General — `<ai-dev repo>/knowledge/` (versioned, every project, every machine)**

| File | Written with |
|------|--------------|
| `learnings.md` | `aidev learn note --global --learning "…" --applies databricks` |
| `gotchas.md` | `aidev learn gotcha --global --symptom "…" --fix "…"` |

`install.sh` points the CLI at this folder of your clone (`~/.claude/ai-dev/knowledge-dir`), so lessons are
written straight into the repo. `aidev sync` commits that folder, pulls with rebase and pushes — the PM asks
before running it. On another machine: `git pull` in ai-dev (or `aidev sync`) and the knowledge is there.

### How it gets used — automatically

```
SessionStart hook  (startup · resume · /clear · after compaction)
   └─ node ~/.claude/ai-dev/harness/aidev.mjs brief --hook
        └─ injects "## ai-dev knowledge brief":
             general knowledge relevant to this project
             · context.md: objective, map, invariants, restrictions, decisions, gotchas, learnings
             · "## Conhecimento" of the last delivery reports · plan status · discovery files
             · harness status + last progress note
```

- In context from the first turn, and **re-injected after compaction** — when long sessions usually forget.
- General learnings are filtered: only rows whose "Aplica-se a" is empty/`all` or names something in this
  project's `context.md` (a Databricks lesson doesn't show up in a React project).
- Never injects `## Credenciais`. Silent when ai-dev is OFF. Works from any subfolder. Capped at ~9k chars.
- Subagents don't get SessionStart hooks → every subagent prompt starts with `aidev brief` + `aidev recall`.
  Copilot can't run commands → the PM inlines the brief into its prompt file.

### How it grows

| Moment | Command |
|--------|---------|
| Lost >10 min to something | `aidev learn gotcha --symptom "…" --cause "…" --fix "…" [--global]` |
| Made a choice a later session could undo | `aidev learn decision --decision "…" --why "…" --rejected "…"` |
| Lesson that applies beyond this repo | `aidev learn note --global --learning "…" --applies <tech>` |
| Moved / added modules | update `context.md → Estrutura` in the same commit, then `aidev map` |
| Task finished | `## Conhecimento` in the delivery report → PM records what's missing |
| Knowledge in the wrong place, or repeated ≥ 2 sessions | `/ai-dev-knowledge --promote` |

`learn` inserts one row into the right table of `context.md` (creating the section in an older context.md),
maps values by column name (old 2-column decision tables still work), drops template placeholder rows, and
ignores exact duplicates. `aidev map --check` reports paths in `context.md` that no longer exist.

### Searching

```
aidev recall login cookie
[context] .ai-dev/context.md:88
| Sintoma | Causa | Correção | Origem |
| login redirect loop | cookie SameSite=None em http | SameSite=Lax em dev | task-007 |
```

Ranked across `context.md`, `discovery/`, `reports/`, `tasks/`, `plan.md`, `session-log.md`,
`harness/progress.md` and the general knowledge.

### Installing the hook by hand

`install.sh` merges this into `~/.claude/settings.json` (backup in `settings.json.bak`; `--no-hook` to skip):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [{ "type": "command", "command": "node \"$HOME/.claude/ai-dev/harness/aidev.mjs\" brief --hook", "timeout": 10 }]
      }
    ]
  }
}
```

---

## Session state & compaction

Knowledge is what the project knows. Session state is where the work **is**. Both live in `.ai-dev/`:

| File | Role | Written by |
|------|------|------------|
| `plan.md` + `tasks/` | what was agreed; each task's status, executor, persona | PM |
| `session-log.md` | append-only history of PM actions (and of compactions) | PM, hooks |
| `persona.md` (optional) | who the assistant **is** in this project: identity, non-negotiables, where the knowledge lives — injected in full at every start, resume, `/clear` and compaction; its non-negotiables go to every subagent | user + PM (template `templates/persona.md`) |
| `handoff.md` → **Estado (PM)** | the present: modo, foco, fazendo, próximo passo, aguardando usuário, persona ativa, decisões, notas | PM via `aidev handoff set` |
| `handoff.md` → **Snapshot automático** | plan + tasks/personas, session-log tail, git, protocols & skills loaded, the user's last messages verbatim | `PreCompact` hook / `aidev checkpoint` |
| `handoff.md` → **Último resumo de compactação** | the summary Claude Code produced, plus what it dropped | `PostCompact` hook |
| `harness/progress.md` | per-session handoff in harness mode | harness sessions |

### The compaction protocol

Compaction replaces the conversation with a summary. Left alone, the summary tends to keep *what was being
coded* and drop *who the assistant is supposed to be*: the PM role, the approval gates, the task persona, the
protocols that were read, and the exact words of the user. ai-dev closes that gap at three points:

```
PreCompact   ──▶ aidev compact pre --hook
                  ├─ snapshot → .ai-dev/handoff.md, entry in session-log.md
                  └─ stdout = instructions for the summarizer: keep ROLE, FOCUS, PERSONA, APPROVALS
                     (never turn a pending question into an approval), USER'S WORDS, DECISIONS, FILES, PROTOCOLS
PostCompact  ──▶ aidev compact post --hook
                  └─ store the summary; check it kept role / focus / persona; record what it lost
SessionStart ──▶ aidev brief --hook   (source = compact)
   (compact)      └─ "⚙️ Restauração": PM role and rules · what the summary lost · protocols to re-read
                     · handoff · active persona (full text) · plan · session log · user's last messages
                     · then the knowledge brief            (all under Claude Code's 10k-char hook cap)
```

`resume` and `clear` get the same restoration; a fresh `startup` gets handoff, plan and log (the full PM rules
come from `~/CLAUDE.md`). `SubagentStart` gives subagents the knowledge brief and tells them they are
subagents, not the PM. All hooks are silent when ai-dev is OFF or there is no `.ai-dev/`, and never block or
fail a compaction.

### What the PM does

- `aidev handoff set` at every milestone: plan approved, task dispatched (`--foco --persona --fazendo`), task
  returned (`--proximo`), question asked (`--aguardando`), direction changed (`--notas`), session ending.
- `aidev checkpoint` before a long operation.
- After "⚙️ Restauração (compact)": trust it over the summary, re-read the listed protocols, keep the persona,
  never treat "Aguardando usuário" as approved.

---

## Skills

### Karpathy guidelines — bundled, always applied

[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) (MIT): four
principles from Andrej Karpathy's observations on LLM coding mistakes.

1. **Think before coding** — state assumptions, surface ambiguity, ask
2. **Simplicity first** — minimum code, nothing speculative
3. **Surgical changes** — every changed line traces to the request
4. **Goal-driven execution** — turn tasks into verifiable goals, loop until verified

Installed at `~/.claude/ai-dev/guidelines/karpathy-guidelines.md`. Every subagent prompt tells the subagent
to follow it, Copilot prompts inline it, and the task template's acceptance criteria use its
"step → verify" form. It's small and stable, so it's vendored (see `THIRD_PARTY_NOTICES.md`).

### Superpowers — optional plugin, routed by moment

[obra/superpowers](https://github.com/obra/superpowers) (MIT, Jesse Vincent): 14 process skills. They're
actively maintained, so ai-dev **installs the plugin instead of copying it** and routes to skills by name:

```bash
bash install.sh --with-superpowers
# or inside Claude Code:
/plugin install superpowers@claude-plugins-official
```

| ai-dev moment | Superpowers skill |
|---------------|-------------------|
| Fuzzy request, before plan or feature list | `brainstorming` (output → `context.md` / spec) |
| Smoke test fails, regression, broken build | `systematic-debugging` |
| `Persona: tdd`, `verify: unit`/`api` features | `test-driven-development` |
| Before `aidev pass` / delivery report | `verification-before-completion` |
| After implementation, before deployment | `requesting-code-review` (or `/ai-dev-review`) |
| Review feedback | `receiving-code-review` |
| Plan or loop finished | `finishing-a-development-branch` |
| Knowledge repeats in ≥ 2 sessions | `writing-skills` → project skill |

**Not used while ai-dev is on** — they duplicate the PM: `writing-plans` (plan of record is `.ai-dev/`),
`executing-plans` (PM never executes inline), `subagent-driven-development` (its "never pause" conflicts with
per-task approval; `/ai-dev-loop` is the continuous mode, with a budget approved up front). Two ideas from it
are adopted: recording judgment calls as decisions (`aidev learn decision`), and a reviewer pass after implementers.

Full routing and precedence: `install/skills.md`. Without Superpowers everything still works — each row has
an ai-dev equivalent.

### ai-dev's own skills

| Skill | Used when |
|-------|-----------|
| `ai-dev-knowledge-map` | load → recall → capture → promote across `.ai-dev/` and general knowledge |
| `ai-dev-long-run-session` | every harness session |
| `ai-dev-feature-list` | initializer / amend |
| `ai-dev-e2e-verification` | verifying a feature like a user (Playwright MCP) |
| `ai-dev-video` | editing long recordings into Shorts and cuts: cohesion and blind-rubric gates, Whisper + review + MMS alignment, animated captions, vertical framing with cosine easing, on-screen panels and density, CTA, LUFS, ffmpeg recipes, Colab/VM rules and fonts folder, visual QA, YouTube publishing — distilled from the Igreja Fonte cuts sessions |
| `ai-dev-storytelling` | writing for people: persona, voice and tone; senior posture instead of "junior" text (judge, tradeoff, calibrated confidence); hooks, structure (ABT, turning point, sparkline, SCQA), papers introduced organically, Akita-style closings; sentence craft in Portuguese; removing the "AI smell"; learns your voice in `knowledge/voz.md` |
