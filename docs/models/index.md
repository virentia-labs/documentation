---
title: Models
---

# Models

`@virentia/core/models` is a model layer for domain entities. An entity is
described once as fields, relations, and behavior; loading from the server,
searching, editing, and serializing back all use that one description.

Use it when the app works with lists of server entities: todos, orders,
documents, feed items. The layer removes the usual glue code - manual mapping
between JSON and stores, id bookkeeping for related entities, and hand-written
filtering over arrays.

## Install

Models ship inside the core package as a subpath. Field schemas are powered
by TypeBox, declared as an optional peer - only apps that import the models
subpath install it:

```sh
pnpm add @virentia/core @sinclair/typebox
```

```ts
import { collection, f, staticModel } from "@virentia/core/models";
```

Apps that never import `@virentia/core/models` skip `@sinclair/typebox`
entirely - nothing is installed or bundled for them.

## How The Section Is Structured

| Pattern                                    | Use it when                                                        |
| ------------------------------------------ | ------------------------------------------------------------------ |
| [Fields and data](./fields)                | An entity has typed fields that arrive from and return to JSON.    |
| [Traits](./traits)                         | Several models share fields and behavior.                          |
| [Collections and instances](./instances)   | Entities need a home: creation, merging, lifecycle.                |
| [Model kinds](./kinds)                     | Choosing between `staticModel`, `model`, and a plain `owner`.      |
| [Relations](./relations)                   | Entities reference other entities or own child entities.           |
| [Queries and indexes](./queries)           | Lists need filtering, sorting, and fast lookups.                   |
| [Unions](./unions)                         | One list mixes entities of different models.                       |
| [Data in and out](./wire)                  | Instances must serialize back, ids come from the server later.     |
| [UI bindings](./bindings)                  | Components should render queries and instances directly.           |

## First Model

Describe the entity, create a collection in a scope, load JSON, query, and
serialize back.

```ts
import { scope, scoped } from "@virentia/core";
import { collection, f, staticModel } from "@virentia/core/models";

const Todo = staticModel({
  data: {
    title: f.string(),
    done: f.boolean(false).indexed(),
  },
});

const appScope = scope();

scoped(appScope, () => {
  const todos = collection(Todo);

  todos.add([
    { id: "1", title: "write docs" },
    { id: "2", title: "ship release", done: true },
  ]);

  todos.count;                              // 2
  todos.where(Todo.done.eq(false)).ids;     // ["1"]

  const first = todos.get("1")!;

  first.done.value = true;
  todos.where(Todo.done.eq(false)).count;   // 0

  first.json(); // { id: "1", title: "write docs", done: true }
});
```

What happens:

- `staticModel` declares the entity once; `Todo.done` is a field descriptor
  usable in queries;
- `collection(Todo)` is get-or-create per scope - the same call returns the
  same collection, different scopes hold independent data;
- `add` validates the JSON and creates instances; a known id merges instead of
  duplicating;
- `first.done.value` is a regular store write - the index and every query
  update immediately;
- `json()` serializes through the same field declarations that parsed the
  input.

## `model` And `staticModel`

Both kinds declare fields, traits, and relations the same way and are used the
same way. They differ in how instances are built:

- `staticModel` creates units once and shares them; an instance is a cheap
  scope over shared units. Use it for numerous, uniform entities - list items,
  feed entries, table rows.
- `model` runs `setup` per instance and may create units dynamically. Use it
  for few, individual entities - screens, editors, long-lived workspaces.

When in doubt, start with `staticModel`. The full comparison - including when
a plain core `owner` is the better tool than any model - is on
[Model kinds](./kinds).

## Related

- [Fields and data](./fields) - how `f.*` declarations describe both storage and JSON.
- [Collections and instances](./instances) - the collection API and instance lifecycle.
- [UI bindings](./bindings) - rendering queries and instances in React and Vue.
