# Дефолты

`overrideDefaults` задаёт то, что наследует каждый query или mutation — исполнитель по умолчанию (например, [адаптер](/ru/net/adapters)) или операторы по умолчанию — либо на весь процесс, либо в рамках одного скоупа.

```ts
import { overrideDefaults, query } from "@virentia/net-core";

overrideDefaults(query, {
  executor: tanstackExecutor(() => queryClient),
  use: [retry({ times: 3 })],
});
```

Первый аргумент — фабрика (`query` или `mutation`), поэтому у каждой свои дефолты. По умолчанию задаются две вещи:

- `executor` — движок, когда query/mutation не передаёт свой.
- `use` — операторы, добавляемые перед `use` каждого query/mutation, в рамках их стадии.

## Переопределения по скоупу

Передайте `{ scope }`, чтобы ограничить переопределение одним скоупом — для тестов и SSR-запросов, которые не должны протекать друг в друга:

```ts
const testScope = scope();

overrideDefaults(
  query,
  { executor: { run: async (params) => fixtures[params.id] } },
  { scope: testScope },
);
```

Это работает, потому что дефолты **разрешаются во время выполнения, внутри скоупа запуска** — query, определённый один раз, подхватывает те дефолты, что даёт его скоуп в момент фактического запуска. Приоритет, от низкого к высокому:

```
встроенное  <  глобальный overrideDefaults  <  overrideDefaults по скоупу  <  собственный конфиг query
```

`executor` — последний побеждает; `use` накапливается (глобальные, затем по скоупу, затем собственный). Явные `executor`/`use` у query всегда важнее.

## Откат

`overrideDefaults` возвращает функцию отката. Поскольку разрешение читает реестр вживую, откат вступает в силу немедленно для последующих запусков.

```ts
const revert = overrideDefaults(query, { executor: fakeExecutor }, { scope: testScope });
// ... прогон теста ...
revert();
```

## Один адаптер везде

```ts
// точка входа приложения — каждый query через TanStack
overrideDefaults(query, { executor: tanstackExecutor(() => queryClient) });

// отдельным query теперь не нужен `executor`
const userQuery = query({ handler: (id) => api.user(id) });
```
