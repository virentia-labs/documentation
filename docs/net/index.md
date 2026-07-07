# Net

`@virentia/net-core` describes remote data as a model: what fetch runs, when it runs, how overlapping runs behave, and how failures recover — all outside the UI.

The one idea to hold on to: **a query is an effect.** It is a real `@virentia/core` effect, so it already carries `pending`, `doneData`, `failData`, `abort`, a per-call `signal`, and per-scope isolation. Net adds two stores — `data` and `stale` — and a small set of composable operators on top.

```sh
pnpm add @virentia/net-core @virentia/core
```

```ts
import { concurrency, query, retry, trigger } from "@virentia/net-core";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
  use: [concurrency({ strategy: "takeLatest" }), retry({ times: 3, delay: 300 })],
});

userQuery.pending; // Store<boolean>
userQuery.data; // Store<User | null>
userQuery.failData; // Event<Error>

trigger(userQuery, { on: userRoute.opened, params: () => ({ id: userRoute.params.value.id }) });
```

## The pieces

- [`query`](/net/query) — a fetch effect plus `data`/`stale` stores and `refresh`/`reset`.
- [`mutation`](/net/mutation) — the write side: the same effect, plus `optimistic` and `invalidates`.
- [`trigger`](/net/triggers) — run a query or mutation when any Virentia unit fires.
- [operators](/net/operators) — `concurrency` and `retry`, composed as `use: []` middleware.
- [adapters](/net/adapters) — back a query with TanStack Query or Apollo without changing its surface.
- [defaults](/net/defaults) — `overrideDefaults` for a shared executor or operators, globally or per scope.

## Where state lives

A query's `data` and `pending` are per-scope, like every Virentia store: read them with `useUnit` in components, or `scoped(scope, () => userQuery.data.value)` in plain code, and drive them in tests with `scoped(scope, () => userQuery(payload))`. Operator state — takeLatest's in-flight run, per-key lanes — is keyed by scope too, so tests and SSR requests never leak into each other.

`cache()` and barriers are planned; everything above ships today.
