---
name: ai-dev-feature-list
description: How to write and amend .ai-dev/harness/features.json for the ai-dev long-running harness — turning a spec into 20-300 small, user-visible, end-to-end-testable features that all start as passes:false. Use when initializing a harness (/ai-dev-harness), amending a feature list, or reviewing whether a feature is well formed.
---

# Writing the feature list

The feature list is what stops an agent from declaring victory early. It is the
**definition of done**, written before any code, in a format agents are reluctant to rewrite (JSON).

## Shape

```json
{
  "id": "F-014",
  "category": "chat",
  "priority": 2,
  "description": "user can start a new chat from the sidebar",
  "steps": ["open /", "click 'New chat' in the sidebar", "see an empty conversation with the input focused"],
  "verify": "browser",
  "touches": ["web/src/components/Sidebar.tsx", "web/src/routes/chat/"],
  "passes": false
}
```

State fields the sessions own (`aidev` writes them): `passes`, `evidence`, `attempts`, `blocked`, `last_session`, `notes`.
Everything else is the definition, frozen by `aidev freeze` after the user approves.

## Rules for a good feature

1. **User-visible.** Something a user (or API client, or CLI user) does and observes. Not "create the User model".
2. **One behaviour.** If the description needs "and", split it.
3. **Steps are a test script.** Concrete actions and observable outcomes. A stranger could run them.
4. **Session-sized.** Implementable and verifiable in one context window. When in doubt, smaller.
5. **Starts failing.** `passes:false` always — even if the code already seems to exist. Unverified ≠ done.
6. **Honest `verify`.** `browser` for anything with UI, `api` for HTTP services, `cli` for tools, `unit` only for
   pure libraries, `manual` for things only a human can check (real email delivery, payments).
7. **`touches` is a guess** — it drives parallel safety and links features to the knowledge map; it may be wrong.

## Priorities

- **p1** — foundation: app boots, health check, core happy path, auth if everything sits behind it
- **p2** — the main jobs users come for
- **p3** — secondary flows, settings, edge-case UX
- **p4+** — polish, empty states, error messages, accessibility, performance budgets

File order is build order within a priority.

## Coverage checklist for the initializer

For each area of the spec, have you got: happy path · validation errors · empty state · persistence across reload ·
permissions (who can't) · navigation in/out · mobile width (if UI)? Large products land at 150–300 features. That's fine.

## Amending

Only append. To change a frozen feature, the **user** edits it explicitly, the change goes in `plan.md → ## Changelog`, then `aidev freeze`.
