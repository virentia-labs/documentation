# Dependencies

A dependency is a per-scope injectable — an API client, a clock, a logger, a feature-flag reader. It is something the model needs to do its work, but it is **not state**. Each scope provides its own instance: a real client in production, a mock in a test, a stub in a preview.

Unlike a store, a dependency is never serialized or hydrated. Store values are the state you send from server to client and rehydrate; dependencies are wiring, so they live in a separate place and are excluded from that snapshot.

## Defining a dependency

`dependency<T>(name?)` declares one. Like stores and events, it is a stable definition — the concrete instance lives in a scope.

```ts
import { dependency } from "@virentia/core";

interface ApiClient {
  get(id: string): Promise<Item>;
}

const api = dependency<ApiClient>("api");
```

The optional name is used only to make errors and diagnostics readable.

## Providing a dependency

Provide the instance when you create a scope, or imperatively on an existing scope with `provideDependency`.

```ts
import { provideDependency, scope } from "@virentia/core";

// At creation.
const appScope = scope({
  deps: [[api, new RealApiClient()]],
});

// Or later, imperatively.
const testScope = scope();
provideDependency(testScope, api, new FakeApiClient());
```

The same model then runs against a real client in production and a fake one in a test, without the model knowing the difference.

## Reading a dependency

Read it with `.value` inside anything that runs under a scope — an effect handler, a reaction body, or a `scoped(...)` block. This is the common case: an effect that needs the client reads it from the active scope.

```ts
import { effect } from "@virentia/core";

const loadItemFx = effect(async (id: string) => {
  return api.value.get(id);
});
```

Reading a dependency is **not** a reactive dependency — a dependency does not change over a scope's life, so a reaction that reads one does not re-run because of it.

If the active scope never provided the dependency, reading it throws an actionable error naming the dependency (and the chain of units that led to the read, when it happened inside a handler). Provide it via `scope({ deps })` or `provideDependency`.

## Not state, so not serialized

Store values live in the scope's serializable state — an SSR snapshot carries them to the client and rehydrates them. Dependencies live in a separate `deps` map and are deliberately left out of that snapshot: an API client or a logger cannot be serialized and must be re-provided on each side of the boundary.

```ts
// Server: provide the server client, hydrate state as usual.
const serverScope = scope({
  values: [[user, loadedUser]],
  deps: [[api, serverApiClient]],
});

// Client: same model, the client's own instance, hydrated state.
const clientScope = scope({
  values: hydratedValues,
  deps: [[api, browserApiClient]],
});
```

Use a dependency for anything a scope should own but never persist: HTTP clients, sockets, timers/clocks, random sources, loggers, feature flags. Use a `store` for state the scope should remember and be able to serialize.
