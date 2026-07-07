# Persistence

`persist` binds one writable store to one [box](/storage/boxes) for one scope and keeps them in sync both ways.

```ts
import { scope, scoped, store } from "@virentia/core";
import { local, persist } from "@virentia/storage-core";

const draft = store("");
const app = scope();

scoped(app, () => {
  persist({ source: draft, key: "draft", storage: local() });
});
```

## Two-way sync

1. **hydrate** — if the box holds `key`, the store is seeded from it; otherwise the box is seeded from the store's current value.
2. **store → box** — every committed change in the bound scope is written out.
3. **box → store** — external changes (another tab, back/forward) are pulled back in, when the box supports `watch`.

A `busy` guard breaks the write↔watch loop: a value that arrived from the box is not written straight back, and a write we caused does not re-enter as an external change.

## Scope

Persistence is inherently **per-scope** — one browser has one `localStorage`, so a binding pairs exactly one scope with the box. The store definition is shared across scopes; the binding decides whose value is persisted.

By default `persist` uses the active scope, so call it inside a `scoped` frame, or pass `scope` explicitly for setup code that has the scope but is not inside a frame:

```ts
persist({ source: draft, key: "draft", storage: local(), scope: app });
```

Calling `persist` with no active scope and no `scope` option throws.

## Custom serialization

`serialize`/`deserialize` cover values a box cannot round-trip on its own — a `Date`, which JSON turns into a string:

```ts
const lastSeen = store(new Date());

persist({
  source: lastSeen,
  key: "lastSeen",
  storage: local(),
  serialize: (date) => date.toISOString(),
  deserialize: (raw) => new Date(raw as string),
});
```

These run on top of the box's own serialization: `serialize` shapes the value before it reaches the box, `deserialize` restores it after `get`.

## Lifetime

`persist` returns a `stop()` disposer that detaches both directions. Called inside an [`owner`](/core/owners), the binding also tears itself down on dispose — so a model created for a modal, tab, or preview stops persisting when that UI goes away:

```ts
import { owner } from "@virentia/core";

const model = owner(() => {
  const draft = store("");
  persist({ source: draft, key: "draft", storage: local(), scope: app });
  return { draft };
});

model.dispose(); // detaches the binding
```

## Query params as state

Bind a store to the URL to make it shareable and survive back/forward:

```ts
import { persist, query } from "@virentia/storage-core";

const search = store("");

scoped(app, () => {
  persist({ source: search, key: "q", storage: query() });
});
```

Navigating back restores the previous value through the box's `popstate` watch. Use `query({ history: "push" })` when each change should be its own history entry.
