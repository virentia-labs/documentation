# useQuery

`useQuery(query)` reads a query's per-scope state as refs and returns callbacks
bound to the provided scope. It is `useUnit` under the hood — no cache, no
options, one argument.

```vue
<script setup lang="ts">
import { useQuery } from "@virentia/net-vue";
import { searchQuery } from "./model";

const search = useQuery(searchQuery);
</script>

<template>
  <input @input="(e) => search.run({ text: e.target.value })" />
  <Spinner v-if="search.pending.value" />
  <ErrorBox v-if="search.error.value" :error="search.error.value" :retry="search.refetch" />
  <Results :items="search.data.value ?? []" :stale="search.stale.value" />
</template>
```

## Result

| Field | Type | Meaning |
|-------|------|---------|
| `data` | `Readonly<Ref<Data \| null>>` | latest success in this scope (`initialData` before the first run) |
| `error` | `Readonly<Ref<Err \| null>>` | latest failure; `null` again after a success |
| `pending` | `Readonly<Ref<boolean>>` | a run is in flight |
| `stale` | `Readonly<Ref<boolean>>` | set by `cache()`; `false` without it |
| `run(params)` | `(params: Raw) => Promise<Data>` | run the query in the provided scope |
| `refetch()` | `() => Promise<void>` | re-run the last params seen in this scope (no-op if it never ran there) |
| `reset()` | `() => Promise<void>` | clear `data`, abort in-flight runs |

The refs are reactive per scope: two components under different providers see
independent `data` and `pending`. In templates, remember refs unwrap only at the
top level — the fields here live on a plain object, so read `.value` explicitly.

## Notes

- `run` returns the query's promise: `await`ing it gives the loaded value or
  throws the failure — same contract as calling the query in `scoped`.
- The hook does not start the query. Loading on navigation is the model's job —
  a [trigger](/net/core/triggers) — so SSR, tests, and the component render the
  same behavior.
- Need only one field? `useUnit(searchQuery.pending)` works as always.
