# Utils

`@virentia/core/utils` is a set of ready-made operators for patterns every app hits sooner or later: a noisy input, a banner that must show once, a "back to initial" on logout, an effect status for a button. It ships with core — nothing to install:

```ts
import { debounce, once, reset, status } from "@virentia/core/utils";
```

Two guarantees hold for every operator — and they are the reason to use them instead of writing the same five lines by hand:

- **State is per scope.** Timers, flags, and memory are keyed by the scope an update fired in. An SSR request, a test, and the app never share a debounce window or a "shown once" flag. A hand-rolled version with a module-level `let` shares them across everything — that bug ships silently.
- **Cleanup follows the owner.** An operator created inside an [owner](/core/owners) dies with it: pending timers cancelled, subscriptions detached, nothing fires after teardown.

## The operators

Time — these preserve the kind of the source (an event in, an event out; a store in, a store out with the last settled value):

- [debounce](/utils/debounce) — wait for a pause: search inputs, autosave.
- [throttle](/utils/throttle) — steady rate, last value never lost: scroll, drag, live metrics.
- [delay](/utils/delay) — shift every hit by a fixed time: toasts, undo windows.
- [interval](/utils/interval) — tick between `start` and `stop`: timers, polling.

Memory:

- [once](/utils/once) — pass the first hit per scope: onboarding, first-use analytics.
- [previous](/utils/previous) — the value one change ago: "where did we come from", animation direction.

Writes:

- [reset](/utils/reset) — return stores to their declaration initials: logout, "new record".

Effect state for the UI:

- [status](/utils/status) — `"initial" | "pending" | "done" | "fail"` per effect: submit buttons.

The dry signatures live in the [API reference](/api/core#virentia-core-utils).
