# Task Dependency Graph

> Defines which tasks must complete before others can start.
> Claude Code checks this before starting any task.
> Update this file whenever tasks are added, reordered, or removed.

Last updated: YYYY-MM-DD

---

## DAG (visual)

```
task-001
└── task-002
    ├── task-003
    └── task-004
        └── task-005
```

*Tasks at the same indentation level with no arrow between them can run in parallel (if authorized).*

---

## Dependency table

| Task | Requer (must be done first) | Bloqueia (cannot start until this is done) |
|------|-----------------------------|--------------------------------------------|
| task-001 | — | task-002 |
| task-002 | task-001 | task-003, task-004 |
| task-003 | task-002 | — |
| task-004 | task-002 | task-005 |
| task-005 | task-004 | — |

---

## Rules

1. A task can only start when **all** tasks in its `Requer` column have status `done`
2. Circular dependencies are not allowed — Claude Code will refuse to start if detected
3. When a task completes, Claude Code will identify and report which tasks are newly unblocked
4. To run tasks in parallel: both must have no dependency on each other AND user must explicitly authorize it

---

## Notes

[Optional: reasoning behind specific ordering decisions, known bottlenecks, etc.]
