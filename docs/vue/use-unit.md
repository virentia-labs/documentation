# useUnit

`useUnit` is the bridge between a core model and a Vue component. It reads stores as refs and binds events and effects as callables — all against the scope from the nearest [`ScopeProvider`](/vue/#scope-provider) (or `provideScope`). A component re-renders when a store it read changes **in that scope**.

Stores come back as refs; events and effects come back as callables. Pass a single unit, an array, or an object; the shape of the result mirrors the input.

## A single store

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
```

The ref updates when that store changes in the active scope, so the component re-renders — and only for that scope, so the same component under a different `ScopeProvider` renders that scope's value. Use `count.value` in script, `{{ count }}` in templates (it auto-unwraps).

## An event or effect

The returned function is bound to the scope, so calling it dispatches into the right scope with no extra wiring.

```ts
const incremented = useUnit(counter.incremented);
```

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

An effect is called the same way and returns a promise.

## Several units at once

Pass an **object** to read a group of units in one call. Destructure so each ref and callable is a top-level binding (refs unwrap in the template).

```ts
const { count, incremented, reset } = useUnit({
  count: counter.count,
  incremented: counter.incremented,
  reset: counter.reset,
});
```

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

Or an **array**, when positional binding reads better:

```ts
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Custom shapes with `@@shape`

`useUnit` reads a plain record of units without any help. The `@@shape` property is for the case where the object also carries **non-units** — helper methods, config, private fields — and you want `useUnit` to bind only some of it. The object declares its bindable units through `@@shape`, and `useUnit` binds through that declaration instead of iterating every key, so the rest is left untouched.

Build such an object **once** — in a model factory or at module scope — never in a setup, since its units must be stable:

```ts
import { SHAPE, useUnit } from "@virentia/vue";

function createCounter() {
  const count = store(0);
  const incremented = event<number>();
  reaction({ on: incremented, run: (n) => (count.value += n) });

  return {
    count,
    incremented,
    isZero: () => count.value === 0, // a method, not a unit
    [SHAPE]: { count, incremented }, // bind only the units
  };
}

const counter = createCounter();

// In setup: `isZero` is not bound, only the declared units are. `count` is a ref.
const { count, incremented } = useUnit(counter);
```

The declaration is usually the shape object directly. It may also be a **function** returning the shape, for when the shape is derived from the object itself:

```ts
const source = {
  count,
  [SHAPE]() {
    return { count: this.count };
  },
};
```

Shapes **nest to any depth**: a member of a shape may itself be a bare record of units or another `@@shape` source, and `useUnit` resolves the whole tree in one call — stores at every level come back as refs.

```ts
const dashboard = {
  [SHAPE]: {
    header: { title: header.title }, // bare nested record
    counter: createCounter(), // nested @@shape source
  },
};

const { header, counter } = useUnit(dashboard);
// header.title.value, counter.count.value, counter.incremented(1)
```

The same protocol applies to a model field read through `useModel` or `component`: a field that declares `@@shape` reaches the view as its bound units, and the marker never leaks. See [Nested models with `@@shape`](/vue/models#nested-models-with-shape).

## Effects and pending state

`effect.pending` is a store, so it becomes a ref. It publishes immediately — outside the transaction — so the button disables the instant the effect starts.

```vue
<script setup lang="ts">
const { save, pending } = useUnit({
  save: saveFx,
  pending: saveFx.pending,
});
</script>

<template>
  <button :disabled="pending" @click="save(values)">Save</button>
</template>
```

The same works for `effect.failData` (last error), `effect.inFlight` (number of running calls), and the other [effect units](/core/effects).

## Reading a slice of a store

`useUnit(store)` updates whenever that store changes. When a component needs only part of a larger store, subscribe to a **derived store** so the ref updates only when that part changes.

```ts
const fullName = useUnit(userSlice);
// where, defined once next to the model:
const userSlice = user.map((u) => `${u.first} ${u.last}`);
```

Define the derived store **once** — next to the model — so it is stable. Creating `user.map(...)` inside `setup` on a value that changes would make a new store each time.

For values that combine several stores or do heavier work, use `computed`:

```ts
const total = useUnit(cartTotal);
const cartTotal = computed(() => cart.value.items.reduce((sum, i) => sum + i.price, 0));
```

## Mutable stores

A [mutable store](/mutable/) works with `useUnit` like any store — but `useUnit(store)` reads the whole value, so the ref updates on every commit. To update only when a slice changes, subscribe to that slice through `map` or `computed`:

```ts
const cart = mutableStore({ items: [] as Item[], coupon: null as string | null });
const couponStore = cart.map((c) => c.coupon);

const coupon = useUnit(couponStore);
// `coupon.value` changes only when the coupon changes — `cart.value.items.push(...)` leaves it.
```

The mutable draft tracks reads by keypath, so the derived store subscribes only to the parts its selector read. See [Granular reactivity](/mutable/#granular-reactivity).

## `useUnit` vs `useModel`

`useUnit` binds units you already have. When the state itself belongs to the component — created from props and disposed on unmount — reach for [`useModel` or `component`](/vue/models), which build the model and then unwrap it the same way `useUnit` does.
