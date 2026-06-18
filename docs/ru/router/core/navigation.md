---
title: Навигация
---

# Навигация

В роутере есть два способа менять адрес:

- `route.open(payload)` открывает конкретный роут;
- `router.navigate(payload)` записывает путь или query в history напрямую.

Обычно лучше вызывать `route.open`: так код остается привязан к роуту, а не к
строке URL. `router.navigate` нужен для низкоуровневых случаев: поменять только
query, перейти по уже готовому пути, вызвать back/forward.

## Открытие роута

В коде приложения роут запускается в нужном scope:

```ts
import { scoped } from "@virentia/core";
import { profileRoute } from "./routes";

await scoped(appScope, () =>
  profileRoute.open({
    params: { id: 42 },
    query: { tab: "posts" },
  }),
);
```

Если роут зарегистрирован в роутере с history, `route.open` соберет URL из
шаблона пути и запишет его в history. Если history не подключена, роут все равно
запустит предзагрузчики и `beforeOpen`.

`replace` заменяет текущую запись history:

```ts
await scoped(appScope, () =>
  profileRoute.open({
    params: { id: 42 },
    replace: true,
  }),
);
```

## Прямая навигация

`router.navigate` пишет URL напрямую:

```ts
await scoped(appScope, () =>
  router.navigate({
    path: "/users/42",
    query: { tab: "posts" },
  }),
);
```

Если `path` не передан, сохраняется текущий путь и меняется только query:

```ts
await scoped(appScope, () =>
  router.navigate({
    query: { dialog: "invite" },
  }),
);
```

`back` и `forward` вызывают соответствующие методы history-адаптера:

```ts
await scoped(appScope, () => router.back());
await scoped(appScope, () => router.forward());
```

## Ссылки в React

`Link` рендерит `<a>`, строит `href` из зарегистрированного роута и при обычном
клике вызывает `route.open`:

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

Клики с клавишами-модификаторами, уже отмененные клики и ссылки с `target` не равным
`_self` остаются браузеру.

`useLink` нужен компонентам дизайн-системы, которым надо получить `href` и
готовую функцию открытия:

```tsx
const { path, open } = useLink(profileRoute, { id: 42 });
```

## Тесты и системные границы

`allSettled` удобен там, где надо явно указать scope и дождаться всей
асинхронной работы графа:

```ts
await allSettled(profileRoute.open, {
  scope: appScope,
  payload: { params: { id: 42 } },
});
```

Такая форма подходит для тестов, серверных загрузчиков, команд и адаптеров. В обычном
коде приложения чаще читается проще:

```ts
await scoped(appScope, () => profileRoute.open({ params: { id: 42 } }));
```

## Частые сценарии

Открыть страницу сущности:

```ts
profileRoute.open({ params: { id: 42 } });
```

Открыть вкладку через query:

```ts
profileRoute.open({
  params: { id: 42 },
  query: { tab: "activity" },
});
```

Сделать перенаправление из проверки:

```ts
createRoute({
  path: "/admin",
  beforeOpen: [
    async () => {
      if (!session.isAdmin.value) {
        await homeRoute.open({ replace: true });
      }
    },
  ],
});
```

Оставить путь и поменять query:

```ts
router.navigate({
  query: { filter: "open" },
});
```
