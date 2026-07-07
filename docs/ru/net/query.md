# Query

`query(config)` создаёт fetch-эффект. Результат — эффект `@virentia/core` (его жизненный цикл у вас уже есть), к которому добавлены стор `data`, стор `stale` и `refresh`/`reset`.

```ts
import { query } from "@virentia/net-core";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
});
```

## Конфигурация

| Поле | Значение |
|------|----------|
| `handler(params, ctx)` | асинхронный загрузчик; `ctx` — `{ signal, scope }`. Пробросьте `ctx.signal` в `fetch` для отмены. |
| `params?(raw)` | преобразует вход вызова/триггера в параметры хэндлера. Опустите — вход передаётся как есть. |
| `use?` | упорядоченные [операторы](/ru/net/operators) (`concurrency`, `retry`, …). |
| `executor?` | заменяет движок исполнения — см. [адаптеры](/ru/net/adapters). По умолчанию запускает `handler`. |
| `key?(params)` | ключ дорожки, общий для операторов (например, concurrency по id). |
| `initialData?` | начальное значение для `data` (по умолчанию `null`). |
| `trigger?` | встроенная привязка [триггера](/ru/net/triggers). |
| `name?` | имя для devtools. |

`params` отделяет форму вызова от формы хэндлера — query вызывается сырым входом, а хэндлер получает преобразованное значение:

```ts
const userQuery = query({
  params: (raw: { userId: string }) => ({ id: raw.userId }),
  handler: async ({ id }: { id: string }) => fetchUser(id),
});

userQuery({ userId: "7" }); // хэндлер видит { id: "7" }
```

## Юниты

Query запускается вызовом, а наблюдается через юниты эффекта — плюс те, что добавляет net:

```ts
userQuery({ id: "42" }); // запуск в скоупе

userQuery.pending; // Store<boolean>       — загрузка
userQuery.doneData; // Event<Data>          — каждый успех
userQuery.failData; // Event<Error>         — каждая ошибка
userQuery.abort(); // отменить текущие запуски в этом скоупе

userQuery.data; // Store<Data | null>   — последний успех (по скоупу)
userQuery.stale; // Store<boolean>       — ставит cache(); без него false
userQuery.refresh; // EventCallable<void>  — перезапуск последних параметров в этом скоупе
userQuery.reset; // EventCallable<void>  — очистить data, отменить in-flight
```

## Чтение и запуск

Query живёт по скоупам, как любая модель. В компонентах читайте юниты через `useUnit`; вне их — читайте через скоуп и запускайте через `scoped`:

```ts
import { scope, scoped } from "@virentia/core";

const app = scope();

await scoped(app, () => userQuery({ id: "42" }));
scoped(app, () => userQuery.data.value); // загруженный User
```

Разные скоупы держат независимые `data`/`pending`, поэтому одно определение обслуживает приложение, тест и SSR-запрос без общего состояния. `refresh` перезапускает последние параметры, увиденные **в этом скоупе**; если query там не запускался — ничего не делает.
