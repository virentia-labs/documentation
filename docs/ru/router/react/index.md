---
title: React
---

# React

`@virentia/router-react` отрисовывает модели роутов из `@virentia/router` в
дереве React. Он не объявляет роуты и не решает, какой URL активен, — эта работа
остается в моделях роута и роутера из [ядра](/ru/router/core/). React-пакет
отвечает только на вопрос «при данных открытых роутах, что должен показать DOM?».

Он покрывает такие UI-задачи:

- предоставить роутер и опциональный history-адаптер поддереву React;
- отрисовать самое глубокое открытое представление роута с родительскими
  лейаутами и дочерними outlet'ами;
- строить ссылки, сохраняющие обычное поведение браузерного якоря;
- предзагружать React-чанки для ленивых представлений роутов;
- предоставить небольшие хуки для кастомных адаптеров и компонентов
  дизайн-системы.

## Страницы

- [Провайдер](/ru/router/react/provider) — `RouterProvider`, скоуп и подключение
  history.
- [Представления роутов и Outlet](/ru/router/react/views) — `createRouteView`,
  `createRoutesView`, `Outlet`, лейауты и ленивые представления.
- [Ссылки](/ru/router/react/links) — `Link` и `useLink`.
- [Хуки](/ru/router/react/hooks) — `useRouter`, `useIsOpened`, `useOpenedViews`.

## Установка

```sh
pnpm add @virentia/core @virentia/react @virentia/router @virentia/router-react react
pnpm add history
```

`@virentia/react` предоставляет `ScopeProvider` и `useUnit`; `history` — это
браузерная history или history в памяти, которой владеет приложение и которую
оно передает роутеру.

## Минимальное дерево

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider, createRouteView, createRoutesView } from "@virentia/router-react";
import { historyAdapter } from "@virentia/router";
import { createBrowserHistory } from "history";
import { appScope } from "./scope";
import { router, homeRoute, profileRoute } from "./router";
import { HomePage, ProfilePage } from "./pages";

const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: homeRoute, view: HomePage }),
    createRouteView({ route: profileRoute, view: ProfilePage }),
  ],
  otherwise: NotFoundPage,
});

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router} history={historyAdapter(createBrowserHistory())}>
        <RoutesView />
      </RouterProvider>
    </ScopeProvider>
  );
}
```

Отсюда объявление роутов живет в моделях ядра, а каждая страница ниже объясняет
одну часть слоя отрисовки. Для React Native те же модели отрисовываются через
React Navigation — см. [React Native](/ru/router/react-native/).
