---
title: UI Bindings
---

# UI Bindings

Queries, instances, and model definitions plug into the existing `useModel`
and `component` from `@virentia/react` and `@virentia/vue` - there are no new
hooks to learn. Use these bindings to render collections directly: the
component subscribes to exactly what it shows.

## A Query In A Component

The list subscribes to the query; each row subscribes to its own instance:

```tsx
import { scoped } from "@virentia/core";
import { useModel, useProvidedScope } from "@virentia/react";

function TodoRow({ todo }: { todo: InstanceOf<typeof Todo> }) {
  const t = useModel(todo);

  if (!t) return null;

  return <li>{t.title.value}</li>;
}

function ActiveTodos() {
  const appScope = useProvidedScope();
  const active = useModel(scoped(appScope, () =>
    Todo.where(Todo.done.eq(false)).sort(Todo.priority.desc).take(50),
  ));

  return (
    <ul>
      {active.items.map((t) => (
        <TodoRow key={t.key} todo={t} />
      ))}
    </ul>
  );
}
```

What happens:

- rebuilding the chain every render is free - plans are interned, results
  memoized;
- the list re-renders only when the result set changes; a row re-renders only
  on its own instance's writes - renaming one todo touches one row, not the
  list;
- `t.key` is the [stable list key](./wire#stable-list-keys) - no remounts on
  `rebind`, no glued rows on reuse.

In Vue the same calls return refs: `active.value.items`, `t.value.title.value`.

## An Instance By Id

```tsx
function TodoScreen({ id }: { id: string }) {
  const appScope = useProvidedScope();
  const todo = useModel(scoped(appScope, () => Todo.get(id)));

  if (!todo) return <NotFound />;

  return <h1>{todo.title.value}</h1>;
}
```

`get(id)` follows the instance's own writes, resolves old ids after
[`rebind`](./wire#changing-an-id-rebind) - a route holding the temporary id
keeps working - and yields `null` when the entity is missing or disposed.
Nothing throws mid-render.

## Screen Models

A model definition is a scoped `props → instance` factory, so screen-model signatures accept it directly:

```tsx
const OrderView = component({ model: OrderScreen, view: OrderLayout });

// or imperatively:
const order = useModel(OrderScreen, { orderId });
```

What happens:

- the instance is created in the provided scope - an ordinary `add`;
- prop changes merge into the instance (present keys win);
- unmount disposes the instance;
- `component.create()` returns a controlled instance the view never disposes -
  the creator owns it.

## Keeping State Across Unmounts: `keep`

```tsx
useModel(SettingsScreen, props, { keep: true });
// component({ model: SettingsScreen, view, keep: true })
```

`keep` changes one thing: unmount no longer disposes. A remount finds the
instance again and merges the current props; life ends with an explicit
`remove` or the scope.

Who the remount finds:

- no `id` in props - the model's single instance in the scope (settings, the
  only form). Several live instances make that ambiguous - a dev error, not a
  silent pick;
- an `id` in props - the instance with that id (tabs, master-detail, the id
  comes from a route or document).

There is no `cache`/`key` option for models - the model's registry already is the
cache, `keep` just leaves the instance in it.

## Inspector

Collections show up in the inspector aggregated - entity counts, index sizes,
query plans - instead of one entry per instance. A thousand list rows is a
workload, not a thousand devtools scopes.

## Contract

```ts
// React and Vue, same shapes; Vue returns refs
useModel(query): query;                       // live query view
useModel(scoped(appScope, () => Todo.get(id))): Instance | null; // entity view
useModel(Definition, props?, { keep? }): Instance | null;

component({ model: Definition, view, keep?, mapProps? });
Component.create(props): Instance;             // controlled instance
```

## Common Cases

Use the bindings for:

- list screens - a query built inline, rows keyed by `t.key`;
- detail screens - `useModel(scoped(appScope, () => Todo.get(id)))` with a `null` fallback;
- screen state that survives tab switches - `keep: true`;
- parent-owned dialogs and editors - `component.create()`.

## Related

- [Queries and indexes](./queries) - why inline chains are free.
- [Data in and out](./wire) - `rebind`, forwarding, stable keys.
- [React models](/react/models) and [Vue models](/vue/models) - the
  framework-side details.
