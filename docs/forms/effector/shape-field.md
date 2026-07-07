---
title: Shape field
---

# Shape field

A [shape field](../shape-fields) — `createShapeField(...)` in the schema —
is a dynamic-key object: one field value backed by a set of child fields whose
keys are decided at runtime. After `formToEffector`, it lives at
`model.fields.<name>` as a **collection lens** — the exact same operator surface
as an [array field](./array-field), but keyed by the **child key itself**. The
key _is_ the stable id.

That is the one difference to keep in mind:

- an array field is keyed by an assigned stable id that survives
  `move` / `swap` / `remove`;
- a shape field is keyed by its string key (`"theme"`, `"avatarUrl"`, …), so the
  id you pass to `ids(...)` and read back on `where`'s `data.id` is just the key.

Everything else — `ids`, `where`, `first` / `last` / `single`, `delete`,
`getSource`, `props`, and the item api aggregated across matched children — is the
collection lens described in the [Overview](./#nested-units-the-lens). This page
assumes an association and a scope in the current run; see
[Overview → Associate the scopes](./#associate-the-scopes). The bridge does not
invent a scope; trigger inside one.

```ts
import { createField, createForm, createShapeField } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const attributes = createShapeField({ theme: createField("dark") });

const form = createForm({ schema: { attributes } });
const model = formToEffector(form);
```

`model.fields.attributes` is now a lens over the children keyed by their key.

## Narrow by key

`ids(...)` picks children by key. Because the key is the id, this is how you
reach a single named child and drive its units. The item api is aggregated over
the matched children, so `model.fields.attributes.state.clock()` fires for
_every_ child, while narrowing first scopes it to one.

```ts
import { createEvent, sample } from "effector";

// Watch one child's value.
model.fields.attributes.ids("theme").state.clock(); // Event<string>

// Drive one child's `change`.
const themePicked = createEvent<string>();
sample({
  clock: themePicked,
  target: model.fields.attributes.ids("theme").change.target(),
});
```

Leave `ids` off to fan out across the whole shape:

```ts
// One clock that fires whenever any child's value changes.
model.fields.attributes.state.clock().watch((value) => {
  console.log("some attribute changed to", value);
});
```

## Filter and read

`where` receives each child's data plus its `id` (the key). For a primitive
child the data is `{ value, id }`; for a composite child it is the child's value
object with `id` merged in. Use it to select children by their content rather
than by an exact key.

```ts
// Every child whose value is still empty.
const empties = model.fields.attributes.where(
  (data) => data.value === "",
);

empties.state.clock().watch((value) => console.log("empty child ->", value));
```

`getSource()` reads the currently matched children keyed by their key — a plain
snapshot, taken outside any ambient scope:

```ts
model.fields.attributes.ids("theme", "avatarUrl").getSource();
// { theme: <field>, avatarUrl: <field> }
```

`delete()` is the one structural change the lens exposes: it returns an
`EventCallable<void>` that removes every currently matched child.

```ts
import { sample } from "effector";

// Drop all empty children on submit.
sample({
  clock: model.submit,
  target: model.fields.attributes.where((data) => data.value === "").delete(),
});
```

## Adding and removing keys

`delete()` aside, structural changes are **not** on the lens. Adding a key,
replacing a child, or clearing the shape are methods on the Virentia shape field
(`add`, `remove`, `replace`, `clear`) — the lens is a read/drive projection, not
a schema editor. Hold the field reference and run the method inside the Virentia
scope with `scoped`:

```ts
import { scoped } from "@virentia/core";
import { createField } from "@virentia/forms";

// `attributes` is the createShapeField(...) instance from above.
await scoped(vScope, () =>
  attributes.add({ key: "avatarUrl", field: createField("") }),
);
```

Once the key exists, the new child is picked up by the lens automatically —
`model.fields.attributes.ids("avatarUrl").change.target()` drives it, and any
already-declared `clock()` re-subscribes as membership changes. If you prefer to
stay in the Effector graph, wrap the same call in an effect bound to `vScope`.

## Next

- [Custom field](./custom-field) — a shape field nested inside a composite field,
  and how its units surface.
- [Recipes](./recipes) — submit wiring, backend errors, and mirroring in one place.
