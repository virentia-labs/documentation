---
title: Validation Lifecycle
---

# Validation Lifecycle

Validation in Virentia Forms is a lifecycle. Core does not ship rules like
`required` or `email`; it decides when validators run, how async work is
cancelled, where results are written, and how store dependencies are tracked.

Validators are ordinary functions or Virentia effects. Schema adapters are just
validators too.

## Field Validator

Use a field validator when the rule depends on one value.

```ts
const username = createField("", {
  validate(value) {
    return value.length >= 3 ? null : "Use at least 3 characters";
  },
});

await username.validate();
```

Result:

- success writes `null` to `innerError`;
- failure writes the returned error to `innerError`;
- `isValidationPending` tracks async work;
- `validated` or `validationFailed` is emitted.

## Form Validator

Use a form validator when the rule depends on several fields or the final
payload shape.

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
```

Form validation:

```ts
clear inner errors
validate child fields
run form validators
write returned errors into child fields
emit validated or validationFailed
```

Outer errors are not cleared by validation. That behavior belongs to
[error channels](./errors).

## Async Validator

Validators may be async. Use `ctx.signal` for cancellable work.

```ts
const username = createField("", {
  async validate(value, ctx) {
    const response = await fetch(`/api/users/${value}`, {
      signal: ctx.signal,
    });
    const data = await response.json();

    return data.available ? null : "Username is already taken";
  },
});
```

If another validation run starts, the previous one is aborted and stale results
are ignored.

## Store Dependencies

Use `ctx.read(store)` when validation depends on application state.

```ts
const reservedNames = store(["admin", "root"]);

const username = createField("", {
  validate(value, ctx) {
    return ctx.read(reservedNames).includes(value)
      ? "This username is reserved"
      : null;
  },
});
```

After the first validation run, the field subscribes to the stores read through
`ctx.read`. When a dependency changes in the same scope, validation runs again.

## Strategies

```ts
const email = createField("", {
  validate: emailValidator,
  validationStrategies: ["blur"],
});

const form = createForm({
  schema: { email },
  validationStrategies: ["change"],
});
```

| Strategy | Runs when |
| --- | --- |
| `manual` | Direct `validate()` call |
| `change` | Value changes |
| `blur` | Field blur |
| `focus` | Field focus |
| `submit` | Form submit lifecycle |

`submit()` always validates the form before emitting submit success and updating
the snapshot.

## Contract

```ts
interface ValidationContext {
  readonly signal: AbortSignal;
  readonly path: readonly string[];
  read<T>(unit: Store<T> | StoreWritable<T>): T;
}

type ValidationResult<Errors> = Errors | null | undefined;

type ValidationFunction<Value, Errors> = (
  value: Value,
  ctx: ValidationContext,
) => ValidationResult<Errors> | Promise<ValidationResult<Errors>>;

type FieldValidator<Value, Errors = FieldError> =
  | ValidationFunction<Value, Errors>
  | ValidationEffect<Value, Errors>;

type FormValidator<Values, Errors> =
  | ValidationFunction<Values, Errors>
  | ValidationEffect<Values, Errors>;
```

## Common Cases

- required/min/max rules on a field;
- cross-field equality or dependency rules;
- async availability checks;
- schema validators through adapters;
- rules that depend on stores such as plan, region, feature flag, or tenant
  settings.

## Related

- [Error channels](./errors) - where validation results are stored.
- [Schema adapters](./adapters) - Zod and Yup as validators.
- [Field types](./field-types) - reusable validator setup.
