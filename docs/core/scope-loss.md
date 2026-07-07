# Scope loss

A scope lives in the current execution context. Synchronous code inside a `scoped(...)` block, an effect handler, or a reaction body all run with a scope in context. **Scope loss** is when work that should belong to a scope runs with no scope in context — because control passed through an asynchronous boundary the scope did not survive.

Unlike some libraries, Virentia does not silently fall back to a global scope. A read or a call with no scope **throws** `Scope is required`, so scope loss usually fails loudly and points at the offending unit. That is a feature: you find out at the boundary, not three screens later through a piece of state that never updated.

## What it looks like

The typical symptom is a `Scope is required` error raised from a store read, or from calling an event or effect, inside a callback that ran later:

```text
Scope is required to call event "tick", but no scope is active.
Unit path that led here: … → call event "tick".
```

A timer model shows it clearly. This looks correct but throws once per tick:

```ts
function createTimerModel() {
  const tick = event<void>();
  const seconds = store(0);

  reaction({ on: tick, run() { seconds.value += 1; } });

  // ❌ setInterval calls this later, outside any scope — `tick()` throws.
  setInterval(() => tick(), 1000);

  return { seconds, tick };
}
```

The interval fires after the synchronous setup returned, so there is no scope in context when `tick()` runs.

## Where it happens

Scope is lost at any boundary where control leaves your scoped execution and comes back later — usually through a callback some other system owns:

- `setTimeout` / `setInterval`
- `addEventListener` and other DOM/event-emitter callbacks
- WebSocket / socket handlers (`socket.on(...)`)
- `.then(...)` / a raw `await fetch()` / any bare promise
- third-party async APIs that call you back

The common thread: **the scope is a contextual value set during synchronous execution; a raw `await` or an externally-invoked callback resumes with that context gone.** This is JavaScript's asynchronicity, not a quirk of Virentia — the same reason `this` or an AsyncLocalStorage value would be gone.

## Fixing it

### Sequential async in a rule → use effects

Awaiting a **unit** keeps the scope: after `await someFx()` or `await someEvent()` the continuation still runs in the same scope. So wrap external async in an `effect` instead of awaiting a bare promise.

```ts
// ❌ raw await drops the scope
reaction({
  on: submitted,
  async run() {
    const res = await fetch("/api/save");   // scope lost here
    saved.value = await res.json();          // throws: Scope is required
  },
});

// ✅ the effect owns the request; awaiting the effect keeps the scope
const saveFx = effect(async () => (await fetch("/api/save")).json());

reaction({
  on: submitted,
  async run() {
    saved.value = await saveFx();            // still in scope after the await
  },
});
```

This is the answer for almost all async in a model: **inside a reaction or effect, only ever `await` units** (`someFx()`, `someEvent()`, `scoped(...)`), never a bare promise.

### External callbacks → `scoped(scope).wrap`

When another system calls you back later — a timer, an event listener, a socket — capture the scope and reopen it for that callback with `scoped().wrap(fn)`. Called with no scope argument, `scoped()` captures the scope it is *currently running in* and returns a runner bound to it; `.wrap` then reruns your callback in that scope whenever it is eventually invoked. You never name the scope by hand.

```ts
import { scoped } from "@virentia/core";

reaction({
  on: started,
  run() {
    // `scoped()` captures the scope this reaction is running in.
    const inScope = scoped();

    const id = setInterval(inScope.wrap(() => tick()), 1000);
    onCleanup(() => clearInterval(id));
  },
});
```

The same pattern covers listeners and sockets:

```ts
const inScope = scoped();
socket.on("message", inScope.wrap((msg) => messageReceived(msg)));
window.addEventListener("resize", inScope.wrap(() => resized()));
```

Create these inside an [`owner`](/core/owners) and register `onCleanup` so the timer/listener is torn down with the model.

### Boundaries → name the scope

When you start a unit from a test, a server loader, or a framework adapter, do not rely on an ambient scope — pass it:

```ts
await scoped(appScope, () => submitted(form));
scoped(appScope, () => count.value++);
```

## Checklist

- Inside a reaction/effect, `await` **only** units. A bare `await fetch()`/`await delay()` means you have left the scope — move it into an `effect`.
- Any callback handed to a timer, listener, socket, or third-party API must be wrapped: `scoped().wrap(cb)`.
- Build the wrapper with `scoped()` while the scope is still active (a reaction body, an effect handler) — it captures the current scope for you — not later inside the callback.
- Tear down timers/listeners with `onCleanup` in an `owner`.
- At system boundaries pass the scope explicitly via `scoped`.

See also [Scope Rules](/core/scopes#scope-rules) for the short version.
