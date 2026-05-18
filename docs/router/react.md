---
title: React rendering
---

# React Rendering

`@virentia/router-react` renders route models from `@virentia/router`. It does
not declare routes and it does not decide which URL is active. That work belongs
to route and router models.

React bindings cover these UI jobs:

- provide a router and optional history adapter to a React subtree;
- render the deepest opened route view;
- render nested children through an outlet;
- build links that keep normal browser anchor behavior;
- preload React chunks for route views.

## Provider

The tree is wrapped with `ScopeProvider` and `RouterProvider`:

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

If history is initialized outside React, omit `history` and pass only `router`.

## Route Views

A route view connects one route model to one component:

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

`createRoutesView` renders the deepest opened view. If no route view is opened,
it renders `otherwise` or `null`.

## Nested Views And Outlet

`Outlet` is for parent routes that own the layout while child routes render
inside it:

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

Parent/child activation belongs to the route model. `Outlet` only decides where
the opened child view is rendered.

## Layouts

`layout` wraps one route view:

```tsx
createRouteView({
  route: profileRoute,
  view: ProfilePage,
  layout: AppLayout,
});
```

`withLayout` wraps a group of views with the same component:

```tsx
import { withLayout } from "@virentia/router-react";

const accountViews = withLayout(AccountLayout, [
  createRouteView({ route: profileRoute, view: ProfilePage }),
  createRouteView({ route: securityRoute, view: SecurityPage }),
]);
```

## Links

`Link` is an anchor that builds `href` from a registered route and calls
`route.open` on normal clicks:

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

Modified clicks, prevented clicks, and non-`_self` targets stay with the
browser. Design-system components can use `useLink`:

```tsx
const { path, open } = useLink(profileRoute, { id: 42 });
```

Navigation semantics are described in [Navigation](/router/navigation).

## Lazy Views

`createLazyRouteView` registers the component import as a route preloader and
renders it with `React.lazy` and `Suspense`:

```tsx
import { createLazyRouteView } from "@virentia/router-react";

const ProfileView = createLazyRouteView({
  route: profileRoute,
  view: () => import("./profile-page"),
  fallback: ProfileSkeleton,
});
```

This preloads the React chunk before route activation finishes. It is useful for
screen code, but it is not a generic data-loading protocol.

For lazy business or data models, use `lazyModel` from `@virentia/core`.
Route-local view preloading only covers the component import; lazy model units
can be started by route events, commands, or background work before the screen
is rendered.

## Hooks

`@virentia/router-react` exposes small hooks for custom rendering:

```ts
useRouter(): Router;
useLink(route, params?, query?): { path: string; open: EventCallable<any> };
useIsOpened(routeOrRouter): boolean;
useOpenedViews(routeViews): RouteView[];
```

Hooks are mainly for local adapters and design-system integrations. Most apps
can stay with `RouterProvider`, `Link`, and route views.
