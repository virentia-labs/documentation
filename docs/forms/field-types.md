---
title: Field Types
---

# Field Types

A field type is a reusable field factory. Use it when a domain primitive should
carry the same behavior everywhere: validation, normalization, view metadata, or
extra methods.

This keeps form schemas readable. A form says `emailField()` instead of
repeating email validation in every screen.

## Extend A Primitive Field

```ts
import { createField, fieldType } from "@virentia/forms";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const primitive = fieldType({ create: createField });

const emailField = primitive.extend({
  create(base, initial = "") {
    const field = base(initial, {
      validate: [
        zodFieldValidator(z.string().min(1, "Enter an email")),
        zodFieldValidator(z.string().email("Invalid email")),
      ],
    });

    return {
      ...field,
      kind: "email",
      async normalize() {
        await field.fill(field.read().trim().toLowerCase());
      },
    };
  },
});

const email = emailField("");

await email.fill(" ADA@EXAMPLE.COM ");
await email.normalize();
```

What happens:

- `base` is the previous factory;
- the extension may change options, add methods, or return another field
  contract;
- the returned factory keeps the new type;
- the form still treats the result as a field.

## In A Form

```ts
const signup = createForm({
  schema: {
    email: emailField(""),
    password: passwordField(""),
  },
});
```

The schema now reads in domain terms. Validation and normalization remain close
to the field type.

## Contract

```ts
function fieldType<Factory extends (...args: any[]) => AnyField>(config: {
  kind?: string;
  create: Factory;
}): FieldType<Factory>;

type FieldType<Factory extends (...args: any[]) => AnyField> = Factory & {
  extend<Args extends any[], NextField extends AnyField>(extension: {
    kind?: string;
    create(base: Factory, ...args: Args): NextField;
  }): FieldType<(...args: Args) => NextField>;
};
```

## Common Cases

- email, password, URL, slug, phone;
- money, percent, date range;
- field-specific normalization;
- reusable schema adapter setup;
- view hints attached to a field model;
- domain methods like `normalize`, `format`, or `clearUpload`.

## Related

- [Custom fields](./custom-fields) - structural fields with child models.
- [Schema adapters](./adapters) - Zod validator inside field types.
- [Field model](./fields) - the primitive field factory.
