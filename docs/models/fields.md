---
title: Fields And Data
---

# Fields And Data

A field declares one typed value of an entity - and, at the same time, how that
value looks in JSON. Use `f.*` factories when entity data arrives from a server
and must return to it: the same declaration parses input, validates it, and
serializes back. There is no separate DTO layer to keep in sync.

Examples on this page run inside an active scope - see
[Model instances](./instances).

## Declaring Fields

```ts
const Todo = staticModel({
  data: {
    title: f.string(),
    done: f.boolean(false),
  },
});

const t = Todo.create({ title: "write docs" });

t.title.value; // "write docs"
t.done.value;  // false - the default
t.json();      // { id: "...", title: "write docs", done: false }
```

What happens:

- each field becomes a store on the instance (`t.title.value`);
- in the object form of `data` the JSON key equals the field name;
- a field with a default is optional in the input; without one it is required.

Missing required keys and wrong types fail before anything is written:

```ts
Todo.create({});             // Error: creating requires missing keys: title
Todo.create({ title: 42 });  // Error: invalid "title" - Expected string
```

## Dates

`f.date` holds a `Date` in the model and an ISO string in JSON:

```ts
const Task = staticModel({
  data: { due: f.date().optional() },
});

const task = Task.create({ due: "2026-08-08T10:00:00.000Z" });

task.due.value;  // Date instance
task.json().due; // "2026-08-08T10:00:00.000Z"
```

`.optional()` allows `null` both in the model and on the wire.

## Renaming JSON Keys

When the server key differs from the field name, use the function form of
`data`: it receives a props object, and each field binds explicitly.

```ts
import type { Props } from "@virentia/core/models";

const Todo = staticModel({
  data: (p: Props<{ name: string; is_done?: boolean }>) => ({
    title: f.string(p.name),              // JSON key "name"
    done: f.boolean(p.is_done.or(false)), // JSON key "is_done", default false
  }),
});

const t = Todo.create({ name: "write docs" });

t.title.value;  // "write docs"
t.json();       // { id: "...", name: "write docs", is_done: false }
```

`p.key` binds a required key, `p.key.or(default)` makes it optional with a
default.

## Local Fields

In the function form, a field that takes no `p.*` binding is local: it exists
on the instance but never appears in JSON and is not accepted by `add`.

```ts
const Todo = staticModel({
  data: (p: Props<{ name: string }>) => ({
    title: f.string(p.name),
    draft: f.string(""), // local - UI state, not data
  }),
});

const t = Todo.create({ name: "x" });

t.draft.value = "unsaved edit";
t.json(); // { id: "...", name: "x" } - no draft
```

## Transforms

`p.key.map(input, output)` converts between the JSON value and the model value:

```ts
data: (p: Props<{ tags: string }>) => ({
  tags: f.list(f.string(), p.tags.map(
    (wire) => wire.split(","),
    (value) => value.join(","),
  )),
}),
```

A one-way transform (only `input`) drops the field from `json()` with a
warning. If that is intended, mark it `p.key.inOnly()`.

A `.map` on a field takes over the whole conversion: it receives the raw wire
value, owns both directions, and schema validation of that key becomes the
map's responsibility.

## Composing Types

Any type assembles from `f.*`. Combinators compose conversions along with
schemas - `f.array(f.date())` holds `Date[]` in the model and ISO strings in
JSON, element by element:

```ts
const Track = staticModel({
  data: {
    marks: f.array(f.date(), []),
    meta: f.object({ due: f.date(), note: f.string() }),
    entry: f.tuple([f.string(), f.number()]),
    value: f.union([f.string(), f.number()]),
  },
});

const track = Track.create({
  marks: ["2026-08-08T10:00:00.000Z"],
  meta: { due: "2026-08-08T10:00:00.000Z", note: "hi" },
  entry: ["deploy", 1],
  value: "dark",
});

track.marks.value[0];       // Date
track.meta.value.due;       // Date
track.json().marks;         // ["2026-08-08T10:00:00.000Z"]
```

What happens:

- every combinator position accepts an `f.*` field or a raw TypeBox schema;
- nested conversions apply per element, per key, per tuple position;
- plain shapes allocate no conversion at all;
- `f.union`/`f.intersect`/`f.recursive` reject items with conversions (the
  branch to convert cannot be decided) - apply `.map` to the whole field
  instead.

Recursive values describe trees in one field:

```ts
outline: f.recursive<Node>((self) =>
  f.object({ label: f.string(), children: f.array(self) }),
),
```

## Contract

```ts
// scalars
f.string(default?)   f.number(default?)   f.integer(default?)
f.boolean(default?)  f.date(default?)     // ISO string in JSON
f.literal(value)     f.enum(values, default?)  // string and number literals
f.null(default?)     f.any(default?)      f.unknown(default?)

// combinators - items are f.* fields or raw TypeBox schemas
f.array(item, default?)        // f.list is an alias
f.tuple([a, b, ...], default?)
f.union([a, b, ...], default?)
f.intersect([a, b, ...], default?)
f.record(value, default?)
f.object(shapeOfFields | schema, default?)
f.recursive((self) => item, default?)
f.from(schema, default?)       // any TypeBox schema as a leaf

field.optional()      // null allowed in the model and in JSON
field.indexed()       // hash index for eq lookups
field.indexed("ord")  // ordered index for ranges and sorting
field.unique()        // a duplicate value is rejected at write
field.meta({ ... })   // format annotations merged into the schema options

fn<Signature>()       // behavior requirement for traits, not a field
f.arg(n)              // schema placeholder for parameterized traits
```

Field names must not collide with the instance API (`id`, `key`, `alive`,
`json`, `dispose`, `rebind`, ...) - such a declaration fails immediately.

## Common Cases

Use fields for:

- server entity attributes that must round-trip through JSON;
- values that queries filter and sort by - add `.indexed()`;
- secondary lookup keys - `.indexed().unique()` instead of a second id;
- UI-only state on an entity - a local field in the function form.

## Related

- [Traits](./traits) - sharing field declarations between models.
- [Queries and indexes](./queries) - what `.indexed()` changes.
- [Data in and out](./wire) - the full serialization story.
