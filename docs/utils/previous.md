# previous

A store that trails the source by one change: the value it had *before* the current one.

```ts
previous(source);        // Store<T | undefined>
previous(source, seed);  // Store<T | Seed>
```

On the first change the source's declaration initial becomes the previous value; before any change the store reads `undefined` — or the seed.

## Where did we come from

```ts
import { previous } from "@virentia/core/utils";

const route = store<Route>(homeRoute);
const cameFrom = previous(route); // Store<Route | undefined>

reaction({ on: closeClicked, run: () => {
  void navigateFx(cameFrom.value ?? homeRoute);
} });
```

"Back to where the user was" without threading the origin through every navigation call.

## Animation direction

Compare the previous index with the next one to slide left or right:

```ts
const activeTab = store(0);
const previousTab = previous(activeTab, 0); // seeded: no undefined in the type

const direction = computed(() => (activeTab.value > previousTab.value ? "right" : "left"));
```

## Reacting to the transition, not just the value

Some rules care about the *edge*: "status went from `pending` to `failed`", "user switched from silver to gold":

```ts
const previousPlan = previous(plan);

reaction({ on: plan, run: (next) => {
  if (previousPlan.value === "trial" && next === "paid") void celebrateFx();
} });
```

`previous`'s own subscription is created before your reaction here, so by the time your rule runs, `previousPlan` already holds the pre-change value — declare the operator before the rules that read it.

## When to reach for it

- Navigation origins, animation directions, transition-sensitive rules, one-step diffs.
- A seed (`previous(src, seed)`) when `undefined` is a legal value of the source and the type must not widen.

When not: for full history keep an array in a store; `previous` deliberately remembers exactly one step.

## Behaviour notes

- Memory is per scope: each scope trails its own writes.
- The trailing memory itself is not serialized; after SSR hydration the first client-side change falls back to the source's declaration initial as "previous".
- A `computed` source works, but it has no declaration initial — the first change leaves the seed in place instead.
