# Adapters (TanStack Query, Apollo)

An **executor** is the innermost execution engine of a query or mutation. Swapping it changes *how* the fetch runs but not the query's surface — `data`/`pending`/`failData`, triggers, and operators keep working. This is how net backs a query with TanStack Query or Apollo.

The adapters are subpath exports, so `@tanstack/query-core` and `@apollo/client` stay optional. Both take a `getClient` function, read lazily, so the client can come from a per-scope [dependency](/core/dependencies).

```ts
import { apolloExecutor } from "@virentia/net-core/apollo";
import { tanstackExecutor } from "@virentia/net-core/tanstack";
```

## TanStack Query

`tanstackExecutor` routes your `handler` through a `QueryClient`, so TanStack's cache and request deduplication apply. The handler stays the fetch function, and net's abort signal still reaches it — `query.abort()` and `takeLatest` cancel the fetch. Net's own `cache()` is unnecessary here.

```ts
import { concurrency, query } from "@virentia/net-core";
import { tanstackExecutor } from "@virentia/net-core/tanstack";

const userQuery = query({
  handler: async ({ id }: { id: string }, { signal }) => {
    const res = await fetch(`/api/users/${id}`, { signal });
    return (await res.json()) as User;
  },
  executor: tanstackExecutor(() => queryClient, {
    queryKey: ({ id }) => ["user", id], // default: [name ?? "net", params]
  }),
  use: [concurrency({ strategy: "takeLatest" })],
});
```

Options: `queryKey(params)`, `staleTime`.

## Apollo

`apolloExecutor` fetches via `client.query` from a GraphQL document. Apollo *is* the fetch, so **no `handler` is needed**:

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

The document may be a function of params. Net's abort signal is forwarded through Apollo's `context.fetchOptions.signal`. Options: `document`, `variables(params)`, `fetchPolicy`.

## Structural clients

The adapters accept a **minimal structural shape** of each client (`fetchQuery` / `query`), so a real `QueryClient` or `ApolloClient` satisfies them without net taking a hard dependency. Provide the client per scope with a `dependency` to keep tests and SSR isolated:

```ts
const client = dependency<QueryClient>("queryClient");
tanstackExecutor(() => client.value);
```

To route **every** query through an adapter without repeating `executor`, set it as a default:

```ts
overrideDefaults(query, { executor: tanstackExecutor(() => queryClient) });
```

See [Defaults](/net/defaults).
