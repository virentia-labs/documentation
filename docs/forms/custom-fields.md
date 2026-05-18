---
title: Custom Fields
---

# Custom Fields

Use a custom field when the UI is made of several internal fields, but the form
should see one domain value. The form should not know that `Money` is rendered
as amount and currency, or that an address is rendered as country, city, and
street.

Custom fields are structural. They do not inherit from a base class; they
satisfy `FieldContract`.

## Money Field

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
      return {
        amount: amount.read(),
        currency: currency.read(),
      };
    },
    readFields() {
      return { amount, currency };
    },
    async fill(next) {
      await Promise.all([
        amount.fill(next.amount),
        currency.fill(next.currency),
      ]);
    },
    async reset() {
      await Promise.all([amount.reset(), currency.reset()]);
    },
  });
}
```

What matters:

- `state` exposes the domain value as a Virentia store;
- `read()` returns a scoped snapshot;
- `readFields()` lets forms discover child fields for validation and errors;
- `fill` and `reset` wait for every internal operation.

## Inside A Form

```ts
const invoice = createForm({
  schema: {
    title: createField(""),
    total: createMoneyField({ amount: 0, currency: "USD" }),
  },
});

await invoice.fill({
  values: {
    total: { amount: 120, currency: "EUR" },
  },
});
```

The form receives `Money`, not `{ amountField, currencyField }`. If the
internal `amount` field is invalid, the error appears under `total.amount`.

## Contract

```ts
interface FieldContract<Value, Errors = FieldError, Fill = Value> {
  readonly kind: string;
  readonly state: Store<Value>;
  readonly errors?: Store<Errors>;
  readonly innerErrors?: Store<Errors>;
  readonly outerErrors?: Store<Errors>;
  readonly isValid?: Store<boolean>;
  readonly isValidationPending?: Store<boolean>;

  fill(payload: Fill): Promise<void>;
  reset(): Promise<void>;
  read?(): Value;
  readFields?(): Readonly<Record<string, AnyField>>;
}

function defineField<FieldValue extends AnyField>(field: FieldValue): FieldValue;
```

## Common Cases

- money input;
- date range;
- address;
- localized text;
- file upload state;
- rich editor value;
- any widget where UI fields are not the API value shape.

## Related

- [Field model](./fields) - primitive fields used inside custom fields.
- [Field types](./field-types) - reusable custom field factories.
- [Error channels](./errors) - how child errors are lifted.
- [React bindings](./react) - rendering custom fields through `useField`.
