# interval

A tick event driven by your own start/stop events, with a per-scope "running" flag.

```ts
const { tick, active } = interval({ ms, start, stop, leading });
// tick: Event<void>   active: Store<boolean>
```

## A game or session timer

```ts
import { interval } from "@virentia/core/utils";

const enteredGame = event<void>();
const leftGame = event<void>();

const { tick, active } = interval({ ms: 1000, start: enteredGame, stop: leftGame });

reaction({ on: tick, run: () => { elapsed.value += 1; } });
```

`active` is readable state, not bookkeeping — bind a pause indicator or a pulsing dot straight to it.

## Polling while a screen is open

Tie the lifetime to route events and refresh on every tick:

```ts
const { tick } = interval({ ms: 15_000, start: ordersOpened, stop: ordersClosed, leading: true });

reaction({ on: tick, run: () => void refreshOrdersFx() });
```

`leading: true` fires the first tick immediately on start — the screen loads data right away, then keeps it fresh. Check `refreshOrdersFx.pending.value` in the reaction if the network can be slower than the interval, so refreshes don't stack.

## Autosave every N seconds while editing

```ts
const { tick } = interval({ ms: 30_000, start: editingStarted, stop: editingStopped });

reaction({ on: tick, run: () => void saveDraftFx(draft.value) });
```

For "save after the user pauses" prefer [debounce](/utils/debounce); interval is for "save on the clock, no matter what".

## When to reach for it

- Timers, stopwatches, countdowns visible to the user.
- Polling with a lifetime owned by the model (route opened/closed), not by a component's mount.
- Recurring background work while some mode is on: autosave, presence pings, token refresh.

## Behaviour notes

- **Per scope.** `start` in one scope ticks only that scope; `active` is `true` only there. Two tests never share a timer.
- **`start` while running is a no-op** — it does not reset the phase and cannot double-schedule.
- **Owner dispose stops every scope** and sets `active` back to `false` — no orphan timers after unmount.
- Ticks are new root updates; failures in reactions on `tick` are reported per the [error contract](/core/reactions#when-a-reaction-throws) and do not stop the interval.
