---
title: Route views & outlets
---

# Route Views & Outlets

A route view binds one route model to one component. `@virentia/router-react`
renders the deepest opened view, wraps it in layouts, and exposes child views
through an outlet. None of these helpers decide which route is open — they only
map opened routes to rendered components.

## routeView

`routeView` connects a route (or router, or virtual route) to a component:

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

The `view` component reads its own params from the route model with `useUnit`,
not from props:

```tsx
import { useUnit } from "@virentia/react";

function ProfilePage() {
  const { id } = useUnit(profileRoute.params);

  return <h1>Profile {id}</h1>;
}
```

## routesView

`routesView` renders the deepest opened view from a list. If no view is
opened, it renders `otherwise` (or `null`):

```tsx
import { routeView, routesView } from "@virentia/router-react";

export const RoutesView = routesView({
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

## Nested views and Outlet

`Outlet` is for parent routes that own a layout while child routes render inside
it. The parent view renders `<Outlet />` where the child should appear:

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

Parent/child activation is decided by the route model (a child route opens its
[parent](/router/core/routes#parent-routes) too). `Outlet` only chooses where the
opened child view is rendered.

## Layouts

`layout` wraps a single route view in a component that receives `children`:

```tsx
routeView({
  route: profileRoute,
  view: ProfilePage,
  layout: AppLayout,
});
```

`withLayout` applies the same layout to a group of views without repeating it:

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

Use `layout` for a one-off wrapper and `withLayout` when several sibling views
share chrome. An `Outlet`-based parent route is the better fit when the wrapper
itself corresponds to a route with its own state.

## Lazy views

`lazyRouteView` registers the component import as a route preloader and
renders it with `React.lazy` and `Suspense`:

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

Registering the import as a preloader means the route waits for the chunk before
activation finishes, so navigation does not flash an empty screen. `fallback`
renders through `Suspense` while the chunk loads.

This covers the component import only — it is not a data-loading protocol. For
lazy business or data models, use `lazyModel` from `@virentia/core` and start
units from route events, commands, or `beforeOpen`.
