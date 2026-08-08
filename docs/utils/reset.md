# reset

Returns stores to their declaration initials when a clock fires — all targets in one transaction, in the scope the clock fired in.

```ts
reset({ clock, target });
// clock: a unit or an array of units
// target: a writable store or an array of them
```

## Logout

The canonical case — one place that lists everything a signed-out session must not keep:

```ts
import { reset } from "@virentia/core/utils";

reset({ clock: loggedOut, target: [profile, cart, drafts, lastSearch] });
```

The list is the documentation: everything session-bound is reset here, and a code review sees the whole set at once. Because targets reset in the firing scope only, a logout in the app scope does not wipe a running test's scope.

## "New record" and closing dialogs

Clear a form-shaped cluster of stores when the user starts over:

```ts
reset({ clock: [newRecordClicked, dialogClosed], target: [title, body, attachments, validationShown] });
```

Several clocks, one target list — no duplicated cleanup reactions.

## Why not just write initial values by hand?

A hand-rolled cleanup reaction repeats every initial (`title.value = ""`) and silently drifts when a store's declaration changes. `reset` reads the declaration initial itself — the cleanup cannot fall out of sync with the model.

## When to reach for it

- Logout, session switches, "start over" commands.
- Dialogs and wizards whose local stores must be pristine on the next open.
- Tests that reuse a scope and need a known-clean state between steps.

When not: a `computed` target throws at reset time — it has no stored initial (recompute follows its sources anyway). And if only *one* store resets in response to *one* event, a plain reaction is fine; `reset` earns its keep on lists.

## Behaviour notes

- All targets commit in **one transaction**: subscribers and computeds see the fully reset state, never a half-cleared intermediate.
- Per scope: only the firing scope resets.
- Returns the underlying `Reaction` — `stop()` it if the wiring is temporary, or create it under an owner.
