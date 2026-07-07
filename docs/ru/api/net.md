# API @virentia/net-core

Декларативный слой работы с удалёнными данными. Query/mutation — это эффект `@virentia/core`, дополненный стором `data`, стором `stale` и `refresh`/`reset`.

## query

```ts
import { query } from "@virentia/net-core";

const userQuery = query({
  params: (raw: RawInput) => Params,      // опционально
  handler: async (params, { signal, scope }) => Data,
  use: [/* операторы */],                 // опционально
  executor,                               // опционально
  key: (params) => unknown,               // опционально
  initialData,                            // опционально
  trigger,                                // опционально
  name,                                   // опционально
});
```

Возвращает `Effect<Raw, Data, Err>` плюс:

- `data: Store<Data | null>` — последний успех, по скоупу.
- `stale: Store<boolean>` — ставит `cache()`; иначе `false`.
- `refresh: EventCallable<void>` — перезапуск последних параметров в скоупе.
- `reset: EventCallable<void>` — очистить `data`, отменить in-flight.

См. [Query](/ru/net/query).

## mutation

```ts
import { mutation } from "@virentia/net-core";

const addItem = mutation({
  handler: async (params, ctx) => Data,
  optimistic: { update(params, { scope }) {}, rollback(params, { scope }) {} },
  invalidates: [someQuery],
  // + params / use / executor / key / trigger / name, как в query()
});
```

Та же форма, что у `query`. `invalidates` перезапускает целевые query (через `refresh`) при успехе; `optimistic.update` применяется на старте, `rollback` откатывает один раз при финальной ошибке. См. [Mutation](/ru/net/mutation).

## trigger

```ts
import { trigger } from "@virentia/net-core";

const stop = trigger(target, {
  on: unit,                 // юнит или массив юнитов
  params: (payload) => raw, // опционально
  filter: (payload) => boolean, // опционально
});
```

Запускает `target` при срабатывании `on`. Возвращает функцию отписки; автоматически регистрирует очистку внутри владельца. См. [Триггеры](/ru/net/triggers).

## concurrency

```ts
import { concurrency } from "@virentia/net-core";

concurrency({ strategy: "takeLatest", key: (params) => params.id });
```

`strategy`: `"takeLatest"` (по умолчанию) | `"takeFirst"` | `"takeEvery"` | `"queue"`. `key` разбивает на независимые дорожки. См. [Операторы](/ru/net/operators).

## retry

```ts
import { retry } from "@virentia/net-core";

retry({ times: 3, delay: 300, when: (error, attempt) => boolean });
```

`delay` может быть `(attempt, error) => ms` для бэкоффа. Скипы и отмены не ретраятся. См. [Операторы](/ru/net/operators).

## timeout · debounce · fallback · tap

```ts
import { timeout, debounce, fallback, tap } from "@virentia/net-core";

timeout(5000);                                   // или timeout({ ms }) — TimeoutError по дедлайну
debounce({ wait: 300 });                          // задержка; настоящий debounce с takeLatest
fallback([]);                                     // value | (error, params) => value
tap({ onStart, onSuccess, onError, onSettled });  // наблюдать, не меняя результат
```

См. [Операторы](/ru/net/operators).

## overrideDefaults

```ts
import { overrideDefaults, query } from "@virentia/net-core";

const revert = overrideDefaults(
  query,                    // или `mutation`
  { executor, use },        // NetDefaults
  { scope },                // опционально — привязать к скоупу
);
```

Задаёт дефолты, которые наследуют query/mutation фабрики — исполнитель по умолчанию и/или операторы `use` по умолчанию — глобально или по скоупу. Разрешается во время выполнения внутри скоупа запуска. Возвращает функцию отката. См. [Дефолты](/ru/net/defaults).

## Исполнители и адаптеры

```ts
import type { Executor, NetHandler } from "@virentia/net-core";
import { tanstackExecutor } from "@virentia/net-core/tanstack";
import { apolloExecutor } from "@virentia/net-core/apollo";
```

`Executor<Params, Data>` — это просто функция `(params, ctx) => Promise<Data>`, самое внутреннее звено цепочки. В `ctx` есть `signal`, `scope` и хэндлер пользователя (`handler`, если есть). По умолчанию вызывает `ctx.handler`; вручную его пишут редко. `tanstackExecutor(getClient, opts?)` пропускает хэндлер через TanStack `QueryClient`; `apolloExecutor(getClient, { document, variables?, fetchPolicy? })` загружает через Apollo и не требует хэндлера. Оба — опциональные subpath-экспорты. См. [Адаптеры](/ru/net/adapters).

## Скипы

```ts
import { isSkip, SkipSignal } from "@virentia/net-core";
import type { SkipReason } from "@virentia/net-core";
```

Запуск, который намеренно не выполнился (вытесненный запуск `takeLatest`, будущий закрытый барьер, попадание в кеш), выдаёт `SkipSignal` вместо настоящей ошибки. `isSkip(error)` его распознаёт; `SkipReason` — это `"cache-hit" | "barrier" | "concurrency"`.

## Типы расширения

```ts
import { NET } from "@virentia/net-core";
import type { NetEffect, NetInternals, Operator, OperatorInitCtx, Handler, RunCtx } from "@virentia/net-core";
```

`Operator` — контракт middleware (`wrapHandler` / `setup`, `stage`). `NetEffect`/`NetInternals` — форма query/mutation и её приватный хэндл `[NET]`, используемый `trigger()` и кастомными операторами.
