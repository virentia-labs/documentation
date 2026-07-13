# useUnit

`useUnit` is the bridge between a core model and a React component. It reads stores as plain values and binds events and effects as callables — all against the scope from the nearest [`ScopeProvider`](/react/#scope-provider). A component re-renders when a store it read changes **in that scope**.

Pass a single unit, an array, or an object; the shape of the result mirrors the input.

## A single store

```tsx
const count = useUnit(model.count);
```

`count` is the store's value in the active scope. The component re-renders when `model.count` changes there — and only there, so the same component under a different `ScopeProvider` renders that scope's value. This is what lets one component tree serve many isolated states (per request on the server, per test, per cached screen).

## An event or effect

Events and effects come back as functions already bound to the scope, so calling one dispatches into the right scope with no extra wiring.

```tsx
const incremented = useUnit(model.incremented);

return <button onClick={() => incremented(1)}>{count}</button>;
```

An effect is called the same way and returns a promise. Never call a bare unit from an event handler without binding it first — an unbound call has no scope.

## Several units at once

Pass an **object** to read a group of units in one call. Stores become values, callables become functions.

```tsx
const model = useUnit({
  count: counter.count,
  incremented: counter.incremented,
  reset: counter.reset,
});

return <button onClick={() => model.incremented(1)}>{model.count}</button>;
```

Or an **array**, when positional binding reads better:

```tsx
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Custom shapes with `@@shape`

`useUnit` reads a plain record of units without any help. The `@@shape` property is for the case where the object also carries **non-units** — helper methods, config, private fields — and you want `useUnit` to bind only some of it. The object declares its bindable units through `@@shape`, and `useUnit` binds through that declaration instead of iterating every key, so the rest is left untouched.

Build such an object **once** — in a model factory or at module scope — never in a render, since its units must be stable:

```tsx
import { SHAPE, useUnit } from "@virentia/react";

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

// In the component: `isZero` is not bound, only the declared units are.
const { count, incremented } = useUnit(counter);
```

The declaration is usually the shape object directly. It may also be a **function** returning the shape, for when the shape is derived from the object itself:

```tsx
const source = {
  count,
  [SHAPE]() {
    return { count: this.count };
  },
};
```

Shapes **nest to any depth**: a member of a shape may itself be a bare record of units or another `@@shape` source, and `useUnit` resolves the whole tree in one call.

```tsx
const dashboard = {
  [SHAPE]: {
    header: { title: header.title }, // bare nested record
    counter: createCounter(), // nested @@shape source
  },
};

const { header, counter } = useUnit(dashboard);
// header.title, counter.count, counter.incremented(1)
```

The same protocol applies to a model field read through `useModel` or `component`: a field that declares `@@shape` reaches the view as its bound units, and the marker never leaks. See [Nested models with `@@shape`](/react/models#nested-models-with-shape).

## Effects and pending state

`effect.pending` is a store, so read it alongside the effect to drive loading UI. It publishes immediately — outside the transaction — so the button disables the instant the effect starts.

```tsx
const { save, pending } = useUnit({
  save: saveFx,
  pending: saveFx.pending,
});

return (
  <button disabled={pending} onClick={() => save(values)}>
    Save
  </button>
);
```

The same works for `effect.failData` (last error), `effect.inFlight` (number of running calls), and the other [effect units](/core/effects).

## Reading a slice of a store

`useUnit(store)` re-renders whenever that store changes. When a component needs only part of a larger store, subscribe to a **derived store** so it re-renders only when that part changes.

```tsx
const fullName = useUnit(userSlice);
// where, defined once next to the model:
const userSlice = user.map((u) => `${u.first} ${u.last}`);
```

Define the derived store **once** — next to the model, or with `useMemo` — so it is stable across renders. Creating `user.map(...)` inline on every render makes a new store and a new subscription each time.

For values that combine several stores or do heavier work, use `computed`:

```tsx
const total = useUnit(cartTotal);
const cartTotal = computed(() => cart.value.items.reduce((sum, i) => sum + i.price, 0));
```

## Mutable stores

A [mutable store](/mutable/) works with `useUnit` like any store — but `useUnit(store)` reads the whole value, so the component re-renders on every commit. To re-render only when a slice changes, subscribe to that slice through `map` or `computed`:

```tsx
const cart = mutableStore({ items: [] as Item[], coupon: null as string | null });
const couponStore = cart.map((c) => c.coupon);

function Coupon() {
  const coupon = useUnit(couponStore);
  // Re-renders only when `coupon` changes — `cart.value.items.push(...)` does not.
  return <span>{coupon ?? "no coupon"}</span>;
}
```

The mutable draft tracks reads by keypath, so the derived store subscribes only to the parts its selector read. See [Granular reactivity](/mutable/#granular-reactivity).

## `useUnit` vs `useModel`

`useUnit` binds units you already have. When the state itself belongs to the component — created from props and disposed on unmount — reach for [`useModel` or `component`](/react/models), which build the model and then unwrap it the same way `useUnit` does.
