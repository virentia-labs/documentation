---
title: Route model
---

# Route Model

A route is a Virentia model for one addressable application state. It is not a
React component and not a history object. It stores whether that state is open,
which params opened it, and which rules must run before it becomes active.

Routes fit state that should be reachable by URL, opened by command, observed by
other models, and rendered by one or more UI adapters.

## Declaring Routes

Routes usually live at module level when the app shape is stable:

```ts
import { createRoute } from "@virentia/router";

export const homeRoute = createRoute({ path: "/" });
export const profileRoute = createRoute({
  path: "/users/:id<number>",
});
```

Path params are inferred from the template:

```ts
profileRoute.open({
  params: { id: 42 },
});
```

The public route shape is:

```ts
interface Route<Params> {
  params: StoreWritable<Params>;
  isOpened: StoreWritable<boolean>;
  isPending: Store<boolean>;

  open: EventCallable<RouteOpenedPayload<Params>>;
  opened: Event<InternalOpenedPayload<Params>>;
  openedOnClient: Event<InternalOpenedPayload<Params>>;
  openedOnServer: Event<InternalOpenedPayload<Params>>;
  closed: Event<void>;

  parent?: Route<any>;
}
```

There are no `$params`, `$isOpened`, or `$isPending` aliases.

## Params And Payload

`route.params` stores the params from the last successful activation. A route
without params can be opened with no payload:

```ts
homeRoute.open();
```

A route with path params requires `params`:

```ts
profileRoute.open({
  params: { id: 42 },
});
```

Every route can also receive query and replace options:

```ts
profileRoute.open({
  params: { id: 42 },
  query: { tab: "posts" },
  replace: true,
});
```

`query` is merged into the URL navigation request. It is not stored in
`route.params`; router-level query state lives in `router.query`.

## beforeOpen

`beforeOpen` runs before the route becomes active. It fits route-local rules:
authorization checks, data preloading, redirects, or analytics that must happen
before activation.

```ts
import { createRoute } from "@virentia/router";
import { effect } from "@virentia/core";

const loadProfileFx = effect(async ({ params }: { params: { id: number } }) => {
  return fetch(`/api/users/${params.id}`).then((response) => response.json());
});

export const profileRoute = createRoute({
  path: "/users/:id<number>",
  beforeOpen: [
    ({ params, query, causedBy }) => {
      if (!params) return;

      return loadProfileFx({ params });
    },
  ],
});
```

`beforeOpen` receives the opening payload:

```ts
type BeforeOpenPayload<Params> = {
  params?: Params;
  query?: Query;
  replace?: boolean;
  causedBy?: RouteActivationCause;
};
```

When `route.open` writes history, the later history activation is marked with
`causedBy: { type: "route.open", ... }`. The same route does not run the same
guard a second time for that activation.

## Parent Routes

A route can have a parent. Opening a child opens the parent model too:

```ts
export const settingsRoute = createRoute({ path: "/settings" });
export const securityRoute = createRoute({
  path: "/security",
  parent: settingsRoute,
});
```

Parent routes fit parents with their own state or layout. Rendering the child
through an outlet is a React concern; the route model only says which states are
open together.

## Pathless And Virtual Routes

`createRoute()` without a path creates a pathless route. It can still be opened,
observed, grouped, or used by rendering code, but a router cannot build a URL for
it unless it is registered with an explicit path.

```ts
const modalRoute = createRoute<{ id: string }>();
```

`createVirtualRoute` is useful for state that behaves like a route but is not
part of URL matching:

```ts
import { createVirtualRoute, group } from "@virentia/router";

const modal = createVirtualRoute<{ id: string }, { id: string }>();
const settingsArea = group([settingsRoute, securityRoute]);
```

Virtual routes fit groups, derived route state, and chained flows where the
result should be renderable or observable like a route.

## Chained Routes

`chainRoute` creates a virtual route that opens only after extra conditions pass.
It is useful when the URL can match first, but the screen should render only
after authorization, feature flags, or data checks.

```ts
import { chainRoute, createRoute } from "@virentia/router";
import { effect, event, reaction } from "@virentia/core";

const profileRoute = createRoute({ path: "/users/:id" });
const authorized = event<void>();
const rejected = event<void>();

const checkAuthorizationFx = effect(async ({ params }) => {
  return params.id !== "0";
});

reaction({
  on: checkAuthorizationFx.doneData,
  run(isAuthorized) {
    void (isAuthorized ? authorized : rejected)();
  },
});

export const authorizedProfileRoute = chainRoute({
  route: profileRoute,
  beforeOpen: checkAuthorizationFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

The chained route receives source params through its `params` store.
