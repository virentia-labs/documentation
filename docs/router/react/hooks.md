---
title: Hooks
---

# Hooks

`@virentia/router-react` exposes small hooks for code that renders routes itself
instead of using `createRoutesView`. They are mainly for local adapters,
design-system integrations, and custom navigators. Most applications can stay
with `RouterProvider`, route views, and `Link`.

All hooks must be called under a [`RouterProvider`](/router/react/provider).

## useRouter

Returns the router from context. Useful for reading `router.query`, calling
`router.navigate`, or passing the router to a helper:

```tsx
import { useRouter } from "@virentia/router-react";
import { useUnit } from "@virentia/react";

function CurrentQuery() {
  const router = useRouter();
  const query = useUnit(router.query);

  return <pre>{JSON.stringify(query)}</pre>;
}
```

```ts
function useRouter(): Router;
```

## useIsOpened

Subscribes to whether a route, router, or virtual route is currently open, and
re-renders when it changes:

```tsx
import { useIsOpened } from "@virentia/router-react";

function ProfileTabBadge() {
  const isOpen = useIsOpened(profileRoute);

  return <Badge active={isOpen} />;
}
```

```ts
function useIsOpened(route: Route<any> | Router | VirtualRoute<any, any>): boolean;
```

This is the hook behind active-link styling and conditional chrome that depends
on whether a section is active.

## useOpenedViews

Given a list of route views, returns the ones whose routes are currently open,
ordered from outermost to deepest. This is the primitive that custom renderers
build on — `createRoutesView` and the React Native navigators use it to decide
what to show:

```ts
function useOpenedViews(routes: RouteView[]): RouteView[];
```

```tsx
import { useOpenedViews } from "@virentia/router-react";

function DebugOpenViews({ routes }: { routes: RouteView[] }) {
  const opened = useOpenedViews(routes);

  return <code>{opened.map((view) => view.route).length} open</code>;
}
```

Reach for it when you need full control over how opened routes map to UI — a
breadcrumb trail, a native stack, an analytics probe — rather than the default
"render the deepest one" behavior.

## useLink

`useLink` builds an `href` and a bound open command for a route. Because it is
mostly used to build links, it is documented with [Links](/router/react/links).

```ts
function useLink<Params extends object | void = void>(
  to: Route<Params>,
  params?: Params,
  query?: Query,
): { path: string; open: EventCallable<RouteOpenedPayload<Params>> };
```
