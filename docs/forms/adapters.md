---
title: Schema Adapters
---

# Schema Adapters

Form validation rarely starts from a blank page. A project may already have a
Zod schema for an API contract, a Yup schema for an older screen, or a domain
validator that should stay in place.

`@virentia/forms` does not ship its own rule language. Instead, adapters turn
external schema libraries into regular `FormValidator` or `FieldValidator`
functions. The form still owns lifecycle, scope, pending state, errors, and
store dependencies.

## Zod for the whole form

Use a form adapter when a schema describes the final payload.

```ts
import { createField, createForm } from "@virentia/forms";
import { zodValidator } from "@virentia/forms-zod";
import { z } from "zod";

const profileForm = createForm({
  schema: {
    name: createField(""),
    age: createField(0),
  },
  validation: zodValidator(
    z.object({
      name: z.string().min(1, "Enter a name"),
      age: z.number().min(18, "Adults only"),
    }),
  ),
});

await profileForm.validate();
```

What happens:

- `profileForm.validate()` validates child fields first;
- the adapter calls `safeParseAsync(values)`;
- Zod issues are converted into a nested error object;
- the form writes those errors into matching field `innerErrors`.

For example, an issue with path `["user", "email"]` becomes:

```ts
{
  user: {
    email: "Invalid email",
  },
}
```

If several issues point to the same path, the adapter keeps the first message.
That usually gives the user the earliest and clearest reason.

## Zod for one field

Use a field adapter when the rule belongs to a reusable field type: email,
password, URL, slug.

```ts
import { createField } from "@virentia/forms";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const email = createField("", {
  validate: zodFieldValidator(
    z.string().email("Invalid email"),
  ),
});

await email.validate();
```

The field adapter returns a string error or `null`. If Zod returns several
issues, the field receives the first message.

A more useful version is a reusable field type:

```ts
import { createField, fieldType } from "@virentia/forms";

const primitive = fieldType({ create: createField });

export const emailField = primitive.extend({
  create(base, initial = "") {
    return {
      ...base(initial, {
        validate: [
          zodFieldValidator(z.string().min(1, "Enter an email")),
          zodFieldValidator(z.string().email("Invalid email")),
        ],
      }),
      kind: "email",
    };
  },
});
```

Now the rules live next to the field type, and a form can just use
`emailField()`.

## Yup for the whole form

The Yup adapter solves the same problem through `schema.validate`.

```ts
import { createField, createForm } from "@virentia/forms";
import { yupValidator } from "@virentia/forms-yup";
import * as yup from "yup";

const contactForm = createForm({
  schema: {
    name: createField(""),
    email: createField(""),
  },
  validation: yupValidator(
    yup.object({
      name: yup.string().required("Enter a name"),
      email: yup.string().required("Enter an email").email("Invalid email"),
    }),
  ),
});
```

For form validation, the adapter runs Yup with `abortEarly: false` to collect
errors for all fields in one pass.

## Yup for one field

```ts
import { createField } from "@virentia/forms";
import { yupFieldValidator } from "@virentia/forms-yup";
import * as yup from "yup";

const title = createField("", {
  validate: yupFieldValidator(
    yup.string().required("Enter a title"),
  ),
});
```

Field validation uses `abortEarly: true` because one field needs one message.
If you need exact message priority, use an array of validators.

```ts
const slug = createField("", {
  validate: [
    yupFieldValidator(yup.string().required("Enter a slug")),
    yupFieldValidator(
      yup.string().matches(/^[a-z0-9-]+$/, "Use lowercase letters, digits, and hyphens"),
    ),
  ],
});
```

## Schema depending on stores

Some rules depend on application state: plan, region, organization settings, or
feature flags. Adapters accept either a schema or a factory. The factory
receives `ValidationContext`.

```ts
import { store } from "@virentia/core";
import { zodValidator } from "@virentia/forms-zod";
import { z } from "zod";

const minimumAge = store(18);

const profileForm = createForm({
  schema: {
    age: createField(0),
  },
  validation: zodValidator((ctx) =>
    z.object({
      age: z.number().min(ctx.read(minimumAge), "Age is below the limit"),
    }),
  ),
});
```

After the first `profileForm.validate()`, the form remembers that the schema
factory read `minimumAge`. When the store changes in the same scope, the form
validates again.

This is useful for reactive rules that should not force the UI to manually
synchronize validation with external state.

## Mixing adapters and manual rules

An adapter returns a regular validator. It can be combined with functions and
Virentia effects.

```ts
const username = createField("", {
  validate: [
    zodFieldValidator(z.string().min(3, "Use at least 3 characters")),
    async (value, ctx) => {
      const reserved = ctx.read(reservedUsernames);
      return reserved.includes(value) ? "This username is reserved" : null;
    },
  ],
});
```

The form runs validators in order and stops at the first error. Async validators
receive `ctx.signal` when they need to cancel network work.

## Field adapter or form adapter

| Scenario | Use |
| --- | --- |
| Rule depends on one value | `zodFieldValidator` or `yupFieldValidator` |
| Rule compares several fields | `zodValidator`, `yupValidator`, or a form validator |
| Schema already describes the API payload | form adapter |
| Field is a reusable domain primitive | field adapter inside `fieldType.extend` |
| Rule needs Virentia stores | schema factory or manual validator with `ctx.read` |

## Contract

Zod:

```ts
function zodValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<z.output<Schema>, any>;

function zodFieldValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<z.output<Schema>, FieldError>;
```

Yup:

```ts
function yupValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<InferType<Schema>, any>;

function yupFieldValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<InferType<Schema>, FieldError>;
```

## Next

- [Validation](./validation) - lifecycle, strategies, async, and dependencies.
- [Field types](./field-types) - reusable validator setup.
- [Shape fields](./shape-fields) and [array fields](./array-fields) - how
  schema errors map to dynamic fields.
- [API reference](/api/forms) - validator types and `ValidationContext`.
