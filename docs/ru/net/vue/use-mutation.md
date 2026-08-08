# useMutation

`useMutation(mutation)` читает per-scope состояние mutation рефами и возвращает
привязанный к скоупу `mutate`. Как и [`useQuery`](/ru/net/vue/use-query), это
тонкий сахар над `useUnit`.

```vue
<script setup lang="ts">
import { useMutation } from "@virentia/net-vue";
import { saveUserMutation } from "./model";

const props = defineProps<{ draft: UserDraft }>();
const save = useMutation(saveUserMutation);
</script>

<template>
  <button :disabled="save.pending.value" @click="save.mutate(props.draft)">
    {{ save.pending.value ? "Сохраняем…" : "Сохранить" }}
  </button>
  <InlineError v-if="save.error.value" :error="save.error.value" />
</template>
```

## Результат

| Поле | Тип | Значение |
|------|-----|----------|
| `data` | `Readonly<Ref<Data \| null>>` | последний успех в этом скоупе |
| `error` | `Readonly<Ref<Err \| null>>` | последняя ошибка; снова `null` после успеха |
| `pending` | `Readonly<Ref<boolean>>` | запуск в полёте |
| `mutate(params)` | `(params: Raw) => Promise<Data>` | запустить mutation в предоставленном скоупе |
| `reset()` | `() => Promise<void>` | очистить `data` и `error` |

## Заметки

- `await save.mutate(draft)` резолвится серверным результатом или бросает —
  используйте, когда обработчику нужен исход (закрыть диалог, перейти по роуту).
- `optimistic` и `invalidates` живут в [модели mutation](/ru/net/core/mutation),
  а не в хуке: компонент остаётся глупым триггером, и то же оптимистичное
  поведение работает, когда mutation гоняет триггер или тест.
