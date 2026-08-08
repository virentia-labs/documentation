# useMutation

`useMutation(mutation)` reads a mutation's per-scope state as refs and returns a
scope-bound `mutate`. Like [`useQuery`](/net/vue/use-query), it is thin sugar
over `useUnit`.

```vue
<script setup lang="ts">
import { useMutation } from "@virentia/net-vue";
import { saveUserMutation } from "./model";

const props = defineProps<{ draft: UserDraft }>();
const save = useMutation(saveUserMutation);
</script>

<template>
  <button :disabled="save.pending.value" @click="save.mutate(props.draft)">
    {{ save.pending.value ? "Saving…" : "Save" }}
  </button>
  <InlineError v-if="save.error.value" :error="save.error.value" />
</template>
```

## Result

| Field | Type | Meaning |
|-------|------|---------|
| `data` | `Readonly<Ref<Data \| null>>` | latest success in this scope |
| `error` | `Readonly<Ref<Err \| null>>` | latest failure; `null` again after a success |
| `pending` | `Readonly<Ref<boolean>>` | a run is in flight |
| `mutate(params)` | `(params: Raw) => Promise<Data>` | run the mutation in the provided scope |
| `reset()` | `() => Promise<void>` | clear `data` and `error` |

## Notes

- `await save.mutate(draft)` resolves with the server result or throws — use it
  when the handler needs the outcome (closing a dialog, navigating).
- `optimistic` and `invalidates` live on the [mutation model](/net/core/mutation),
  not in the hook: the component stays a dumb trigger, and the same optimistic
  behavior applies when the mutation is driven by a trigger or a test.
