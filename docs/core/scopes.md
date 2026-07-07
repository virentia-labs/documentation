# Scopes

A scope is one running state instance.

The model describes stores, events, effects, and reactions. The scope holds the concrete store values. That lets one model run in an app, a test, an SSR request, a widget, or a cached background screen at the same time.

## Scope For Store Access

When code reads `count.value`, the store has to know which copy of `count` you mean. Direct reads and writes therefore need a scope in the current execution context.

```ts
scoped(appScope, () => {
  count.value += 1;
});
```

`scoped(scope, fn)` opens a scope, runs the function, and restores the previous scope when the function finishes. If the function returns a promise, the same scope is kept for that promise chain until it settles.

## When A Scope Is Missing

Reading or writing a store, or calling an event or effect, with no scope in the current context throws a `Scope is required` error. The message names the unit that needed a scope and lists the ways to provide one:

```text
Scope is required to call event "submitted", but no scope is active.
```

When the failing call happens inside a running handler — a reaction that lost its scope, for example — the error also prints the chain of units that led to it:

```text
Unit path that led here: reaction "applyCheckout" → effect "chargeFx" → event "submitted".
```

Use the path to find where the scope was dropped. The usual cause is a raw `await` — a bare `fetch` or timer — between two units inside a reaction body. Wrap that work in an `effect`, which preserves the scope across its `await`.

## One Tool For Runs And Callbacks

You can use `scoped` immediately:

```ts
await scoped(appScope, async () => {
  const response = await fetch("/api/count");
  count.value = (await response.json()).count;
});
```

You can also create a runner and reuse it where code would otherwise start to sprawl:

```ts
const inAppScope = scoped(appScope);

await inAppScope(async () => {
  count.value += 1;
});

const onMessage = inAppScope.wrap((message: string) => {
  messages.items = [...messages.items, message];
});

socket.on("message", onMessage);
```

The same object handles both jobs: run work now, or keep a callback that will return to the same scope later.

If the code already runs inside a scope, you can omit the scope argument — `scoped()` captures the scope it is currently running in. This is the idiomatic way to keep a callback bound to the current scope (a timer, a listener, a socket) without naming the scope by hand:

```ts
scoped(appScope, () => {
  // `scoped()` picks up the active scope.
  scoped(() => {
    count.value += 1;
  });

  // Capture the current scope for a later callback.
  const onMessage = scoped().wrap((message: string) => {
    messages.items = [...messages.items, message];
  });
  socket.on("message", onMessage);
});
```

When a callback ends up with no scope — because it was handed to a timer, listener, socket, or a raw `await` — that is [scope loss](/core/scope-loss). Wrapping it with `scoped()` is the fix.

## Seeding Scope Values

A fresh scope starts each store at its initial value. To start a scope with specific values — common in tests, SSR hydration, or previews — pass them when you create the scope:

```ts
const appScope = scope({
  values: [
    [count, 10],
    [query, "docs"],
  ],
});
```

To set a value on an existing scope imperatively, use `seedScopeStoreValue`. Only writable stores can be seeded; derived and read-only stores throw.

```ts
seedScopeStoreValue(appScope, count, 10);
```

## Reading The Current Scope

`getCurrentScope()` returns the scope active in the current execution context, or `null` when no scope is open. Reach for it only when you genuinely need the scope object itself. To capture the current scope and reopen it in a later callback, prefer `scoped()` — it captures the active scope for you, so you never pass the scope around by hand.

```ts
const current = getCurrentScope();
```

## Starting Units At Boundaries

`scoped` is convenient for plain code. It is also the tool for starting a unit at a system boundary — from a test, server loader, command, or framework adapter: wrap the call and `await` the returned promise.

```ts
await scoped(appScope, () => incremented(1));
```

`scoped` shows which scope owns the state, and the callback shows which unit starts and which payload enters the graph. Its promise also waits for async work raised by that run.

## Scope Rules

The scope lives in the current execution context, so the one thing to get right is **not losing it across `await`**. The rules:

1. **Reads and writes need a scope.** `store.value`, `event()`, `effect()`, and `dependency.value` all resolve against the active scope. With none active they throw `Scope is required`.
2. **A scope is active inside** a `scoped(scope, …)` block, an effect handler, and a reaction body — and any synchronous code they call. A unit runs in the scope its source fired in.
3. **Awaiting a unit keeps the scope.** After `await someFx()` or `await someEvent()`, the continuation runs in the same scope, so you can read stores right after. Effects and events restore the scope that was active when they were called.
4. **A raw `await` drops the scope.** `await fetch()`, `await delay()`, `await anyPromise()` — the continuation has no scope, and the next store read throws. Wrap external async in an `effect` so the scope survives the boundary.
5. **At system boundaries, name the scope.** From a test, loader, command, or callback handed to another library, use `scoped(scope, fn)` or `scoped(scope).wrap(cb)` instead of relying on an ambient scope.

Rule of thumb: inside a reaction or effect, only ever `await` **units** — `await someFx()`, `await someEvent()`, `await scoped(...)`. The moment you `await` a bare promise, you have left the scope; move that work into an `effect`.

For the concrete ways a scope goes missing — timers, listeners, sockets, raw awaits — and how to fix each, see [Scope loss](/core/scope-loss).
