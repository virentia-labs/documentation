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

Как и роутер, net делится на framework-agnostic ядро и тонкие биндинги фреймворков.

[**Ядро**](/ru/net/core/) — `@virentia/net-core`, всё, что выше UI:

- [`query`](/ru/net/core/query) — fetch-эффект плюс сторы `data`/`stale` и `refresh`/`reset`.
- [`mutation`](/ru/net/core/mutation) — сторона записи: тот же эффект плюс `optimistic` и `invalidates`.
- [`trigger`](/ru/net/core/triggers) — запуск query/mutation, когда срабатывает любой юнит Virentia.
- [операторы](/ru/net/core/operators) — `concurrency` и `retry` как middleware в `use: []`.
- [адаптеры](/ru/net/core/adapters) — подложить под query TanStack Query или Apollo, не меняя её поверхность.
- [дефолты](/ru/net/core/defaults) — `overrideDefaults` для общего executor'а или операторов, глобально или per-scope.

Биндинги — по хуку на вид юнита, тонкий сахар над `useUnit`:

- [**React**](/ru/net/react/) — `@virentia/net-react`: [`useQuery`](/ru/net/react/use-query), [`useMutation`](/ru/net/react/use-mutation).
- [**Vue**](/ru/net/vue/) — `@virentia/net-vue`: [`useQuery`](/ru/net/vue/use-query), [`useMutation`](/ru/net/vue/use-mutation).

## Где живёт состояние

`data` и `pending` у query — per-scope, как любой стор Virentia: читайте их через [`useQuery`](/ru/net/react/use-query) / `useUnit` в компонентах или `scoped(scope, () => userQuery.data.value)` в обычном коде, а в тестах гоняйте через `scoped(scope, () => userQuery(payload))`. Состояние операторов — in-flight запуск takeLatest, дорожки по ключу — тоже ключуется по scope, поэтому тесты и SSR-запросы не протекают друг в друга.

`cache()` и барьеры в планах; всё выше уже есть.
