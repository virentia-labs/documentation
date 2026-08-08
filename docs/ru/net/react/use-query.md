# useQuery

`useQuery(query)` читает per-scope состояние query и возвращает колбэки,
привязанные к предоставленному скоупу. Под капотом это `useUnit` — без кеша, без
опций, один аргумент.

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

## Результат

| Поле | Тип | Значение |
|------|-----|----------|
| `data` | `Data \| null` | последний успех в этом скоупе (`initialData` до первого запуска) |
| `error` | `Err \| null` | последняя ошибка; снова `null` после успеха |
| `pending` | `boolean` | запуск в полёте |
| `stale` | `boolean` | выставляется `cache()`; без него — `false` |
| `run(params)` | `(params: Raw) => Promise<Data>` | запустить query в предоставленном скоупе |
| `refetch()` | `() => Promise<void>` | повторить последние params этого скоупа (no-op, если query там не запускалась) |
| `reset()` | `() => Promise<void>` | очистить `data`, прервать запуски в полёте |

Все чтения реактивны: компонент ререндерится, когда значения сторов меняются в
предоставленном скоупе — и только тогда. Два компонента под разными
`ScopeProvider` видят независимые `data` и `pending`.

## Заметки

- `run` возвращает промис query: `await` в обработчике даёт загруженное значение
  или бросает ошибку — тот же контракт, что у вызова query в `scoped`.
- Хук не запускает query. Загрузка при монтировании — работа модели:
  [триггер](/ru/net/core/triggers) на роуте или событии — тогда SSR, тесты и
  компонент рендерят одно и то же поведение.
- Нужно одно поле? `useUnit(searchQuery.pending)` работает как обычно:
  `useQuery` — удобство, а не требование.
