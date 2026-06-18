---
title: Представления роутов и Outlet
---

# Представления роутов и Outlet

Представление роута связывает одну модель роута с одним компонентом.
`@virentia/router-react` отрисовывает самое глубокое открытое представление,
оборачивает его в лейауты и предоставляет дочерние представления через outlet.
Ни один из этих хелперов не решает, какой роут открыт, — они только сопоставляют
открытые роуты с отрисованными компонентами.

## createRouteView

`createRouteView` связывает роут (или роутер, или виртуальный роут) с
компонентом:

```tsx
import { createRouteView } from "@virentia/router-react";
import { homeRoute, profileRoute } from "./router";
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
```

```ts
interface CreateRouteViewProps<Params extends object | void = void> {
  route: Route<Params> | Router | VirtualRoute<any, any>;
  view: ComponentType;
  layout?: LayoutComponent;
  children?: RouteView[];
}
```

Компонент `view` читает свои параметры из модели роута через `useUnit`, а не из
пропсов:

```tsx
import { useUnit } from "@virentia/react";

function ProfilePage() {
  const { id } = useUnit(profileRoute.params);

  return <h1>Profile {id}</h1>;
}
```

## createRoutesView

`createRoutesView` отрисовывает самое глубокое открытое представление из списка.
Если ни одно представление не открыто, он отрисовывает `otherwise` (или `null`):

```tsx
import { createRouteView, createRoutesView } from "@virentia/router-react";

export const RoutesView = createRoutesView({
  routes: [HomeView, ProfileView],
  otherwise: NotFoundPage,
});
```

```ts
interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: ComponentType;
}
```

## Вложенные представления и Outlet

`Outlet` нужен для родительских роутов, которые владеют лейаутом, пока дочерние
роуты отрисовываются внутри него. Родительское представление ставит `<Outlet />`
туда, где должен появиться дочерний роут:

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

Активацию parent/child решает модель роута (дочерний роут открывает и своего
[родителя](/ru/router/core/routes#родительские-роуты)). `Outlet` лишь выбирает,
где отрисовать открытое дочернее представление.

## Layouts

`layout` оборачивает одно представление роута в компонент, который получает
`children`:

```tsx
createRouteView({
  route: profileRoute,
  view: ProfilePage,
  layout: AppLayout,
});
```

`withLayout` применяет один и тот же лейаут к группе представлений, не повторяя
его:

```tsx
import { withLayout } from "@virentia/router-react";

const accountViews = withLayout(AccountLayout, [
  createRouteView({ route: profileRoute, view: ProfilePage }),
  createRouteView({ route: securityRoute, view: SecurityPage }),
]);
```

```ts
function withLayout(
  layout: ComponentType<{ children: ReactNode }>,
  views: RouteView[],
): RouteView[];
```

Используйте `layout` для разовой обертки и `withLayout`, когда несколько
соседних представлений делят общее обрамление. Родительский роут с `Outlet`
подходит лучше, когда сама обертка соответствует роуту с собственным состоянием.

## Ленивые представления

`createLazyRouteView` регистрирует import компонента как предзагрузчик роута и
отрисовывает его через `React.lazy` и `Suspense`:

```tsx
import { createLazyRouteView } from "@virentia/router-react";

const ProfileView = createLazyRouteView({
  route: profileRoute,
  view: () => import("./profile-page"),
  fallback: ProfileSkeleton,
});
```

```ts
interface CreateLazyRouteViewProps<Params extends object | void = void>
  extends Omit<CreateRouteViewProps<Params>, "view"> {
  view: () => Promise<{ default: ComponentType }>;
  fallback?: ComponentType;
}
```

Регистрация import как предзагрузчика означает, что роут ждет загрузки чанка
перед завершением активации, поэтому навигация не мигает пустым экраном.
`fallback` отрисовывается через `Suspense`, пока чанк загружается.

Это покрывает только import компонента — это не протокол загрузки данных. Для
ленивых бизнес-моделей или моделей данных используйте `lazyModel` из
`@virentia/core` и запускайте юниты из событий роута, команд или `beforeOpen`.
