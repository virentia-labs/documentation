---
title: Virtual, chained & grouped routes
---

# Virtual, Chained & Grouped Routes

Not every route-like state maps to a URL. A confirmation modal, a derived
"either of these screens is open" state, or a screen that should appear only
after an authorization check all behave like routes — they open, close, carry
params, and can be rendered — but they are not matched from the address bar.

The core models this with three helpers built on the same virtual route
primitive:

- `virtualRoute` — a route that you open and close imperatively;
- `group` — a virtual route that mirrors "any of these routes is open";
- `chainRoute` — a virtual route that opens only after extra async checks pass.

All three return a `VirtualRoute`, so they render through the same route views as
ordinary routes and are accepted anywhere a `Route` is.

## Virtual routes

`virtualRoute` creates a pathless route driven entirely by its own `open`
and `close` events. There is no URL matching and no `beforeOpen`; opening it is
synchronous.

```ts
import { virtualRoute } from "@virentia/router";

const inviteModal = virtualRoute<{ teamId: string }>();

inviteModal.open({ teamId: "42" });
inviteModal.isOpened.value; // true
inviteModal.params.value; // { teamId: "42" }

inviteModal.close();
inviteModal.isOpened.value; // false
```

### Shape

```ts
interface VirtualRoute<T, Params> {
  readonly "@@type": "pathless-route";

  readonly params: StoreWritable<Params>;
  readonly isOpened: StoreWritable<boolean>;
  readonly isPending: Store<boolean>;

  readonly open: EventCallable<T>;
  readonly opened: Event<T>;
  readonly openedOnServer: Event<T>;
  readonly openedOnClient: Event<T>;

  readonly close: EventCallable<void>;
  readonly closed: Event<void>;
  readonly cancelled: EventCallable<void>;
}
```

`open` takes the payload type `T`. `opened` fires on every open; on the server
`openedOnServer` also fires, and in the browser `openedOnClient` fires, which is
useful for SSR-only or client-only side effects. `close` flips `isOpened` to
`false` and fires `closed` (it is a no-op if the route was not open).

### Transformer and pending state

By default `params` stores the open payload as-is. A `transformer` derives the
stored params from the payload — handy for normalizing or enriching input:

```ts
const details = virtualRoute<{ id: string }, { id: string; source: string }>({
  transformer: ({ id }) => ({ id, source: "virtual" }),
});

details.open({ id: "7" });
details.params.value; // { id: "7", source: "virtual" }
```

`isPending` defaults to a store that is always `false`. Pass your own `Store`
when the virtual route should reflect external loading state (this is how
`chainRoute` reports its `beforeOpen` progress):

```ts
const isPending = computed(() => loadFx.pending.value);
const screen = virtualRoute({ isPending });
```

Virtual routes fit modals, drawers, wizard steps, and any "is this open?" state
that should be observable and renderable like a route but is not addressable.

## Grouped routes

`group` builds a virtual route that is open while **any** of its input routes is
open, and pending while **any** input route is pending:

```ts
import { group } from "@virentia/router";

const settingsArea = group([profileRoute, securityRoute, billingRoute]);

// settingsArea.isOpened is true when at least one of the three is open.
```

A group is the clean way to drive shared layout or chrome. Render one layout
while the user is anywhere in a section, without subscribing to every route
individually:

```tsx
const SettingsLayoutView = routeView({
  route: settingsArea,
  view: () => (
    <SettingsChrome>
      <Outlet />
    </SettingsChrome>
  ),
});
```

`group` only observes its inputs — it has no params and is opened and closed
automatically as the inputs change. You never call `open`/`close` on a group
yourself.

## Chained routes

`chainRoute` solves "the URL matches, but the screen should wait." A plain route
opens as soon as its path matches. A chained route watches a source route, runs
extra `beforeOpen` work, and opens its own virtual route only when an `openOn`
signal fires — or stays closed if `cancelOn` fires first.

```ts
import { chainRoute, route } from "@virentia/router";
import { effect, event, reaction } from "@virentia/core";

const profileRoute = route({ path: "/users/:id" });

const authorized = event<void>();
const rejected = event<void>();

const checkAccessFx = effect(async ({ params }) => {
  return params.id !== "0";
});

reaction({
  on: checkAccessFx.doneData,
  run(isAuthorized) {
    void (isAuthorized ? authorized : rejected)();
  },
});

export const authorizedProfileRoute = chainRoute({
  route: profileRoute,
  beforeOpen: checkAccessFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

### Configuration

```ts
function chainRoute<Params extends object | void = void>(props: {
  route: Route<Params> | VirtualRoute<RouteOpenedPayload<Params>, Params>;
  beforeOpen: BeforeOpenUnit<Params> | BeforeOpenUnit<Params>[];
  openOn?: UnitList<any>;
  cancelOn?: UnitList<any>;
}): VirtualRoute<RouteOpenedPayload<Params>, Params>;
```

| Field | Meaning |
| --- | --- |
| `route` | The source route to watch. When it opens, the chain starts. |
| `beforeOpen` | One unit or an array of units (events, effects, or functions) run with the source payload before the chained route may open. |
| `openOn` | Units that, when fired, open the chained route with the last source payload. |
| `cancelOn` | Units that, when fired, close the chained route and fire `cancelled`. |

### Behavior

When the source `route.opened` fires, the chained route copies the source params
into its own `params`, sets `isPending` to `true`, and runs every `beforeOpen`
unit in the route's scope. Your reactions then decide the outcome:

- fire an `openOn` unit to open the chained route (it re-emits the stored
  payload through its own `open`/`opened`);
- fire a `cancelOn` unit to close it and fire `cancelled`.

The chained route also closes whenever the source route closes. Because the
result is a `VirtualRoute`, you render `authorizedProfileRoute` — not
`profileRoute` — in the route view for the guarded screen, while the URL still
belongs to the source route.

Chained routes fit authorization gates, feature-flagged screens, and "load
before showing" flows where the address can match before the screen is allowed
to render. For checks that should run as part of activation itself (rather than
gating a separate renderable route), prefer a route's own
[`beforeOpen`](/router/core/routes#beforeopen).
