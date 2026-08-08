# Owners and Cleanup

Use `owner` when a model is created at runtime and must later detach the work it created.

This is common for modals, chats, document tabs, media players, timers, and subscriptions to browser APIs. The risk is not the store value itself. The risk is the work around it: reactions, intervals, external listeners, in-flight effects, and cleanup callbacks.

::: tip Owner is the low-level primitive
For a domain entity - something with data, an id, a place in lists - reach
for [models](/models/) instead: `model` and `staticModel` build on the same
lifetime semantics and add collections, JSON parsing and serialization,
relations, queries, and per-instance `onCleanup`. Keep raw `owner` for
non-entity subsystems: sockets, players, caches, background processes. The
comparison lives on [Model kinds](/models/kinds).
:::

## Put Runtime Work Under An Owner

An owner gives dynamic work one lifetime. Anything created inside the owner can be disposed together.

```ts
import { event, onCleanup, owner, reaction, store } from "@virentia/core";

export function createDraftModel() {
  return owner(() => {
    const changed = event<string>();
    const text = store("");

    reaction({
      on: changed,
      run(value) {
        text.value = value;
      },
    });

    return { changed, text };
  });
}
```

`owner` adds `dispose()` to the model root. When the draft is closed, call `dispose`. The reactions created inside the owner are detached with it.

```ts
const draft = createDraftModel();

draft.dispose();
```

If your runtime supports `using` and `Symbol.dispose`, cleanup can be tied to a block:

```ts
{
  using draft = createDraftModel();

  // use draft
}
```

::: warning

`Symbol.dispose` and `using` are not equally available in every JavaScript runtime, including Safari without transpilation. If your runtime, bundler, or transpiler does not support them, use plain `model.dispose()`.

:::

## Nested Owners Go Down With Their Parent

An owner created inside another owner's body is its child. Disposing the parent disposes every child, innermost first — a child's cleanup can still rely on whatever its parent is holding.

```ts
const screen = owner(() => {
  const list = owner(() => {
    reaction({ on: filtersChanged, run: refetch });

    return {};
  });

  return { list };
});

screen.dispose(); // `list` is disposed too — its reaction is detached
```

You can still dispose a child on its own; that does not touch the parent. Every `dispose` is idempotent, so disposing a child by hand and then the parent is safe.

Without the cascade a sub-model would outlive the feature that built it, keeping its reactions subscribed to global stores and its effects in flight.

## Disposal Cancels The Calls A Model Made

Disposing an owner aborts the effect calls **made under it**, not only the calls of effects declared inside it. This matters because effects are usually declared once at module scope and called from many models:

```ts
const loadUserFx = effect(async (id: string) => api.get(id)); // module scope

const screen = owner(() => {
  void loadUserFx("u1"); // the call belongs to this owner

  return {};
});

screen.dispose(); // the request is aborted with Error("Effect caller disposed")
```

Only that owner's own calls are cancelled — a concurrent call of the same effect made by another model keeps running. A call made with no owner current is nobody's, and disposal leaves it alone.

## Register External Cleanup

Use `onCleanup` for work that Virentia cannot know about by itself.

```ts
const timerModel = owner(() => {
  const timer = setInterval(() => {}, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });

  return {};
});
```

Use `withOwner` when a helper needs to attach cleanup to an owner that already exists. It temporarily makes that owner current while the callback runs, so `onCleanup` inside the helper is registered on the model lifetime.

```ts
import { onCleanup, owner, withOwner, type Owner } from "@virentia/core";

const model = owner((dispose, modelOwner) => {
  return { dispose, owner: modelOwner };
});

function connectSocket(modelOwner: Owner) {
  withOwner(modelOwner, () => {
    const socket = new WebSocket("/events");

    onCleanup(() => {
      socket.close();
    });
  });
}

connectSocket(model.owner);
```

This keeps helper code reusable without making it responsible for the whole model lifetime.

Owners are not only about avoiding leaks. They make lifecycle decisions visible: this model is temporary, this work belongs to it, and this is the point where it is allowed to disappear.
