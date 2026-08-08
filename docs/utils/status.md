# status

One store with the effect's lifecycle state, ready for a component: `"initial" | "pending" | "done" | "fail"`.

```ts
status(fx);
status(fx, { reset });
```

## A submit button

The four states of every form, without hand-wiring three reactions:

```ts
import { status } from "@virentia/core/utils";

const saveStatus = status(saveFx);
```

```tsx
// in the view (React example)
const s = useUnit(saveStatus);
return (
  <button disabled={s === "pending"}>
    {s === "pending" ? "Saving…" : s === "fail" ? "Retry" : "Save"}
  </button>
);
```

## "No error before the first attempt"

The `"initial"` state is the point. `fail` alone cannot distinguish "never tried" from "tried and cleared" — `status` can:

```ts
const showError = computed(() => saveStatus.value === "fail");
const showHint = computed(() => saveStatus.value === "initial"); // pristine form, no red borders
```

## New entity, clean history

When the same effect serves different entities, the previous attempt's outcome must not leak onto a freshly opened one:

```ts
const saveStatus = status(saveFx, { reset: recordOpened });
```

Opening a record returns the machine to `"initial"` in that scope — the error from the last record does not greet the new one.

## When to reach for it

- Submit/save/load buttons and any UI that renders all four lifecycle states.
- Pristine-form logic that needs `"initial"` as a real state.
- Success screens: `status === "done"` right after the effect settles.

When not: if all you need is an "is it running" flag, the effect already has it — `fx.pending`.

## Behaviour notes

- Per scope, like everything: a test's `"fail"` never shows in the app.
- **Last lifecycle event wins.** With overlapping calls, an early success reads `"done"` while a later call still runs — when that distinction matters, render `status` together with the effect's own `pending`.
- `reset` accepts any unit — an event, a store change, another effect's `done`.
