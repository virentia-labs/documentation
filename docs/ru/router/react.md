---
title: Отрисовка в React
---

# Отрисовка в React

`@virentia/router-react` показывает роуты из `@virentia/router`. Он не объявляет
роуты и не выбирает текущий URL. Это делает core-роутер.

React-пакет нужен, чтобы:

- передать роутер в React-дерево;
- подключить history через `RouterProvider`;
- показать компонент открытого роута;
- показать дочерний роут через `Outlet`;
- собрать ссылку через `Link`;
- подгрузить часть React-кода перед открытием роута.

## Provider

Дерево оборачивается в `ScopeProvider` и `RouterProvider`:

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider } from "@virentia/router-react";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import type { ReactNode } from "react";
import { appScope } from "./scope";
import { router } from "./router";

const routerHistory = historyAdapter(createBrowserHistory());

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router} history={routerHistory}>
        {children}
      </RouterProvider>
    </ScopeProvider>
  );
}
```

Если history уже подключается вне React, в `RouterProvider` передается только
`router`.

## Представления роутов

Представление роута связывает один роут с одним React-компонентом:

```tsx
import { createRouteView, createRoutesView } from "@virentia/router-react";
import { homeRoute, profileRoute } from "./routes";
import { HomePage } from "./home-page";
import { ProfilePage } from "./profile-page";

const HomeView = createRouteView({
  route: homeRoute,
  view: HomePage,
});

const ProfileView = createRouteView({
  route: profileRoute,
  view: ProfilePage,
});

export const RoutesView = createRoutesView({
  routes: [HomeView, ProfileView],
  otherwise: NotFoundPage,
});
```

`createRoutesView` показывает самое глубокое открытое представление. Если ничего не
открыто, он показывает `otherwise` или `null`.

## Outlet

`Outlet` нужен, когда родительский роут показывает общий лейаут, а дочерний роут
отрисовывается внутри него:

```tsx
import { Outlet, createRouteView, createRoutesView } from "@virentia/router-react";

const SettingsView = createRouteView({
  route: settingsRoute,
  view: () => (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  ),
  children: [
    createRouteView({
      route: securityRoute,
      view: SecurityPage,
    }),
  ],
});

export const RoutesView = createRoutesView({
  routes: [SettingsView],
});
```

Связь parent/child хранится в модели роута. `Outlet` только выбирает место, куда
поставить дочернее представление.

## Layouts

`layout` нужен для одного представления роута:

```tsx
createRouteView({
  route: profileRoute,
  view: ProfilePage,
  layout: AppLayout,
});
```

`withLayout` оборачивает группу представлений:

```tsx
import { withLayout } from "@virentia/router-react";

const accountViews = withLayout(AccountLayout, [
  createRouteView({ route: profileRoute, view: ProfilePage }),
  createRouteView({ route: securityRoute, view: SecurityPage }),
]);
```

## Link

`Link` рендерит `<a>`, строит `href` из зарегистрированного роута и вызывает
`route.open` при обычном клике:

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

Клики с клавишами-модификаторами, отмененные клики и ссылки с `target` не равным `_self`
остаются браузеру.

Для компонента дизайн-системы можно использовать `useLink`:

```tsx
const { path, open } = useLink(profileRoute, { id: 42 });
```

## Ленивые представления

`createLazyRouteView` регистрирует динамический import компонента как предзагрузчик роута и
рендерит его через `React.lazy` и `Suspense`:

```tsx
import { createLazyRouteView } from "@virentia/router-react";

const ProfileView = createLazyRouteView({
  route: profileRoute,
  view: () => import("./profile-page"),
  fallback: ProfileSkeleton,
});
```

Это подгружает часть JS-бандла до завершения открытия роута. Для ленивых
бизнес-моделей и моделей данных используется `lazyModel` из `@virentia/core`:
представление роута отвечает только за импорт React-компонента.

## Хуки

`@virentia/router-react` экспортирует хуки для локальных интеграций:

```ts
useRouter(): Router;
useLink(route, params?, query?): { path: string; open: EventCallable<any> };
useIsOpened(routeOrRouter): boolean;
useOpenedViews(routeViews): RouteView[];
```

Большинству приложений достаточно `RouterProvider`, `Link` и представлений роутов.
