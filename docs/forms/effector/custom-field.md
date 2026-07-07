---
title: Custom field
---

# Custom field

A custom (or composite) field is not a special node to the bridge. It is a
`FieldContract` — the structural shape every field satisfies (see
[Custom fields](../custom-fields)) — so `formToEffector` projects it the
same way it projects a primitive [field](./field): each unit the contract
exposes becomes a lens node with **unit actions**.

- Its stores (`state`, `errors`, `isValid`, `isValidationPending`, …) are
  read-only, so they become **watchable** — `.clock(): Event<T>`.
- Its callable units — `fill`, `reset`, and any custom events or effects it
  exposes — become **targetable** — `.clock()` _and_ `.target(map?)`.

Plain methods that are not Virentia units (`read`, `serialize`, `kind`) are not
units, so they drop out of the lens. Nothing here re-implements the field; the
lens reads and forwards, and the Virentia form stays the single source of truth.

Everything below assumes an association and a scope in the current run — see
[Overview → Associate the scopes](./#associate-the-scopes). The bridge does not
invent a scope; trigger inside one.

## A composite field in a form

Take the money field from the forms guide — an `amount` plus a `currency`,
presented to the form as one `Money` value. The one detail that matters for the
bridge is `readFields()`: it hands its inner fields to the outside world.

```ts
import { computed } from "@virentia/core";
import { createField, defineField, type FieldContract } from "@virentia/forms";

interface Money {
  amount: number;
  currency: "USD" | "EUR";
}

function createMoneyField(initial: Money): FieldContract<Money> {
  const amount = createField(initial.amount, {
    validate(value) {
      return value >= 0 ? null : "Amount cannot be negative";
    },
  });
  const currency = createField(initial.currency);

  return defineField({
    kind: "money",
    state: computed(() => ({
      amount: amount.state.value,
      currency: currency.state.value,
    })),
    read() {
      return { amount: amount.read(), currency: currency.read() };
    },
    readFields() {
      return { amount, currency };
    },
    async fill(next) {
      await Promise.all([amount.fill(next.amount), currency.fill(next.currency)]);
    },
    async reset() {
      await Promise.all([amount.reset(), currency.reset()]);
    },
  });
}
```

Drop it into a form and convert as usual:

```ts
import { createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const invoice = createForm({
  schema: {
    title: createField(""),
    price: createMoneyField({ amount: 0, currency: "USD" }),
  },
});

const model = formToEffector(invoice);
```

## Its own units

At `model.fields.price` you get the money field's own contract, projected like
any field. Its `state` store is watchable; `fill` and `reset` are targetable:

```ts
model.fields.price.state.clock();   // Event<Money>
model.fields.price.fill.target();   // EventCallable<Money>
model.fields.price.reset.target();  // EventCallable<void>
```

If the field exposes custom events or effects — say a `round` event or a
`convert` effect — they show up here too, watchable or targetable by their kind,
exactly like the primitive lifecycle units on a [field](./field).

## Navigating into inner fields

Because the money field exposes `readFields()`, the lens can descend into its
children. Navigate by child key, then pick the leaf unit — the same units a
plain field has:

```ts
// Watch one inner field.
model.fields.price.amount.state.clock();     // Event<number>
model.fields.price.amount.error.clock();     // Event<FieldError>

// Drive one inner field.
model.fields.price.currency.change.target(); // EventCallable<"USD" | "EUR">
```

This is the same discovery the parent form relies on: a bad `amount` surfaces
its error under `price.amount`, and the lens lets you observe and drive it from
Effector without unpacking the composite value yourself.

```ts
import { sample } from "effector";

const amountTyped = createEvent<number>();
sample({ clock: amountTyped, target: model.fields.price.amount.change.target() });

model.fields.price.amount.error.clock().watch((error) => {
  if (error) console.warn("amount invalid:", error);
});
```

::: warning
Inner navigation exists **only** when the field exposes `readFields()`. Without
it the bridge sees just the field's top-level units — `state`, `fill`, `reset`,
and any custom units — and there is no `model.fields.price.amount` to reach.
This is the same requirement the parent form has to see child errors, so a field
that already reports inner errors is already navigable.
:::

## Field-type factories work too

A reusable factory from [Field types](../field-types) is just a function
that returns a `FieldContract`, so nothing changes for the bridge — the returned
field is projected by the same rules. Expose `readFields()` and its inner fields
are navigable; omit it and only its own units are.

## Next

- [Array field](./array-field) — put custom items in a list and reach into each
  one through the collection lens.
- [Custom fields](../custom-fields) — the Virentia composite-field model
  this page bridges.
