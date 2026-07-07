# Адаптеры (TanStack Query, Apollo)

**Исполнитель** (executor) — самый внутренний движок исполнения query или mutation. Его замена меняет *то, как* выполняется запрос, но не поверхность query — `data`/`pending`/`failData`, триггеры и операторы продолжают работать. Так net подкладывает под query TanStack Query или Apollo.

Адаптеры — subpath-экспорты, поэтому `@tanstack/query-core` и `@apollo/client` остаются опциональными. Оба принимают функцию `getClient`, читаемую лениво, поэтому клиент может приходить из [зависимости](/ru/core/dependencies) по скоупу.

```ts
import { apolloExecutor } from "@virentia/net-core/apollo";
import { tanstackExecutor } from "@virentia/net-core/tanstack";
```

## TanStack Query

`tanstackExecutor` пропускает ваш `handler` через `QueryClient`, поэтому применяются кеш и дедупликация запросов TanStack. Хэндлер остаётся функцией загрузки, а сигнал отмены net до него доходит — `query.abort()` и `takeLatest` отменяют запрос. Собственный `cache()` net тут не нужен.

```ts
import { concurrency, query } from "@virentia/net-core";
import { tanstackExecutor } from "@virentia/net-core/tanstack";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
  executor: tanstackExecutor(() => queryClient, {
    queryKey: ({ id }) => ["user", id], // по умолчанию: [name ?? "net", params]
  }),
  use: [concurrency({ strategy: "takeLatest" })],
});
```

Опции: `queryKey(params)`, `staleTime`.

## Apollo

`apolloExecutor` загружает через `client.query` по GraphQL-документу. Apollo здесь *и есть* загрузка, поэтому **`handler` не нужен**:

```ts
import { query } from "@virentia/net-core";
import { apolloExecutor } from "@virentia/net-core/apollo";
import { gql } from "@apollo/client";

const USER = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

const userQuery = query<{ id: string }, { user: User }>({
  executor: apolloExecutor(() => apolloClient, {
    document: USER,
    variables: ({ id }) => ({ id }),
  }),
});
```

Документ может быть функцией от параметров. Сигнал отмены net пробрасывается через `context.fetchOptions.signal` Apollo. Опции: `document`, `variables(params)`, `fetchPolicy`.

## Структурные клиенты

Адаптеры принимают **минимальную структурную форму** каждого клиента (`fetchQuery` / `query`), поэтому настоящий `QueryClient` или `ApolloClient` им подходит, а net не берёт жёсткую зависимость. Давайте клиент по скоупу через `dependency`, чтобы изолировать тесты и SSR:

```ts
const client = dependency<QueryClient>("queryClient");
tanstackExecutor(() => client.value);
```

Чтобы пропускать **каждый** query через адаптер без повторения `executor`, задайте его как дефолт:

```ts
overrideDefaults(query, { executor: tanstackExecutor(() => queryClient) });
```

См. [Дефолты](/ru/net/defaults).
