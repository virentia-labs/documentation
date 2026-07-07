# Defaults

`overrideDefaults` sets what every query or mutation inherits — a default executor (e.g. an [adapter](/net/adapters)) or default operators — either process-wide or scoped to one scope.

```ts
import { overrideDefaults, query } from "@virentia/net-core";

overrideDefaults(query, {
  executor: tanstackExecutor(() => queryClient),
  use: [retry({ times: 3 })],
});
```

The first argument is the factory (`query` or `mutation`), so each has its own defaults. Two things can be defaulted:

- `executor` — the engine used when a query/mutation doesn't pass its own.
- `use` — operators prepended to every query/mutation's `use`, within their stage.

## Per-scope overrides

Pass `{ scope }` to confine an override to one scope — for tests and SSR requests, which must not leak into each other:

```ts
const testScope = scope();

overrideDefaults(
  query,
  { executor: { run: async (params) => fixtures[params.id] } },
  { scope: testScope },
);
```

This works because defaults are **resolved at execution time, inside the run's scope** — a query defined once picks up whatever defaults its scope provides when it actually runs. Precedence, low to high:

```
built-in  <  global overrideDefaults  <  scoped overrideDefaults  <  the query's own config
```

`executor` is last-wins; `use` accumulates (global, then scoped, then the query's own). A query's explicit `executor`/`use` always win.

## Revert

`overrideDefaults` returns a function that reverts the change. Because resolution reads the registry live, reverting takes effect immediately for later runs.

```ts
const revert = overrideDefaults(query, { executor: fakeExecutor }, { scope: testScope });
// ... run the test ...
revert();
```

## One adapter everywhere

```ts
// app entry — route every query through TanStack
overrideDefaults(query, { executor: tanstackExecutor(() => queryClient) });

// individual queries need no `executor` now
const userQuery = query({ handler: (id) => api.user(id) });
```
