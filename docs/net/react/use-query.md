# useQuery

`useQuery(query)` reads a query's per-scope state and returns callbacks bound to
the provided scope. It is `useUnit` under the hood — no cache, no options, one
argument.

```tsx
import { useQuery } from "@virentia/net-react";
import { searchQuery } from "./model";

function Search() {
  const search = useQuery(searchQuery);

  return (
    <>
      <input onChange={(e) => void search.run({ text: e.target.value })} />
      {search.pending && <Spinner />}
      {search.error && <ErrorBox error={search.error} retry={search.refetch} />}
      <Results items={search.data ?? []} stale={search.stale} />
    </>
  );
}
```

## Result

| Field | Type | Meaning |
|-------|------|---------|
| `data` | `Data \| null` | latest success in this scope (`initialData` before the first run) |
| `error` | `Err \| null` | latest failure; `null` again after a success |
| `pending` | `boolean` | a run is in flight |
| `stale` | `boolean` | set by `cache()`; `false` without it |
| `run(params)` | `(params: Raw) => Promise<Data>` | run the query in the provided scope |
| `refetch()` | `() => Promise<void>` | re-run the last params seen in this scope (no-op if it never ran there) |
| `reset()` | `() => Promise<void>` | clear `data`, abort in-flight runs |

All reads are reactive: the component re-renders when the store values change in
the provided scope — and only then. Two components under different
`ScopeProvider`s see independent `data` and `pending`.

## Notes

- `run` returns the query's promise: `await`ing it in an event handler gives the
  loaded value or throws the failure — same contract as calling the query in
  `scoped`.
- The hook does not start the query. Loading on mount is the model's job — a
  [trigger](/net/core/triggers) on a route or on an event — so SSR, tests, and
  the component render the same behavior.
- Need only one field? `useUnit(searchQuery.pending)` works as always; `useQuery`
  is convenience, not a requirement.
