---
title: Представления роутов и Outlet
---

# Представления роутов и Outlet

Представление роута связывает одну модель роута с одним компонентом.
`@virentia/router-react` отрисовывает самое глубокое открытое представление,
оборачивает его в лейауты и предоставляет дочерние представления через outlet.
Ни один из этих хелперов не решает, какой роут открыт, — они только сопоставляют
открытые роуты с отрисованными компонентами.

## routeView

`routeView` связывает роут (или роутер, или виртуальный роут) с
компонентом:

```tsx
import { routeView } from "@virentia/router-react";
import { homeRoute, profileRoute } from "./router";
import { HomePage } from "./home-page";
import { ProfilePage } from "./profile-page";

const HomeView = routeView({
  route: homeRoute,
  view: HomePage,
});

const ProfileView = routeView({
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

## routesView

`routesView` отрисовывает самое глубокое открытое представление из списка.
Если ни одно представление не открыто, он отрисовывает `otherwise` (или `null`):

```tsx
import { routeView, routesView } from "@virentia/router-react";

export const RoutesView = routesView({
  routes: [HomeView, ProfileView],
  otherwise: NotFoundPage,
});
```

```ts
interface CreateRoutesViewProps {
  routes: (RouteView | RouteViewGroup)[];
  otherwise?: ComponentType;
  layout?: LayoutComponent;
}
```

## Вложенные представления и Outlet

`Outlet` нужен для родительских роутов, которые владеют лейаутом, пока дочерние
роуты отрисовываются внутри него. Родительское представление ставит `<Outlet />`
туда, где должен появиться дочерний роут:

```tsx
import { Outlet, routeView, routesView } from "@virentia/router-react";

const SettingsView = routeView({
  route: settingsRoute,
  view: () => (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  ),
  children: [
    routeView({
      route: securityRoute,
      view: SecurityPage,
    }),
  ],
});

export const RoutesView = routesView({
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
routeView({
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
  routeView({ route: profileRoute, view: ProfilePage }),
  routeView({ route: securityRoute, view: SecurityPage }),
]);
```

```ts
function withLayout(
  layout: ComponentType<{ children: ReactNode }>,
  views: RouteView[],
): RouteView[];
```

### Layout у routesView

`routesView` тоже принимает `layout`. В отличие от `layout` у отдельного
представления, он оборачивает весь вывод `routesView`, поэтому монтируется один
раз и остаётся смонтированным при смене роутов — перемонтируется только
внутреннее представление. `otherwise` тоже отрисовывается внутри него:

```tsx
export const RoutesView = routesView({
  routes: [OverviewView, ReportsView],
  layout: AppShell,
  otherwise: NotFoundPage,
});
```

### routeViewGroup

`withLayout` даёт каждому представлению собственную копию лейаута, поэтому
переключение между ними **перемонтирует** лейаут и теряет его состояние.
`routeViewGroup` разделяет один лейаут между несколькими представлениями: он
объединяет их роуты в [`group`](/ru/router/core/virtual-routes#сгруппированные-роуты) и несёт
общий лейаут. Сам он ничего не отрисовывает — его отрисовывает `routesView`,
оставляя лейаут смонтированным, пока активен любой из членов, и меняя только
внутреннее представление. Лейаут перемонтируется, только когда навигация
покидает группу целиком:

```tsx
import { routeView, routeViewGroup, routesView } from "@virentia/router-react";

const dashboard = routeViewGroup({
  layout: DashboardLayout,
  views: [
    routeView({ route: overviewRoute, view: OverviewPage }),
    routeView({ route: reportsRoute, view: ReportsPage }),
  ],
});

export const RoutesView = routesView({
  routes: [dashboard, routeView({ route: loginRoute, view: LoginPage })],
});
```

```ts
interface RouteViewGroup {
  route: VirtualRoute<any, any>;
  views: RouteView[];
  layout?: LayoutComponent;
}

interface CreateRouteViewGroupProps {
  views: RouteView[];
  layout?: LayoutComponent;
}

function routeViewGroup(props: CreateRouteViewGroupProps): RouteViewGroup;
```

`RouteViewGroup` кладётся в список `routes` у `routesView` рядом с обычными
представлениями — `routesView` единственная точка отрисовки. Как `route`,
`router` и `group`, создавайте группу на уровне модуля — до форка scope — чтобы
её юниты попали в граф форкнутого scope.

Используйте `layout` у `routeView` для разовой обертки, `withLayout`, когда
соседние представления делят обрамление, которое можно перемонтировать, `layout`
у `routesView` для оболочки вокруг всего представления, и `routeViewGroup`,
когда общий лейаут должен оставаться смонтированным при навигации между его
представлениями. Родительский роут с `Outlet` подходит лучше, когда сама обертка
соответствует роуту с собственным состоянием.

## Ленивые представления

`lazyRouteView` регистрирует import компонента как предзагрузчик роута и
отрисовывает его через `React.lazy` и `Suspense`:

```tsx
import { lazyRouteView } from "@virentia/router-react";

const ProfileView = lazyRouteView({
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
