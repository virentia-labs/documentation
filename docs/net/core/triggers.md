# Triggers

A trigger runs a query or mutation when a Virentia unit fires. Since a query *is* an effect, this is just a `reaction` that calls it — but `trigger()` handles payload mapping, filtering, and owner cleanup for you.

```ts
import { trigger } from "@virentia/net-core";

trigger(userQuery, {
  on: userRoute.opened,
  params: () => ({ id: userRoute.params.value.id }),
});
```

## Binding

- `on` — any Virentia unit (event, effect lifecycle unit, store), or an array of them.
- `params?` — maps the payload into the query's input. Omit to forward the payload as-is.
- `filter?` — run only when it returns `true`.

`params` may **ignore the payload** and read reactive state instead — the `() => ({ id: userRoute.params.value.id })` form above reads the route's current param at the moment the trigger fires.

```ts
trigger(searchQuery, {
  on: queryChanged,
  filter: (text: string) => text.trim().length > 2,
  params: (text: string) => ({ q: text }),
});
```

A query can have any number of independent triggers — different events, different mappings:

```ts
trigger(feedQuery, { on: route.opened });
trigger(feedQuery, { on: pullToRefresh });
```

## Inline binding

`config.trigger` on `query`/`mutation` is `trigger()` applied at creation. Pass one binding or an array:

```ts
const pingQuery = query({
  handler: async (msg: string) => api.ping(msg),
  trigger: { on: ping },
});
```

## Cleanup

`trigger()` returns an unsubscribe function. Called inside an [owner](/core/owners), it also registers cleanup, so the binding is removed when the owner is disposed.

```ts
const stop = trigger(userQuery, { on: userRoute.opened });
stop(); // later
```
