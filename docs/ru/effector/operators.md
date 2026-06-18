# Операторы Effector

Используйте `fool(unit)`, когда граница фичи должна быть видна и Effector, и Virentia.

## Юнит Virentia в sample

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

`userSelected` вызывается как событие Virentia, а затем используется Effector как `clock`.

## Юнит Effector в reaction

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

`routeOpened` запускается как событие Effector, а затем наблюдается Virentia через `on`.

## Source и target

Fooled-юниты также можно использовать как Effector `source` и `target`:

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

Направление все равно задает граф. В этом примере Effector читает `sessionChanged`, реагирует на `userSelected` и пишет в `userOpened`.

## Association

Fooled-юнитам нужна заранее созданная association между scope Virentia и scope Effector:

```ts
associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Когда юнит Virentia запускается внутри `scoped`, мост использует связанный scope Effector. Когда юнит Effector запускается внутри `allSettled`, `scopeBind`, `launch` или Provider, мост использует связанный scope Virentia.
