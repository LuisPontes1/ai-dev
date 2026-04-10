# Session Log

> Append-only. Written by the PM — never edit manually.
> Records every significant PM action with timestamp.
> On session start, PM reads only the last 5 entries.

---

| Timestamp | Event |
|-----------|-------|
| YYYY-MM-DD HH:MM | Session opened. Read: context, plan, assignments, graph. |

---

<!--
PM log events (reference):

Session lifecycle:
  Session opened. Read: context, plan, assignments, graph.
  Session closed.

Plan:
  Plan created (draft).
  Plan updated: [change]. Reason: [reason].
  Plan approved by user.
  Plan changelog updated: [summary].

Task execution:
  Spawned subagent task-XXX ([executor] · [model]).
  Subagent task-XXX completed. Status: done.
  Subagent task-XXX failed. Rollback: executed|skipped.
  Task-XXX rolled back.
  User confirmed: proceed to task-XXX.
  User decision after failure: [decision].

Preflight / credentials:
  Preflight task-XXX: passed.
  Preflight task-XXX: failed — [what was missing].
  Credentials check task-XXX: ok|blocked on [credential name].

Plan feedback:
  Plan updated after task-XXX finding: [summary].
  Tasks affected: [task IDs].
-->
