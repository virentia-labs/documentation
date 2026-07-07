# Net

`@virentia/net-core` описывает удалённые данные как модель: какой fetch выполняется, когда, как ведут себя пересекающиеся запуски и как восстанавливаются ошибки — всё вне UI.

Главная мысль: **query — это эффект.** Это настоящий эффект `@virentia/core`, поэтому у него уже есть `pending`, `doneData`, `failData`, `abort`, персональный `signal` на вызов и изоляция по scope. Net добавляет сверху два стора — `data` и `stale` — и небольшой набор композируемых операторов.

```sh
pnpm add @virentia/net-core @virentia/core
```

```ts
import { concurrency, query, retry, trigger } from "@virentia/net-core";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
  use: [concurrency({ strategy: "takeLatest" }), retry({ times: 3, delay: 300 })],
});

userQuery.pending; // Store<boolean>
userQuery.data; // Store<User | null>
userQuery.failData; // Event<Error>

trigger(userQuery, { on: userRoute.opened, params: () => ({ id: userRoute.params.value.id }) });
```

## Из чего состоит

- [`query`](/ru/net/query) — fetch-эффект плюс сторы `data`/`stale` и `refresh`/`reset`.
- [`mutation`](/ru/net/mutation) — сторона записи: тот же эффект плюс `optimistic` и `invalidates`.
- [`trigger`](/ru/net/triggers) — запуск query/mutation, когда срабатывает любой юнит Virentia.
- [операторы](/ru/net/operators) — `concurrency` и `retry` как middleware в `use: []`.
- [адаптеры](/ru/net/adapters) — подложить под query TanStack Query или Apollo, не меняя её поверхность.
- [дефолты](/ru/net/defaults) — `overrideDefaults` для общего executor'а или операторов, глобально или per-scope.

## Где живёт состояние

`data` и `pending` у query — per-scope, как любой стор Virentia: читайте их через `useUnit` в компонентах или `scoped(scope, () => userQuery.data.value)` в обычном коде, а в тестах гоняйте через `scoped(scope, () => userQuery(payload))`. Состояние операторов — in-flight запуск takeLatest, дорожки по ключу — тоже ключуется по scope, поэтому тесты и SSR-запросы не протекают друг в друга.

`cache()` и барьеры в планах; всё выше уже есть.
