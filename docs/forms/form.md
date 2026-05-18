---
title: Form Model
---

# Form Model

A form composes fields into one model. Use it when several values should behave
as one payload: fill draft data, validate fields together, submit, reset, track
changes, or receive backend errors.

The form does not replace fields. It reads them, writes partial updates to them,
and exposes aggregate stores.

## Basic Form

```ts
import { createField, createForm } from "@virentia/forms";

const profile = createForm({
  schema: {
    name: createField(""),
    age: createField(0),
  },
});

await profile.fill({
  values: {
    name: "Ada",
    age: 36,
  },
});

profile.read(); // { name: "Ada", age: 36 }
```

What happens:

- `schema` is normalized into field models;
- `values` is assembled from every field value;
- `errors` has the same structure as the schema;
- `fill({ values })` writes partial data into matching fields;
- `reset()` resets every field.

## Cross-Field Rule

Field validators should stay local to one value. Put rules that compare fields
on the form.

```ts
const signup = createForm({
  schema: {
    password: createField(""),
    confirmPassword: createField(""),
  },
  validation(values) {
    return values.password === values.confirmPassword
      ? null
      : { confirmPassword: "Passwords do not match" };
  },
});

await signup.validate();
```

Returned errors are written into child field `innerErrors`, so UI reads them the
same way as field-level validation errors.

## Snapshot And Changed State

`snapshot` is the last accepted values state. A successful `submit()` updates
it. Manual saves can call `forceUpdateSnapshot()`.

```ts
await profile.fill({ values: { name: "Ada" } });
profile.isChanged.value; // true

await profile.submit();
profile.isChanged.value; // false
```

Use this for:

- save buttons;
- navigation guards;
- dirty-state indicators;
- deciding whether a draft should be persisted.

## Form Projection

`pick` creates a form projection over the same field instances. It is useful for
wizard steps and feature components that should operate on part of a larger
form.

```ts
const accountStep = signup.pick({
  password: true,
  confirmPassword: true,
});

await accountStep.validate();
```

The projection does not copy state. If a field changes through `accountStep`,
the root form sees the same change.

## Contract

```ts
function createForm<Schema extends Record<string, any>>(config: {
  schema: Schema;
  validation?: FormValidator<any, any> | readonly FormValidator<any, any>[];
  validationStrategies?: readonly ValidationStrategy[];
}): Form<Schema>;

interface Form<Schema, Values, Errors> {
  readonly fields: NormalizeSchema<Schema>;
  readonly values: Store<Values>;
  readonly errors: Store<Errors>;
  readonly snapshot: Store<Values>;
  readonly isChanged: Store<boolean>;
  readonly isValid: Store<boolean>;
  readonly isValidationPending: Store<boolean>;

  fill(payload: {
    values?: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  submit(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  clearInnerErrors(): Promise<void>;
  forceUpdateSnapshot(): Promise<void>;
  pick(selection: SelectionShape<NormalizeSchema<Schema>>): FormProjection<any>;
  read(): Values;
}
```

## Common Cases

- edit profile or entity forms;
- filter forms that can reset to a known state;
- server-side drafts loaded into fields;
- forms split into wizard steps;
- submit flows that update `snapshot` only after validation.

## Related

- [Field model](./fields) - what a form is made of.
- [Validation lifecycle](./validation) - what `validate()` and `submit()` run.
- [Error channels](./errors) - how `fill({ errors })` behaves.
- [Wizard forms](./wizard) - how projections become steps.
