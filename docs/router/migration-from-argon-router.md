---
title: Migrating from argon-router
---

# Migrating From argon-router

This page is for moving existing `@argon-router/*` code to Virentia Router. It
is not a compatibility wrapper: old imports and Effector-style APIs are not
provided as aliases.

## Package Names

Packages are separate:

| argon-router | Virentia Router |
| --- | --- |
| `@argon-router/paths` | `@virentia/router-paths` |
| `@argon-router/core` | `@virentia/router` |
| `@argon-router/react` | `@virentia/router-react` |

React bindings are not exported from router subpaths such as
`@virentia/router/react`.

[`@virentia/router-react-native`](/router/react-native/) adds React Navigation
bindings for native apps; argon-router had no equivalent.

## Runtime Model

Effector wiring moves to Virentia primitives:

| Effector / argon-router | Virentia |
| --- | --- |
| `createEvent` | `event` |
| `createStore` | `store` |
| `createEffect` | `effect` |
| `sample`, `createAction` | `reaction` |
| `fork` | `scope` |
| `scopeBind` | `scoped(scope).wrap(fn)` |
| `Provider` | `ScopeProvider` |
| `useUnit` from `effector-react` | `useUnit` from `@virentia/react` |

## Store Names

Effector-style `$` fields are removed:

| argon-router | Virentia Router |
| --- | --- |
| `route.$params` | `route.params` |
| `route.$isOpened` | `route.isOpened` |
| `route.$isPending` | `route.isPending` |
| `router.$path` | `router.path` |
| `router.$query` | `router.query` |
| `router.$history` | `router.history` |
| `router.$activeRoutes` | `router.activeRoutes` |

There are no compatibility aliases.

## Opening Routes

Old argon-router:

```ts
route.open({ params: { id: "42" } });
```

Virentia Router:

```ts
import { scoped } from "@virentia/core";

await scoped(appScope, () => route.open({ params: { id: "42" } }));
```

`allSettled(route.open, { scope, payload })` is useful in tests, server loaders,
commands, and framework adapters where the boundary should be explicit and the
caller needs to wait for graph work to settle.

In React, `Link` and `useUnit(route.open)` bind calls to the provided scope.

## beforeOpen

Virentia `beforeOpen` receives the opening payload:

```ts
createRoute({
  path: "/profile/:id",
  beforeOpen: [
    ({ params, query, causedBy }) => {
      console.log(params?.id, query.tab, causedBy?.type);
    },
  ],
});
```

For `route.open`, `beforeOpen` runs before navigation. The later history
activation is marked with `causedBy` and skips the same guard, so the guard runs
once. This covers the old argon-router issue where clicking a link could run
`beforeOpen` twice and briefly render a not-found view.

## History

The router does not create history. History stays in application code:

```ts
import { createBrowserHistory } from "history";
import { scoped } from "@virentia/core";
import { historyAdapter } from "@virentia/router";

await scoped(appScope, () =>
  router.setHistory(historyAdapter(createBrowserHistory())),
);
```

Libraries should depend on Virentia router adapter types. Apps and tests should
install `history` themselves.

## Query Tracking

`trackQuery` no longer depends on Zod specifically. Any object with
`safeParse` can be used:

```ts
const dialog = router.trackQuery({
  parameters: {
    safeParse(query) {
      return query.dialog === "profile"
        ? { success: true, data: { dialog: "profile" as const } }
        : { success: false };
    },
  },
});
```

`dialog.enter(payload)` and `dialog.exit()` replace hand-written query-string
navigation for common dialog and filter flows.

## React Views

`createRouteView`, `createRoutesView`, `Link`, and `Outlet` keep the same idea,
but are backed by Virentia scopes.

`withLayout` wraps an array of route views:

```tsx
withLayout(Layout, [
  createRouteView({ route: routes.profile, view: ProfilePage }),
  createRouteView({ route: routes.friends, view: FriendsPage }),
]);
```

Lazy route views register their import as a route preloader. `lazyModel` is the
core primitive for lazy business and data models. A generic preload protocol
should move to `@virentia/core` only after the same contract is needed outside
routing.

## Effector Interop

Every Effector unit does not need to be mechanically ported into the router
layer. The usual split is:

- new routing state in `@virentia/router`;
- business state in Virentia models;
- `@virentia/effector` only at temporary migration boundaries.
