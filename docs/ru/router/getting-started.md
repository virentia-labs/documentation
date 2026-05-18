---
title: Быстрый старт роутера
---

# Быстрый старт роутера

Эта страница нужна только как короткая карта. Основные страницы раздела описывают
отдельные части API.

## Установка

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

`history` ставится в приложение. Пакеты роутера принимают history-адаптеры, но
не создают браузерную history или history в памяти.

## Что читать дальше

- Описать путь и типы параметров: [Шаблоны путей](/ru/router/paths).
- Описать открываемое состояние: [Модель роута](/ru/router/routes).
- Зарегистрировать роуты и подключить history: [Роутер и history](/ru/router/router).
- Открывать роуты и менять URL: [Навигация](/ru/router/navigation).
- Привязать диалоги и фильтры к query: [Отслеживание query](/ru/router/query-tracking).
- Показать открытые роуты в React: [Отрисовка в React](/ru/router/react).

## Минимальная форма

```ts
// routes.ts
export const homeRoute = createRoute({ path: "/" });
export const profileRoute = createRoute({ path: "/users/:id<number>" });
```

```ts
// router.ts
export const router = createRouter({
  routes: [homeRoute, profileRoute],
});
```

```tsx
// app-providers.tsx
<ScopeProvider scope={appScope}>
  <RouterProvider router={router} history={routerHistory}>
    <App />
  </RouterProvider>
</ScopeProvider>
```

Роуты описывают открываемое состояние. Роутер связывает это состояние с URL.
React-пакет только показывает то, что роутер уже открыл.
