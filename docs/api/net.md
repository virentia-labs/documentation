# @virentia/net-core API

Declarative remote-data layer. A query/mutation is a `@virentia/core` effect augmented with a `data` store, a `stale` store, and `refresh`/`reset`.

## query

```ts
import { query } from "@virentia/net-core";

const userQuery = query({
  params: (raw: RawInput) => Params,      // optional
  handler: async (params, { signal, scope }) => Data,
  use: [/* operators */],                 // optional
  executor,                               // optional
  key: (params) => unknown,               // optional
  initialData,                            // optional
  trigger,                                // optional
  name,                                   // optional
});
```

Returns an `Effect<Raw, Data, Err>` plus:

- `data: Store<Data | null>` — latest success, per scope.
- `stale: Store<boolean>` — set by `cache()`; `false` otherwise.
- `refresh: EventCallable<void>` — re-run the last params in the scope.
- `reset: EventCallable<void>` — clear `data`, abort in-flight.

See [Query](/net/query).

## mutation

```ts
import { mutation } from "@virentia/net-core";

const addItem = mutation({
  handler: async (params, ctx) => Data,
  optimistic: { update(params, { scope }) {}, rollback(params, { scope }) {} },
  invalidates: [someQuery],
  // + params / use / executor / key / trigger / name, as in query()
});
```

Same shape as `query`. `invalidates` re-runs the target queries (via `refresh`) on success; `optimistic.update` applies on start, `rollback` reverts once on final failure. See [Mutation](/net/mutation).

## trigger

```ts
import { trigger } from "@virentia/net-core";

const stop = trigger(target, {
  on: unit,                 // unit or array of units
  params: (payload) => raw, // optional
  filter: (payload) => boolean, // optional
});
```

Runs `target` when `on` fires. Returns an unsubscribe; auto-registers cleanup inside an owner. See [Triggers](/net/triggers).

## concurrency

```ts
import { concurrency } from "@virentia/net-core";

concurrency({ strategy: "takeLatest", key: (params) => params.id });
```

`strategy`: `"takeLatest"` (default) | `"takeFirst"` | `"takeEvery"` | `"queue"`. `key` splits into independent lanes. See [Operators](/net/operators).

## retry

```ts
import { retry } from "@virentia/net-core";

retry({ times: 3, delay: 300, when: (error, attempt) => boolean });
```

`delay` may be `(attempt, error) => ms` for backoff. Skips and aborts are not retried. See [Operators](/net/operators).

## timeout · debounce · fallback · tap

```ts
import { timeout, debounce, fallback, tap } from "@virentia/net-core";

timeout(5000);                                   // or timeout({ ms })  — TimeoutError on deadline
debounce({ wait: 300 });                          // delay; true debounce with takeLatest
fallback([]);                                     // value | (error, params) => value
tap({ onStart, onSuccess, onError, onSettled });  // observe without changing the result
```

See [Operators](/net/operators).

## overrideDefaults

```ts
import { overrideDefaults, query } from "@virentia/net-core";

const revert = overrideDefaults(
  query,                    // or `mutation`
  { executor, use },        // NetDefaults
  { scope },                // optional — scope the override
);
```

Sets the defaults a factory's queries/mutations inherit — a default `executor` and/or default `use` operators — globally or per scope. Resolved at execution time inside the run's scope. Returns a revert function. See [Defaults](/net/defaults).

## Executors & adapters

```ts
import type { Executor, NetHandler } from "@virentia/net-core";
import { tanstackExecutor } from "@virentia/net-core/tanstack";
import { apolloExecutor } from "@virentia/net-core/apollo";
```

`Executor<Params, Data>` is just a function — `(params, ctx) => Promise<Data>` — the innermost link of the chain. `ctx` carries `signal`, `scope`, and the user's `handler` (if any). By default it calls `ctx.handler`; you rarely write one by hand. `tanstackExecutor(getClient, opts?)` routes the handler through a TanStack `QueryClient`; `apolloExecutor(getClient, { document, variables?, fetchPolicy? })` fetches via Apollo and needs no handler. Both are optional subpath exports. See [Adapters](/net/adapters).

## Skips

```ts
import { isSkip, SkipSignal } from "@virentia/net-core";
import type { SkipReason } from "@virentia/net-core";
```

A run that was intentionally not executed (a superseded `takeLatest` run, a future closed barrier, a cache hit) surfaces a `SkipSignal` instead of a real error. `isSkip(error)` recognizes it; `SkipReason` is `"cache-hit" | "barrier" | "concurrency"`.

## Extension types

```ts
import { NET } from "@virentia/net-core";
import type { NetEffect, NetInternals, Operator, OperatorInitCtx, Handler, RunCtx } from "@virentia/net-core";
```

`Operator` is the middleware contract (`wrapHandler` / `setup`, `stage`). `NetEffect`/`NetInternals` are the query/mutation shape and its private `[NET]` handle, used by `trigger()` and custom operators.
