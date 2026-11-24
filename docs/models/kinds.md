---
title: Model Kinds
---

# Model Kinds

`model` and `staticModel` declare fields, traits, and relations the same way,
use scoped registries and expose the same instance surface. They
differ in one thing: when the units from `setup` are created. This page is
about that difference, and about when neither is the right tool and a plain
core [`owner`](/core/owners) is.

## `staticModel`: Units Once

A static model builds its reactive graph a single time. An instance is a
lightweight scope over the shared units - creating one writes field values,
nothing else:

```ts
const Todo = staticModel({
  data: { done: f.boolean(false) },
  setup(self) {
    const toggled = event<void>();

    reaction({
      on: toggled,
      run: () => {
        self.done.value = !self.done.value;
      },
    });

    return { toggled };
  },
});
```

`setup` runs once, at declaration. Every reaction still behaves per instance -
`await a.toggled()` flips only `a` - and the instance API on `self`
(`self.id`, `self.json()`) is available inside unit bodies, where a concrete
instance exists. Disposed instance scopes are pooled and reused.

Per-instance external resources still have a home:
[`self.onCleanup`](./instances#external-resources-oncleanup) from a unit body
ties an unsubscribe to the ambient instance - no store, no per-instance
units.

This is the default kind: a thousand list rows, feed entries, or table cells
per frame is a normal load.

## `model`: Units Per Instance

A dynamic model runs `setup` for every instance, and `setup` receives the
creation input as its second argument:

```ts
const ReportScreen = model({
  data: {
    period: f.string("month"),
    rows: f.array(f.number(), []).local(),
  },
  setup(self, props) {
    // this closure belongs to ONE instance - create whatever it needs
    const refresh = event<void>();
    const total = computed(() => self.rows.value.reduce((a, b) => a + b, 0));

    reaction({
      on: refresh,
      run: async () => {
        self.rows.value = await api.report(self.period.value, props.filters);
      },
    });

    return { refresh, total };
  },
});

const report = ReportScreen.create({ period: "week", filters: { team: 1 } });

await report.refresh();
report.total.value;
```

What happens:

- stores, events, computeds, and reactions are created for this instance and
  owned by it - `dispose()` tears them all down;
- `props` is the raw `create` input - keys that are not fields (like `filters`
  above) are visible to `setup` even though they are not stored;
- because each instance owns real units, `setup` may branch: create different
  reactions per instance, capture per-instance closures, hold resources.

The price is real allocations per instance. Use `model` for few, individual
entities: screens, editors, wizards, long-lived workspaces.

## Choosing Between Them

| | `staticModel` | `model` |
|---|---|---|
| Units | one shared graph | created in `setup` per instance |
| Instance cost | a scope and a value map | stores + reactions + an owner |
| `setup` runs | once, at declaration | on every `create` |
| `setup` arguments | `(self)` | `(self, props)` - the creation input |
| Per-instance closures | no - state lives in fields | yes |
| Pooling | disposed scopes are reused | no - disposal is a real teardown |
| Typical count | hundreds to thousands | a handful |

Everything else - fields, traits, relations, queries, serialization, `keep`
in bindings - is identical. Start with `staticModel`; switch to `model` when
an instance genuinely needs its own dynamically created units.

## And Plain `owner`?

For app-wide state that reuses an existing model description, use
[`Model.static()`](./instances#a-singleton-from-an-existing-model). Unlike the
`staticModel` kind, each call creates a new model with independent native units;
its values are still isolated per scope.

The core [`owner`](/core/owners) is the primitive underneath: a disposable
tree of units and resources. A dynamic model instance *is* an owner inside -
`model` adds the entity layer on top:

- a declaration: fields that validate input and serialize back;
- a scoped registry with creation, ID lookup, and merge semantics;
- relations with delete policies, queries with indexes, `rebind` and aliases.

Rule of thumb:

- a domain entity - something with data, an id, a place in lists - is a
  `model` or `staticModel`;
- an app subsystem - a socket manager, a player, a cache, a background
  process - is an `owner`: it has resources and lifetime, but no wire shape,
  no id, and nothing to query;
- if you find yourself giving an `owner` an id registry and a serializer, it
  wanted to be a `model`.

## Contract

```ts
model({
  with?, data?, name?,
  setup?(self, props): members | void,  // per instance; props is the create input
});

staticModel({
  with?, data?, name?,
  setup?(self): members | void,         // once; instance API in unit bodies only
});
```

Both expose `create`, `get`, `instances`, and LINQ queries, and work with traits, relations, unions, and bindings.

## Common Cases

- List rows, feed items, table cells - `staticModel`.
- Screens and editors with per-instance wiring - `model`, often with
  [`keep`](./bindings#keeping-state-across-unmounts-keep).
- Domain entities shared by both worlds - either kind; the surface is the
  same, so switching later is a one-word change.
- Non-entity subsystems - core `owner`, not a model at all.

## Related

- [Model instances](./instances) - the shared instance surface.
- [Owners and cleanup](/core/owners) - the primitive underneath.
- [UI bindings](./bindings) - screen models and `keep`.
