# Query

`query(config)` builds a fetch effect. The result is a `@virentia/core` effect — you have its full lifecycle — with a `data` store, a `stale` store, and `refresh`/`reset` added.

```ts
import { query } from "@virentia/net-core";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
});
```

## Config

| Field | Meaning |
|-------|---------|
| `handler(params, ctx)` | the async fetcher; `ctx` is `{ signal, scope }`. Pass `ctx.signal` to `fetch` for cancellation. |
| `params?(raw)` | maps the call/trigger input into handler params. Omit to pass the input through unchanged. |
| `use?` | ordered [operators](/net/operators) (`concurrency`, `retry`, …). |
| `executor?` | swaps the execution engine — see [adapters](/net/adapters). Defaults to running `handler`. |
| `key?(params)` | lane key shared by operators (e.g. per-id concurrency). |
| `initialData?` | seed for `data` (default `null`). |
| `trigger?` | inline [trigger](/net/triggers) binding(s). |
| `name?` | devtools name. |

`params` separates the call shape from the handler shape — the query is called with the raw input, the handler receives the mapped value:

```ts
const userQuery = query({
  params: (raw: { userId: string }) => ({ id: raw.userId }),
  handler: async ({ id }: { id: string }) => fetchUser(id),
});

userQuery({ userId: "7" }); // handler sees { id: "7" }
```

## Units

You run a query by calling it, and observe it through effect units — plus the ones net adds:

```ts
userQuery({ id: "42" }); // run it in a scope

userQuery.pending; // Store<boolean>       — loading
userQuery.doneData; // Event<Data>          — each success
userQuery.failData; // Event<Error>         — each failure
userQuery.abort(); // cancel in-flight runs in this scope

userQuery.data; // Store<Data | null>   — latest success (per scope)
userQuery.stale; // Store<boolean>       — set by cache(); false without it
userQuery.refresh; // EventCallable<void>  — re-run the last params in this scope
userQuery.reset; // EventCallable<void>  — clear data, abort in-flight
```

## Reading and driving

A query is per-scope, like any model. In components read units with `useUnit`; outside, read through a scope and drive with `scoped`:

```ts
import { scope, scoped } from "@virentia/core";

const app = scope();

await scoped(app, () => userQuery({ id: "42" }));
scoped(app, () => userQuery.data.value); // the loaded User
```

Separate scopes keep independent `data`/`pending`, so one definition serves an app, a test, and an SSR request without sharing state. `refresh` re-runs the last params seen **in that scope**; if the query never ran there, it does nothing.
