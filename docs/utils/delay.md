# delay

Shifts every hit by a fixed time. No collapsing, no rate limiting — each emission arrives `ms` later, order preserved.

```ts
delay(source, ms);
```

Store in — store out, event in — event out.

## Auto-hiding toasts

Show on save, hide three seconds later:

```ts
const saved = event<void>();
const hideToast = delay(saved, 3000);

reaction({ on: saved, run: () => { toastVisible.value = true; } });
reaction({ on: hideToast, run: () => { toastVisible.value = false; } });
```

Two saves in a row → two hide signals, each on its own schedule — the toast from the second save is not cut short by the first one's timer.

## An undo window

Give the user five seconds to change their mind:

```ts
const deleted = event<Item>();
const committed = delay(deleted, 5000);

reaction({ on: deleted, run: (item) => { pendingUndo.value = item; } });
reaction({ on: committed, run: (item) => {
  if (pendingUndo.value?.id === item.id) void purgeFx(item); // undo clears pendingUndo
} });
```

## When to reach for it

- UI that reacts "a moment later": toasts, tooltips with a grace period, staged animations.
- Undo windows and other "commit unless cancelled" flows — pair the delayed event with a check, as above.

When not: repeated ticks are [interval](/utils/interval); "after the burst ends" is [debounce](/utils/debounce). And do not build request timeouts from `delay` — cancellation belongs to the effect's `signal`.

## Behaviour notes

- Every hit is scheduled **independently** — `delay` never merges or drops.
- Timers are per scope; owner dispose cancels everything still pending.
- The delayed emission is a new root update: awaiting the source does not wait for it, and its failures go through the [error funnel](/core/reactions#when-a-reaction-throws).
