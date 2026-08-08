# useMutation

`useMutation(mutation)` читает per-scope состояние mutation и возвращает
привязанный к скоупу `mutate`. Как и [`useQuery`](/ru/net/react/use-query), это
тонкий сахар над `useUnit`.

```tsx
import { useMutation } from "@virentia/net-react";
import { saveUserMutation } from "./model";

function SaveButton({ draft }: { draft: UserDraft }) {
  const save = useMutation(saveUserMutation);

  return (
    <button disabled={save.pending} onClick={() => void save.mutate(draft)}>
      {save.pending ? "Сохраняем…" : "Сохранить"}
      {save.error && <InlineError error={save.error} />}
    </button>
  );
}
```

## Результат

| Поле | Тип | Значение |
|------|-----|----------|
| `data` | `Data \| null` | последний успех в этом скоупе |
| `error` | `Err \| null` | последняя ошибка; снова `null` после успеха |
| `pending` | `boolean` | запуск в полёте |
| `mutate(params)` | `(params: Raw) => Promise<Data>` | запустить mutation в предоставленном скоупе |
| `reset()` | `() => Promise<void>` | очистить `data` и `error` |

## Заметки

- `await save.mutate(draft)` резолвится серверным результатом или бросает —
  используйте, когда обработчику нужен исход (закрыть диалог, перейти по роуту).
- `optimistic` и `invalidates` живут в [модели mutation](/ru/net/core/mutation),
  а не в хуке: компонент остаётся глупым триггером, и то же оптимистичное
  поведение работает, когда mutation гоняет триггер или тест.
