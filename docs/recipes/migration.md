# Migration notes

Do not replace `effector` imports globally.

Keep existing Effector code on the real package:

```ts
import { createEvent, createStore } from "effector";

export const effectorSubmitted = createEvent<string>();
export const $userId = createStore("").on(effectorSubmitted, (_, id) => id);
```

Write new Virentia code separately:

```ts
import { event, store } from "@virentia/core";
import { fool } from "@virentia/effector";

export const virentiaSubmitted = fool(event<{ id: string }>());
export const userId = store("");
```

Then connect the parts explicitly through a universal boundary unit:

```ts
import { sample } from "effector";

sample({
  clock: virentiaSubmitted,
  fn: ({ id }) => id,
  target: effectorSubmitted,
});
```

Create an association where both scopes are known:

```ts
import { associate } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

When Virentia code calls `virentiaSubmitted` inside `scoped(virentiaScope)`, the bridge uses the association to launch the Effector target in `effectorScope`. This lets you move models gradually. Effector libraries keep using real Effector, while Virentia models stay in their own scope.

## Effector operators

Use the result of `fool` when existing Effector code needs to read or call a Virentia unit:

```ts
sample({
  clock: effectorSubmitted,
  target: virentiaSubmitted,
});
```

You can also fool an Effector unit and listen to it from Virentia:

```ts
const effectorSaved = fool(createEvent<string>());

reaction({
  on: effectorSaved,
  run(id) {
    userId.value = id;
  },
});
```
