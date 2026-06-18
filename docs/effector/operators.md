# Effector operators

Use `fool(unit)` when a feature boundary must be visible to both Effector and Virentia.

## Virentia unit in sample

```ts
import { event, reaction, scoped } from "@virentia/core";
import { fool } from "@virentia/effector";
import { createEvent, createStore, sample } from "effector";

const userSelected = fool(event<string>());
const userOpened = createEvent<{ userId: string; token: string }>();
const $session = createStore({ token: "session-token" });

sample({
  clock: userSelected,
  source: $session,
  fn: (session, userId) => ({
    userId,
    token: session.token,
  }),
  target: userOpened,
});

await scoped(virentiaScope, () => userSelected("user:1"));
```

`userSelected` is called like a Virentia event, then used by Effector as a `clock`.

## Effector unit in reaction

```ts
import { event, reaction } from "@virentia/core";
import { fool } from "@virentia/effector";
import { allSettled, createEvent, sample } from "effector";

const routeOpened = fool(createEvent<string>());
const profileTracked = event<{ route: string }>();
const profileClicked = createEvent<string>();

sample({
  clock: profileClicked,
  target: routeOpened,
});

reaction({
  on: routeOpened,
  run(route) {
    profileTracked({ route });
  },
});

await allSettled(profileClicked, {
  scope: effectorScope,
  params: "/users/1",
});
```

`routeOpened` is launched like an Effector event, then observed by Virentia as `on`.

## Source and target

Fooled units can also be used as Effector `source` and `target`:

```ts
const sessionChanged = fool(event<{ token: string }>());
const userSelected = fool(createEvent<string>());
const userOpened = fool(event<{ userId: string; token: string }>());

sample({
  clock: userSelected,
  source: sessionChanged,
  fn: (session, userId) => ({ userId, token: session.token }),
  target: userOpened,
});
```

The direction still comes from the graph. In this example Effector reads `sessionChanged`, reacts to `userSelected`, and writes to `userOpened`.

## Association

Fooled units need a pre-created association between a Virentia scope and an Effector scope:

```ts
associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

When a Virentia unit runs inside `scoped`, the bridge uses the associated Effector scope. When an Effector unit runs inside `allSettled`, `scopeBind`, `launch`, or a Provider, the bridge uses the associated Virentia scope.
