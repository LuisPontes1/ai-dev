Initialize the .ai-dev/ planning system in the current directory.

## Step 1 — Detect project type

Read the following files if they exist:
- `README.md`
- `CLAUDE.md` (project-level, if any)
- `pyproject.toml` or `setup.py` or `package.json`
- `databricks.yml`
- `.gitignore` or `.databricksignore`

Based on what you find, identify the project type:

| Signal | Type |
|--------|------|
| `databricks.yml` exists OR `databricks` in README | `databricks-bundle` |
| `pyproject.toml` / `setup.py` / Python package structure | `python-package` |
| ETL/pipeline language in README (dbt, Airflow, Spark, ingestão) | `data-pipeline` |
| None of the above | `generic` |

## Step 2 — Create .ai-dev/ structure

Create the following files. For `context.md`, use the matching starter template if the project type is known. Starters are at `~/.claude/ai-dev/templates/starters/` (installed by `install.sh`). For `generic`, use `~/.claude/ai-dev/templates/context.md`.

**`.ai-dev/context.md`**
Use the starter for the detected project type. Fill in what you can infer from the project files. Mark everything uncertain with `[TODO]`.

**`.ai-dev/plan.md`**
`Status: draft`. Empty task table. Changelog with one entry: "Plano criado".

**`.ai-dev/tasks/_template.md`**
Copy from `~/.claude/ai-dev/templates/tasks/_template.md`.

**`.ai-dev/agents/assignments.md`**
Copy from `~/.claude/ai-dev/templates/agents/assignments.md` (clear the example row, keep headers).

**`.ai-dev/agents/roles.md`**
Copy from `~/.claude/ai-dev/templates/agents/roles.md`.

**`.ai-dev/dependencies/graph.md`**
Copy from `~/.claude/ai-dev/templates/dependencies/graph.md` (clear the example DAG, keep headers).

**`.ai-dev/discovery/.gitkeep`**
Empty file — preserves directory for discovery and deployment task outputs.

**`.ai-dev/reports/.gitkeep`**
Empty file — preserves directory for delivery reports.

**`.ai-dev/session-log.md`**
Copy the session-log template. Write the first entry:
`[current date HH:MM] .ai-dev/ initialized by /ai-dev-init.`

## Step 3 — Update ignore file

- If `.gitignore` exists: append `.ai-dev/`
- If `.databricksignore` exists: append `.ai-dev/` there too
- If neither exists: create `.gitignore` with `.ai-dev/`

## Step 4 — Report to user

Show:
1. Project type detected and starter used
2. List of files created
3. Sections of `context.md` that need manual review (all `[TODO]` markers)
4. "Execution is blocked until `plan.md` Status is changed to `approved`"
5. Next step suggestion: "Review `.ai-dev/context.md` — especially the `[TODO]` sections — then describe what you want to build and I'll draft the tasks."

## What NOT to do

- Do NOT set plan.md status to approved
- Do NOT create task files
- Do NOT execute any code or make project changes
- Do NOT read files outside the project root
- Do NOT ask for confirmation — just initialize and report
