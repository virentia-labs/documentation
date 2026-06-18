---
title: Core
---

# Core

The core of Virentia Router is two framework-agnostic packages:

| Package | Purpose |
| --- | --- |
| `@virentia/router-paths` | Typed path templates: parse a URL into params, build a URL from params, validate templates at type level, convert to Express syntax |
| `@virentia/router` | Route models, routers, history adapters, navigation, query tracking, virtual/chained/grouped routes |

Neither package depends on React. They model routing as Virentia state, so any
renderer — `@virentia/router-react`, `@virentia/router-react-native`, or a custom
one — reads the same models.

## Mental patterns

The core is documented one mental pattern per page. Each page explains the
problem, the API shape, and where the boundary belongs.

- [Path templates](/router/core/paths) — how a URL string is parsed into typed
  params and built back, independent of any route.
- [Route model](/router/core/routes) — what a route stores (`isOpened`,
  `params`, lifecycle events) and how `beforeOpen` and parent routes work.
- [Router and history](/router/core/router) — registering routes, connecting a
  history adapter, the activation flow, nested routers, and router controls.
- [Navigation](/router/core/navigation) — `route.open`, `router.navigate`,
  `back`/`forward`, and where to call them.
- [Query tracking](/router/core/query-tracking) — turning URL query state into
  `entered`/`exited` model events for dialogs, filters, and tabs.
- [Virtual, chained & grouped routes](/router/core/virtual-routes) — route-like
  state that is not part of URL matching.

## Install

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
```

`@virentia/router-paths` is a dependency of `@virentia/router`, so installing it
explicitly is only needed when you use the path utilities directly.

The router accepts history adapters but never creates browser or memory history
itself — the application owns history creation and passes it in (see
[Router and history](/router/core/router)).

## What the core exports

```ts
import {
  // routes
  createRoute,
  createVirtualRoute,
  chainRoute,
  group,
  // router
  createRouter,
  createRouterControls,
  // history adapters
  historyAdapter,
  queryAdapter,
  // query tracking
  trackQueryFactory,
  // type guards
  is,
} from "@virentia/router";

import {
  compile,
  convertPath,
  type ParseUrlParams,
} from "@virentia/router-paths";
```

The full type-level contract for every export is in the
[`@virentia/router` API reference](/api/router).

## Type guards

`is` narrows unknown values to router types. It is useful in generic rendering
code and adapters that accept either a route or a router:

```ts
import { is } from "@virentia/router";

is.route(value); // value is Route<any>
is.pathRoute(value); // value is PathRoute<any>
is.pathlessRoute(value); // value is PathlessRoute<any>
is.router(value); // value is Router
```

`@virentia/router-react-native`, for example, uses these guards to tell routes
that can be opened apart from plain views.
