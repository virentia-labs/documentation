---
title: React
---

# React

`@virentia/net-react` reads net models in React components. It does not declare
queries and it does not decide when they run — that work stays in the
[core](/net/core/) models. The React package only answers "given this query or
mutation, what should the component render, and how does it call it?"

A query is a Virentia effect, so both hooks are thin sugar over `useUnit`: they
read the per-scope stores and hand back callbacks bound to the provided scope.
There is no extra cache, no context of its own, no lifecycle — the scope from
`ScopeProvider` is the only wiring.

## Pages

- [useQuery](/net/react/use-query) — `data`/`error`/`pending`/`stale` plus
  scope-bound `run`/`refetch`/`reset`.
- [useMutation](/net/react/use-mutation) — `data`/`error`/`pending` plus
  scope-bound `mutate`/`reset`.

## Install

```sh
pnpm add @virentia/net-core @virentia/net-react @virentia/core @virentia/react react
```

`@virentia/net-react` re-exports `ScopeProvider`, `useProvidedScope`, and
`useUnit`, so a component needs one import for net and scope wiring.

## The smallest component

```tsx
import { ScopeProvider, useQuery } from "@virentia/net-react";
import { scope } from "@virentia/core";
import { userQuery } from "./model";

function UserCard({ id }: { id: string }) {
  const user = useQuery(userQuery);

  if (user.pending) return <Spinner />;
  if (user.error) return <Retry onClick={() => user.run({ id })} />;

  return <Card data={user.data} />;
}

const appScope = scope();

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <UserCard id="42" />
    </ScopeProvider>
  );
}
```

When the query runs — a [trigger](/net/core/triggers) on a route, a `run` from
an event handler, an SSR pass — is the model's decision; the component only
renders the current per-scope state.
