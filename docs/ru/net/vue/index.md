---
title: Vue
---

# Vue

`@virentia/net-vue` читает net-модели в компонентах Vue. Как и React-биндинг, он
не объявляет query и не решает, когда они запускаются, — это остаётся в моделях
[ядра](/ru/net/core/). Vue-пакет отвечает на тот же единственный вопрос: «при
данном query или mutation, что рендерить компоненту и как его вызывать?»

Оба хука — тонкий сахар над `useUnit`: сторы приходят read-only `Ref`'ами,
колбэки привязаны к предоставленному скоупу. Ни кеша, ни плагина — скоуп из
`ScopeProvider` (или `provideScope`) — единственная проводка.

## Страницы

- [useQuery](/ru/net/vue/use-query) — рефы `data`/`error`/`pending`/`stale` плюс
  привязанные к скоупу `run`/`refetch`/`reset`.
- [useMutation](/ru/net/vue/use-mutation) — рефы `data`/`error`/`pending` плюс
  привязанные к скоупу `mutate`/`reset`.

## Установка

```sh
pnpm add @virentia/net-core @virentia/net-vue @virentia/core @virentia/vue vue
```

`@virentia/net-vue` реэкспортирует `ScopeProvider`, `provideScope`,
`useProvidedScope` и `useUnit`, так что компоненту хватает одного импорта для
net и проводки скоупа.

## Минимальный компонент

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

Скоуп приходит от предка через `ScopeProvider` или `provideScope(app, scope)`
при настройке приложения. Когда query запускается —
[триггер](/ru/net/core/triggers) на роуте, `run` из обработчика, SSR-проход —
решает модель; компонент лишь рендерит текущее per-scope состояние.
