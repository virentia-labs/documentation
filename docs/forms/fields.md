---
title: Field Model
---

# Field Model

A field is the smallest model unit in Virentia Forms. Use it when a single value
needs behavior around it: changing, resetting, validation, focus state,
metadata, or server errors.

A field can live inside a form, inside another field, or by itself. That is the
important boundary: a field is not an input component; it is a model for one
piece of form state.

## Basic Field

```ts
import { createField } from "@virentia/forms";

const title = createField("");

await title.fill("Virentia");

title.read();      // "Virentia"
title.state.value; // "Virentia"
```

What happens:

- `state` is a Virentia store;
- `fill` writes a new value and emits `changed`;
- `read` returns the value in the current scope;
- `reset` restores the initial value, initial errors, focus state, and metadata.

## Validation On A Field

```ts
const username = createField("", {
  validate(value) {
    return value.trim().length >= 3 ? null : "Use at least 3 characters";
  },
});

await username.validate();

username.error.value;   // "Use at least 3 characters"
username.isValid.value; // false
```

Field validation is for rules that only need one value. If the rule compares
several fields, put it on the [form model](./form).

## Metadata And Focus

Use `meta` for state that belongs to the field but should not become part of
the submitted value.

```ts
const price = createField(0, {
  meta: {
    touchedByUser: false,
  },
});

await price.changeMeta({ touchedByUser: true });
await price.focus();
await price.blur();
```

Common metadata examples:

- UI mode for a domain field;
- source of the latest change;
- flag that a value was normalized manually;
- per-field view hints.

## Contract

```ts
function createField<Value, Meta extends object = Record<string, never>>(
  initial: Value,
  options?: {
    error?: FieldError;
    meta?: Meta;
    validate?: FieldValidator<Value> | readonly FieldValidator<Value>[];
    validationStrategies?: readonly ValidationStrategy[];
  },
): Field<Value, Meta>;

interface Field<Value, Meta extends object = Record<string, never>>
  extends NormalizedField<Value, FieldError, Value> {
  readonly error: Store<FieldError>;
  readonly innerError: Store<FieldError>;
  readonly outerError: Store<FieldError>;
  readonly meta: Store<Meta>;
  readonly isFocused: Store<boolean>;

  fill(value: Value): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  focus(): Promise<void>;
  blur(): Promise<void>;
  changeMeta(meta: Meta): Promise<void>;
}
```

## Common Cases

Use a primitive field for:

- text, number, checkbox, select, and date values;
- search filters that need validation or reset;
- local models that later may become part of a form;
- fields reused by several screens;
- simple values inside [shape fields](./shape-fields) and
  [array fields](./array-fields).

## Related

- [Form model](./form) - how fields become one payload.
- [Validation lifecycle](./validation) - how validators run.
- [Error channels](./errors) - why field errors have two layers.
- [Custom fields](./custom-fields) - how several fields expose one value.
