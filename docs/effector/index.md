# Effector compatibility

`@virentia/effector` lets Virentia models work with applications that already use Effector.

Existing Effector code keeps importing from `effector`; Virentia models keep importing from `@virentia/core`. This package connects their scopes and lets one boundary unit participate in both runtimes.

## Install

```sh
pnpm add @virentia/effector effector @virentia/core
```

## Associate scopes

Create one association for the Virentia scope and Effector scope that belong to the same render, test, request, or application boundary:

```ts
import { scope } from "@virentia/core";
import { associate } from "@virentia/effector";
import { fork } from "effector";

const virentiaScope = scope();
const effectorScope = fork();

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Associations are stored globally in weak maps. There is no compatibility object and no `dispose()` handle. The association is reachable while its scopes are reachable.

Both scopes are required. If a fooled unit runs without an association, the package throws instead of creating a hidden scope.

## Universal units

Use `fool(unit)` at feature boundaries. The returned value is a pass-through unit that can be used by Effector and Virentia:

```ts
import { event } from "@virentia/core";
import { fool } from "@virentia/effector";

export const checkoutRequested = fool(event<{ orderId: string }>());
```

Effector features can use that unit as `clock`, `source`, or `target`. Virentia features can listen to it with `reaction`/`on` and can call it inside `run` or `scoped`.

::: warning Direct calls
`fool(original)` returns a new universal unit and does not mutate `original`. Keep and pass the returned value. Calling `original` still calls the original runtime unit, not the fooled wrapper. The bridge can observe that original call and forward it through associated scopes, but the hybrid API exists only on the value returned by `fool`.
:::

## Virentia to Effector

A Virentia feature can own a command while an Effector feature consumes that command as an Effector clock:

```ts
import { event, scoped } from "@virentia/core";
import { fool } from "@virentia/effector";
import { createEvent, createStore, sample } from "effector";

const checkoutRequested = fool(event<{ orderId: string }>());

function createVirentiaCheckoutFeature() {
  return {
    requestCheckout: checkoutRequested,
  };
}

function createEffectorBillingFeature() {
  const $session = createStore({ token: "session-token" });
  const billingStarted = createEvent<{ orderId: string; token: string }>();

  sample({
    clock: checkoutRequested,
    source: $session,
    fn: (session, request) => ({
      orderId: request.orderId,
      token: session.token,
    }),
    target: billingStarted,
  });

  return {
    billingStarted,
  };
}

const checkout = createVirentiaCheckoutFeature();
const billing = createEffectorBillingFeature();

await scoped(virentiaScope, () => checkout.requestCheckout({ orderId: "order:1" }));
```

The Virentia call runs in `virentiaScope`. The bridge uses the association to launch the Effector clock in the paired `effectorScope`.

## Effector to Virentia

An Effector feature can own a command while a Virentia feature listens to that same boundary unit:

```ts
import { event, reaction } from "@virentia/core";
import { fool } from "@virentia/effector";
import { allSettled, createEvent, sample } from "effector";

const routeOpened = fool(createEvent<string>());

function createEffectorRoutesFeature() {
  const profileClicked = createEvent<string>();

  sample({
    clock: profileClicked,
    target: routeOpened,
  });

  return {
    profileClicked,
  };
}

function createVirentiaAnalyticsFeature() {
  const profileTracked = event<{ route: string }>();

  reaction({
    on: routeOpened,
    run(route) {
      profileTracked({ route });
    },
  });

  return {
    profileTracked,
  };
}

const routes = createEffectorRoutesFeature();
const analytics = createVirentiaAnalyticsFeature();

await allSettled(routes.profileClicked, {
  scope: effectorScope,
  params: "/users/1",
});
```

The Effector graph runs in `effectorScope`. The bridge uses the association to run the Virentia reaction in the paired `virentiaScope`.

## Scope lookup

When a fooled unit runs inside the Effector graph, the bridge reads `stack.scope` and finds the associated Virentia scope. When a fooled unit runs inside `scoped`, the bridge reads the current Virentia scope and finds the associated Effector scope.

Use `scoped`, Effector `allSettled`, `scopeBind`, `launch`, or UI Providers to choose scopes. The bridge only translates between already associated scopes.
