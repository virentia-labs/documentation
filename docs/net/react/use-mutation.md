# useMutation

`useMutation(mutation)` reads a mutation's per-scope state and returns a
scope-bound `mutate`. Like [`useQuery`](/net/react/use-query), it is thin sugar
over `useUnit`.

```tsx
import { useMutation } from "@virentia/net-react";
import { saveUserMutation } from "./model";

function SaveButton({ draft }: { draft: UserDraft }) {
  const save = useMutation(saveUserMutation);

  return (
    <button disabled={save.pending} onClick={() => void save.mutate(draft)}>
      {save.pending ? "Saving…" : "Save"}
      {save.error && <InlineError error={save.error} />}
    </button>
  );
}
```

## Result

| Field | Type | Meaning |
|-------|------|---------|
| `data` | `Data \| null` | latest success in this scope |
| `error` | `Err \| null` | latest failure; `null` again after a success |
| `pending` | `boolean` | a run is in flight |
| `mutate(params)` | `(params: Raw) => Promise<Data>` | run the mutation in the provided scope |
| `reset()` | `() => Promise<void>` | clear `data` and `error` |

## Notes

- `await save.mutate(draft)` resolves with the server result or throws — use it
  when the handler needs the outcome (closing a dialog, navigating).
- `optimistic` and `invalidates` live on the [mutation model](/net/core/mutation),
  not in the hook: the component stays a dumb trigger, and the same optimistic
  behavior applies when the mutation is driven by a trigger or a test.
