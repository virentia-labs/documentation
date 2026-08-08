# useQuery

`useQuery(query)` читает per-scope состояние query рефами и возвращает колбэки,
привязанные к предоставленному скоупу. Под капотом это `useUnit` — без кеша, без
опций, один аргумент.

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

## Результат

| Поле | Тип | Значение |
|------|-----|----------|
| `data` | `Readonly<Ref<Data \| null>>` | последний успех в этом скоупе (`initialData` до первого запуска) |
| `error` | `Readonly<Ref<Err \| null>>` | последняя ошибка; снова `null` после успеха |
| `pending` | `Readonly<Ref<boolean>>` | запуск в полёте |
| `stale` | `Readonly<Ref<boolean>>` | выставляется `cache()`; без него — `false` |
| `run(params)` | `(params: Raw) => Promise<Data>` | запустить query в предоставленном скоупе |
| `refetch()` | `() => Promise<void>` | повторить последние params этого скоупа (no-op, если query там не запускалась) |
| `reset()` | `() => Promise<void>` | очистить `data`, прервать запуски в полёте |

Рефы реактивны per-scope: два компонента под разными провайдерами видят
независимые `data` и `pending`. В шаблонах помните: рефы разворачиваются только
на верхнем уровне — здесь поля лежат на обычном объекте, поэтому читайте
`.value` явно.

## Заметки

- `run` возвращает промис query: `await` даёт загруженное значение или бросает
  ошибку — тот же контракт, что у вызова query в `scoped`.
- Хук не запускает query. Загрузка при навигации — работа модели:
  [триггер](/ru/net/core/triggers) — тогда SSR, тесты и компонент рендерят одно
  и то же поведение.
- Нужно одно поле? `useUnit(searchQuery.pending)` работает как обычно.
