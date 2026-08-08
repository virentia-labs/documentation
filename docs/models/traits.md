---
title: Traits
---

# Traits

A trait is a reusable slice of a model: fields, behavior, and the units that
connect them. Use it when several models share the same piece - timestamps,
selection, soft delete - and copying the declaration into each model would
drift apart.

A trait is identified by its object reference. There are no string names to
register or collide.

Examples on this page run inside an active scope - see
[Collections and instances](./instances).

## Sharing Fields

The simplest trait only declares data. Every model that lists it in `with`
gets the fields as its own:

```ts
const Timestamped = trait({
  data: { createdAt: f.date().indexed("ord") },
});

const Post = staticModel({
  with: [Timestamped],
  data: { title: f.string() },
});

const post = collection(Post).add({
  title: "hello",
  createdAt: "2026-08-08T10:00:00.000Z",
});

post.createdAt.value; // Date - a regular field of Post
```

## Requiring Fields And Behavior

A trait can also demand things from the model instead of declaring them.
`requires` takes field schemas ("the model must declare this field") and
`fn<...>()` signatures ("some setup must return this function"). The trait's
`setup` uses both through `self`:

```ts
const Selectable = trait({
  requires: {
    selected: f.boolean(),
    canSelect: fn<() => boolean>(),
  },
  setup(self) {
    const toggle = event<void>();

    reaction({
      on: toggle,
      run: () => {
        if (!self.canSelect()) return;
        self.selected.value = !self.selected.value;
      },
    });

    return { toggle };
  },
});

const Todo = staticModel({
  with: [Selectable],
  data: {
    title: f.string(),
    selected: f.boolean(false),     // closes the field requirement
  },
  setup() {
    return { canSelect: () => true }; // closes the behavior requirement
  },
});

const t = collection(Todo).add({ title: "x" });

await t.toggle();   // the trait's event, available on the instance
t.selected.value;   // true
```

What happens:

- everything a trait declares or returns flows into `self` and onto the
  instance - there is no separate "trait namespace";
- a field requirement left undeclared fails at model declaration;
- a behavior requirement left unimplemented fails after all setups run.

## The Rule Of Names

Any number of participants may require a name; exactly one may declare it. Two
declarations - by two traits, by a trait and the model, by two setup returns -
fail immediately:

```ts
const A = trait({ data: { count: f.number(0) } });
const B = trait({ data: { count: f.number(0) } });

staticModel({ with: [A, B] });
// Error: declaration collision on "count" - exactly one may declare
```

This keeps composition readable: for every member there is exactly one place
that defines it.

## Generic Code Over Instances

`Impl<typeof Trait>` types "any instance whose model implements the trait":

```ts
import type { Impl } from "@virentia/core/models";

function selectAll<M extends Impl<typeof Selectable>>(items: readonly M[]) {
  for (const item of items) {
    if (item.canSelect()) item.toggle();
  }
}

selectAll(collection(Todo).items); // ok
selectAll(collection(User).items); // compile error - User does not implement it
```

## Parameterized Traits

`f.arg(n)` leaves a hole in a field schema; applying the trait fills it. The
applied trait keeps the original's identity - both models below implement
`Keyed`:

```ts
const Keyed = trait({
  data: { code: f.arg(0) },
});

const Product = staticModel({ with: [Keyed(f.string())], data: {} });
const Slot = staticModel({ with: [Keyed(f.number(0))], data: {} });
```

## Contract

```ts
function trait(config: {
  with?: readonly Trait[];
  requires?: Record<string, Field | FnRequirement>;
  data?: DataDeclaration;              // same forms as a model's data
  setup?: (self) => members | void;
}): Trait;

type Impl<T extends Trait>; // instance-side constraint for generic code
```

A trait composed through several paths (`with` chains) is applied once.

## Common Cases

Use traits for:

- shared server fields: timestamps, authorship, versioning;
- shared behavior over model-specific data: selection, expansion, dirty
  tracking;
- the base of [union common members](./unions#shared-fields) - only
  trait-provided fields are shared across variants;
- domain vocabularies: one trait per capability, models compose what they
  support.

## Related

- [Fields and data](./fields) - what `data` and `requires` accept.
- [Unions](./unions) - why shared fields must come from one trait.
- [Collections and instances](./instances) - how `setup` and `self` behave.
