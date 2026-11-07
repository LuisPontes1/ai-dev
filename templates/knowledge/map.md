# Knowledge map

> Curated by agents. Answers "where is X and what must I not break?" in one read.
> Every path is in backticks so `aidev map --check` can detect stale entries.
> Inventory facts (sizes, languages, commands) live in `map.generated.md` — do not duplicate them here.
> Update this file in the same commit as the code change that made it wrong.

## One-paragraph architecture

[How a request/job flows through the system, start to finish.]

## Modules

| Module | Purpose | Key files | Features |
|--------|---------|-----------|----------|
| `src/auth/` | [what it owns] | `src/auth/routes.ts`, `src/auth/session.ts` | F-001, F-002 |

## Where to look

| Question | Answer |
|----------|--------|
| How do I run it? | [command, or `.ai-dev/harness/init.sh` in harness mode] |
| Where are routes defined? | `src/...` |
| Where are the e2e helpers? | `tests/e2e/...` |

## Invariants (break these and something else fails)

- [e.g. every API handler goes through `src/middleware/auth.ts`]

## Data model

[Main entities and where their schema lives.]

## External systems

| System | Accessed from | Credential (name only) |
|--------|---------------|------------------------|
