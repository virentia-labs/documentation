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
import { route } from "@virentia/router";

export const homeRoute = route({ path: "/" });
export const profileRoute = route({
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

There are no dollar-prefixed `params`, `isOpened`, or `isPending` aliases.

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
`route.params`; router-level query state lives in `appRouter.query`.

## beforeOpen

`beforeOpen` runs before the route becomes active. It fits route-local rules:
authorization checks, data preloading, redirects, or analytics that must happen
before activation.

```ts
import { route } from "@virentia/router";
import { effect } from "@virentia/core";

const loadProfileFx = effect(async ({ params }: { params: { id: number } }) => {
  return fetch(`/api/users/${params.id}`).then((response) => response.json());
});

export const profileRoute = route({
  path: "/users/:id<number>",
  beforeOpen: [
    ({ params, query }) => {
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
};
```

When `route.open` writes history, the later history activation is recognized as
the router's own echo (a `programmatic` origin) and skips `beforeOpen`, so the
same guard does not run a second time for that activation.

## Lifecycle Events

A route exposes events for every stage of activation, so other models can react
without polling stores:

| Unit | Fires when |
| --- | --- |
| `opened` | The route becomes active, after `beforeOpen` resolves. Carries the normalized payload. |
| `openedOnClient` | Same as `opened`, but only in the browser. |
| `openedOnServer` | Same as `opened`, but only during SSR. |
| `closed` | The route stops being active. |
| `isPending` | `Store<boolean>` that is `true` while `beforeOpen` work is running. |

```ts
import { reaction } from "@virentia/core";

reaction({
  on: profileRoute.opened,
  run({ params }) {
    analytics.track("profile_viewed", { id: params?.id });
  },
});
```

`openedOnClient` and `openedOnServer` split client-only and server-only effects
in SSR apps — for example, start a websocket only on the client, or prefetch
only on the server. `isPending` is convenient for route-level loading UI.

## Parent Routes

A route can have a parent. Opening a child opens the parent model too:

```ts
export const settingsRoute = route({ path: "/settings" });
export const securityRoute = route({
  path: "/security",
  parent: settingsRoute,
});
```

Parent routes fit parents with their own state or layout. Rendering the child
through an outlet is a React concern; the route model only says which states are
open together.

## Pathless Routes

`route()` without a path creates a pathless route. It can still be opened,
observed, grouped, or rendered, but a router cannot build a URL for it unless it
is registered with an explicit path (see
[Router and history](/router/core/router#registering-routes)).

```ts
const modalRoute = route<{ id: string }>();
```

For state that behaves like a route but is not part of URL matching — modals,
derived "section is open" state, or screens gated behind async checks — use
virtual, grouped, and chained routes. They are covered on their own page:
[Virtual, chained & grouped routes](/router/core/virtual-routes).
