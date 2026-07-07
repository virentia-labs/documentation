---
title: Array field
---

# Array field

An array field — `createArrayField(...)` in the schema — is an ordered list of
repeated items (see [Array fields](../array-fields)). After
`formToEffector` it lives at `model.fields.<name>` not as a leaf lens node but as
a **collection lens**: a keyed projection over the item instances, keyed by a
**stable id**. The form stays the single source of truth; the lens reads,
narrows, dispatches to, and deletes items — it never re-implements the list.

Everything here assumes an association and a scope in the current run — see
[Overview → Associate the scopes](./#associate-the-scopes). The bridge does not
invent a scope; trigger inside one.

```ts
import { createArrayField, createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const form = createForm({
  schema: {
    phones: createArrayField<string>([""]),
  },
});

const model = formToEffector(form);
```

## Item actions, aggregated

Below the collection lens, an item exposes the same surface as a plain
[field](./field): its stores are watchable (`.clock()`), its methods targetable
(`.target()`). Read or driven from the collection lens directly, those actions
are **aggregated across every currently matched instance**.

```ts
// Fires when *any* phone's value updates.
model.fields.phones.state.clock();          // Event<string>

// Dispatches to *every* phone instance.
model.fields.phones.change.target();        // EventCallable<string>
```

For a composite item (a shape or group per row) navigate into the item's shape
first, then pick the leaf unit:

```ts
// model.fields.rows === createArrayField(..., createItem: row shape)
model.fields.rows.address.city.state.clock();
model.fields.rows.address.city.change.target();
```

The `.clock()` / `.target()` terminals only appear once you have navigated to a
leaf; at the root of the collection lens there is nothing to aggregate yet — use
the selection operators there instead.

## Narrowing to instances

Aggregating over the whole list is rarely what you want. The selection operators
mirror the `@effector-kit/models` lens and each return a **narrowed lens** of the
same shape, so you keep chaining item actions off the result.

```ts
// By stable id.
model.fields.phones.ids("0").state.clock();
model.fields.phones.ids("0", "2").change.target();

// By predicate over each instance's data (+ its id).
model.fields.phones.where((p) => !p.value).change.target();

// To exactly one instance.
model.fields.phones.first().state.clock();
model.fields.phones.last().state.clock();
model.fields.phones.single().state.clock(); // matches only when there is one
```

`where` receives the instance's data plus its `id`. For a **primitive** item the
data is `{ value, id }`; for a **composite** item it is the item's value object
plus `id`:

```ts
model.fields.phones.where((p) => p.value.startsWith("+7"));   // { value, id }
model.fields.rows.where((r) => r.quantity > 0);               // { title, quantity, id }
```

## Dispatching to matched items

Once narrowed, `.target()` dispatches the payload into every matched instance —
`sample` into it or call it imperatively inside a scope.

```ts
import { createEvent, sample } from "effector";

// Blank out one specific row.
sample({ clock: cleared, target: model.fields.phones.ids("0").change.target() });

// Re-validate every empty phone.
model.fields.phones.where((p) => !p.value).validate.target();
```

## Deleting matched items

`.delete()` returns an `EventCallable<void>` that removes **all currently
matched** instances. It is the one structural operation the lens owns.

```ts
import { sample } from "effector";

// Drop every empty phone when the user submits.
const removeEmpty = model.fields.phones.where((p) => !p.value).delete();
sample({ clock: pruneClicked, target: removeEmpty });
```

Inspect what a narrowed lens currently matches with `.getSource()` — the matched
instances keyed by their stable id:

```ts
model.fields.phones.where((p) => !p.value).getSource();
// { "1": { value: "", id: "1" }, "3": { value: "", id: "3" } }
```

## Stable ids

Each item is assigned a stable id the first time it is seen, in creation order —
`"0"`, `"1"`, `"2"`, … The id is bound to the item **instance**, not its
position, so it survives `move`, `swap`, and `remove`: a lens narrowed with
`.ids("0")` keeps pointing at the same item after the list is reordered, and new
items get fresh ids rather than reusing freed ones.

```ts
// phones = ["a", "b"]  ->  ids "0", "1"
await scoped(vScope, () => form.fields.phones.swap(0, 1));
// phones = ["b", "a"]  ->  ids still "0" (=> "a"), "1" (=> "b")

model.fields.phones.ids("0").state.clock(); // still tracks "a"
```

## Adding items

The collection lens covers reading, narrowing, dispatching, and **deleting**.
Structural *add* operations (`push` / `unshift` / `insert`) are not on the lens —
run them on the Virentia array field itself, inside the associated scope, or
bridge a dedicated effect:

```ts
import { scoped } from "@virentia/core";

// Directly, in the Virentia scope of the current run.
await scoped(vScope, () => form.fields.phones.push(""));
```

Once added, the new item flows into the lens automatically — its stores show up
in aggregate `.clock()`s and it is picked up by `where` / `getSource`.

## Next

- [Shape field](./shape-field) — a collection lens over a dynamic-key object
  instead of an ordered list.
- [Recipes](./recipes) — submit wiring, backend errors, and mirroring in one
  place.
