---
title: Навигация
---

# Навигация

В роутере есть два способа менять адрес:

- `route.open(payload)` открывает конкретный роут;
- `appRouter.navigate(payload)` записывает путь или query в history напрямую.

Обычно лучше вызывать `route.open`: так код остается привязан к роуту, а не к
строке URL. `appRouter.navigate` нужен для низкоуровневых случаев: поменять только
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

`appRouter.navigate` пишет URL напрямую:

```ts
await scoped(appScope, () =>
  appRouter.navigate({
    path: "/users/42",
    query: { tab: "posts" },
  }),
);
```

Если `path` не передан, сохраняется текущий путь и меняется только query:

```ts
await scoped(appScope, () =>
  appRouter.navigate({
    query: { dialog: "invite" },
  }),
);
```

`back` и `forward` вызывают соответствующие методы history-адаптера:

```ts
await scoped(appScope, () => appRouter.back());
await scoped(appScope, () => appRouter.forward());
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

`scoped` удобен там, где надо явно указать scope и дождаться всей асинхронной
работы графа: его промис завершается только после того, как отработает
асинхронный граф, запущенный колбэком:

```ts
await scoped(appScope, () => profileRoute.open({ params: { id: 42 } }));
```

Такая форма подходит для тестов, серверных загрузчиков, команд и адаптеров и
читается так же, как обычный код приложения.

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
route({
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
appRouter.navigate({
  query: { filter: "open" },
});
```
