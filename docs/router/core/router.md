---
title: Router and history
---

# Router And History

A router is the model that knows which routes exist under one URL space. It
matches incoming locations, activates route models, and exposes the current path,
query, history adapter, and active route list.

A router is needed when routes must be connected to a URL. A route can exist
without a router, but `Link`, `useLink`, path building, direct URL activation,
and browser navigation need a registered router.

## Registering Routes

The router is usually declared next to the route declarations:

```ts
import { createRouter } from "@virentia/router";
import { homeRoute, profileRoute } from "./routes";

export const router = createRouter({
  routes: [homeRoute, profileRoute],
});
```

The public router shape is:

```ts
interface Router {
  path: Store<string>;
  query: Store<Query>;
  history: Store<RouterAdapter | null>;
  activeRoutes: Store<Route<any>[]>;

  navigate: EventCallable<NavigatePayload>;
  back: EventCallable<void>;
  forward: EventCallable<void>;
  setHistory: EventCallable<RouterAdapter>;
  dispose: EventCallable<void>;

  ownRoutes: MappedRoute[];
  knownRoutes: MappedRoute[];
  registerRoute(route: InputRoute): void;
}
```

`ownRoutes` contains routes registered directly in this router. `knownRoutes`
also includes routes from nested routers.

## Static Shape And Owners

Application routers are normally static graph objects:

```ts
export const router = createRouter({ routes });
```

They do not need an `owner` by default. Values live in a scope; the router model
itself describes the stable app shape.

`owner` is only needed when the router is created for a temporary runtime scenario:
embedded preview, disposable widget, cached screen instance, or test helper that
creates and destroys a whole mini-app. In those cases the owner should dispose
the temporary graph, and `router.dispose` should release the history
subscription.

## Connecting History

The router does not create browser or memory history. Applications own history
creation and pass a structural adapter:

```ts
import { scoped, scope } from "@virentia/core";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import { router } from "./router";

const appScope = scope();
const browserHistory = createBrowserHistory();

await scoped(appScope, () =>
  router.setHistory(historyAdapter(browserHistory)),
);
```

In React, the provider is usually the boundary:

```tsx
<ScopeProvider scope={appScope}>
  <RouterProvider router={router} history={historyAdapter(browserHistory)}>
    <App />
  </RouterProvider>
</ScopeProvider>
```

`setHistory` captures the current Virentia scope. Later callbacks from
`history.listen` return to the same scope before they update router stores.

`allSettled(router.setHistory, { scope, payload })` is useful in tests, server
loaders, commands, and framework adapters where the boundary should be explicit.

## History Adapter Type

Router runtime depends on this structural shape:

```ts
interface RouterAdapter {
  location: {
    pathname: string;
    search: string;
    hash: string;
  };

  push(to: string | Partial<RouterLocation>): void;
  replace(to: string | Partial<RouterLocation>): void;
  goBack(): void;
  goForward(): void;
  listen(callback: (location: RouterLocation) => void): RouterSubscription;
}
```

`historyAdapter` adapts the `history` package. `queryAdapter` is for hosted
widgets that store internal route state in the query string of a larger page.

`history` belongs in applications, examples, and tests. Libraries should depend
on Virentia router adapter types, not create history internally.

## Activation Flow

When history changes, the router:

1. parses the path against registered route templates;
2. parses query string into `router.query`;
3. runs route preloaders and `beforeOpen`;
4. opens matching parent and child routes;
5. closes routes that no longer match;
6. writes `router.activeRoutes`.

Direct URL and browser navigation activations carry:

```ts
{
  causedBy: { type: "history", source: "initial" | "push" | "replace" | "pop" }
}
```

Opening a route programmatically carries:

```ts
{
  causedBy: { type: "route.open", route, id }
}
```

That distinction lets guards know why the activation happened and prevents the
same `route.open` guard from running twice after history reports the matching
location.

## Router Controls

`createRouter` builds its history binding, `path`/`query` stores, navigation
commands, and query tracking on top of a lower-level object called *router
controls*. `createRouterControls` exposes that object directly:

```ts
import { createRouterControls } from "@virentia/router";

const controls = createRouterControls();
```

```ts
interface RouterControls {
  readonly history: Store<RouterAdapter | null>;
  readonly locationState: StoreWritable<LocationState>;
  readonly query: Store<Query>;
  readonly path: Store<string>;

  readonly setHistory: EventCallable<RouterAdapter>;
  readonly navigate: EventCallable<NavigatePayload>;
  readonly back: EventCallable<void>;
  readonly forward: EventCallable<void>;
  readonly dispose: EventCallable<void>;
  readonly locationUpdated: EventCallable<LocationState>;

  trackQuery<Parameters>(
    config: Omit<QueryTrackerConfig<Parameters>, "forRoutes">,
  ): QueryTracker<Parameters>;
}
```

Controls are useful when several routers must share one history source: build one
controls object and call `setHistory` on it once, instead of letting each router
manage its own subscription. The `trackQuery` here has no `forRoutes`, because
controls have no route table of their own — route-scoped tracking belongs on a
router. Most applications never construct controls directly; `createRouter` does
it for them.

## Nested Routers

A nested router fits a feature that owns a URL subtree and should keep its route
table close to the feature:

```ts
const settingsRouter = createRouter({
  base: "/settings",
  routes: [generalRoute, securityRoute],
});

export const appRouter = createRouter({
  routes: [homeRoute, settingsRouter],
});
```

When the parent router receives history, it forwards the same adapter to child
routers. The child router sees paths relative to its `base`, while the parent
still owns the full URL space.
