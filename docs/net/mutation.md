# Mutation

`mutation(config)` is the write side. It is the same effect-with-operators as a [query](/net/query) — `handler`, `params`, `use`, `executor`, and `trigger` work identically — with two write-specific additions: **optimistic updates** and **invalidation**.

```ts
import { mutation } from "@virentia/net-core";

const renameUser = mutation({
  handler: async (name: string) => api.rename(name),
});
```

Call it to run; read `renameUser.pending` and `renameUser.failData` exactly like a query.

## Invalidation

`invalidates` re-runs the given queries on success through their `refresh`, so they reload with the last params seen in the scope:

```ts
const addTodo = mutation({
  handler: async (text: string) => api.add(text),
  invalidates: [todosQuery],
});

await scoped(app, () => addTodo("buy milk"));
// todosQuery has re-run with its last params
```

Pass a single query or an array.

## Optimistic updates

`optimistic.update` applies the moment the mutation starts; `optimistic.rollback` reverts it once if the mutation ultimately fails. Both run inside the mutation's scope, so you write stores directly:

```ts
const items = store<string[]>([]);

const addItem = mutation({
  handler: async (name: string) => api.add(name),
  optimistic: {
    update: (name) => (items.value = [...items.value, name]),
    rollback: (name) => (items.value = items.value.filter((i) => i !== name)),
  },
});
```

Because `optimistic` wraps *outside* `retry`, the update applies once and the rollback fires once — after all attempts, not per attempt.

## Notes

- Overlapping submits are uncoordinated by default; add `concurrency` in `use` for serialization or dedup — see [operators](/net/operators).
- A mutation exposes the same `data` store (the last result) and `reset`. There is no `cache()` — writes are not cached.
