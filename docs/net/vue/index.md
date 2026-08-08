---
title: Vue
---

# Vue

`@virentia/net-vue` reads net models in Vue components. Like the React binding,
it does not declare queries and does not decide when they run — that stays in
the [core](/net/core/) models. The Vue package answers the same single question:
"given this query or mutation, what should the component render, and how does it
call it?"

Both hooks are thin sugar over `useUnit`: stores come back as read-only `Ref`s,
callbacks are bound to the provided scope. No extra cache, no plugin — the scope
from `ScopeProvider` (or `provideScope`) is the only wiring.

## Pages

- [useQuery](/net/vue/use-query) — `data`/`error`/`pending`/`stale` refs plus
  scope-bound `run`/`refetch`/`reset`.
- [useMutation](/net/vue/use-mutation) — `data`/`error`/`pending` refs plus
  scope-bound `mutate`/`reset`.

## Install

```sh
pnpm add @virentia/net-core @virentia/net-vue @virentia/core @virentia/vue vue
```

`@virentia/net-vue` re-exports `ScopeProvider`, `provideScope`,
`useProvidedScope`, and `useUnit`, so a component needs one import for net and
scope wiring.

## The smallest component

```vue
<script setup lang="ts">
import { useQuery } from "@virentia/net-vue";
import { userQuery } from "./model";

const user = useQuery(userQuery);
</script>

<template>
  <Spinner v-if="user.pending.value" />
  <Retry v-else-if="user.error.value" @click="user.run({ id: '42' })" />
  <Card v-else :data="user.data.value" />
</template>
```

The scope arrives from an ancestor via `ScopeProvider` or `provideScope(app,
scope)` at app setup. When the query runs — a [trigger](/net/core/triggers) on a
route, a `run` from a handler, an SSR pass — is the model's decision; the
component only renders the current per-scope state.
