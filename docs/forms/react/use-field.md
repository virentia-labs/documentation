---
title: useField
---

# useField

`useField(field)` turns a field contract into a view for an input. It subscribes
the component to the field's stores — `value`, `errors`, `innerErrors`,
`outerErrors`, `isValid`, `isValidationPending`, and `view` — and returns async
handlers already bound to the nearest scope: `fill`, `reset`, `validate`,
`setInnerErrors`, `setOuterErrors`, `clearInnerErrors`, and `clearOuterErrors`.

Make sure a scope is provided above the component — see the
[section overview](./) for the shared `ScopeProvider` setup.

## Input from a field

The smallest React layer usually looks like this: a component receives a field
model, and `useField` turns it into a view for an input.

```tsx
import type { FieldContract, FieldError } from "@virentia/forms";
import { useField } from "@virentia/forms-react";

interface TextInputProps {
  label: string;
  field: FieldContract<string, FieldError, string>;
}

function TextInput({ label, field }: TextInputProps) {
  const model = useField(field);

  return (
    <label>
      <span>{label}</span>
      <input
        value={model.value}
        aria-invalid={!model.isValid}
        onChange={(event) => void model.fill(event.currentTarget.value)}
      />
      {model.errors ? <span role="alert">{model.errors}</span> : null}
    </label>
  );
}
```

What happens:

- `useField(field)` subscribes to `value`, `errors`, `isValid`, and
  `isValidationPending`;
- `model.fill` calls `field.fill` inside the React scope;
- `fill` returns `Promise<void>`, so the UI can wait for complex custom fields
  with several child updates;
- the component does not care whether this is a primitive field or a custom
  field with the same contract.

## Notes

- Every handler on the view is already scope-bound. You never wrap `model.fill`
  (or the other handlers) in `scoped` — that is only for methods read straight
  off the field model.
- `fill` returns `Promise<void>`. Awaiting it lets the UI react after the value,
  its validation, and any child updates have settled.
- The same component works for a primitive field and for a
  [custom field](../fields) with the same contract — `useField` cares only
  about the contract shape, not the implementation.

## Binding field events

The view exposes the **plural** `errors` and does **not** include the field
events `focus` / `blur`. Bind those with `useUnit` from `@virentia/react`.

```tsx
import { useField } from "@virentia/forms-react";
import { useUnit } from "@virentia/react";

function TextInput({ field }: TextInputProps) {
  const model = useField(field);
  const [focus, blur] = useUnit([field.focus, field.blur]);

  return (
    <input
      value={model.value}
      onFocus={() => void focus()}
      onBlur={() => void blur()}
      onChange={(event) => void model.fill(event.currentTarget.value)}
    />
  );
}
```

## Dynamic item fields

For dynamic objects and arrays, the UI reads child field models from their
stores and passes each item to `useField` again.

```tsx
import { scoped } from "@virentia/core";
import { createArrayField, createField } from "@virentia/forms";
import { useProvidedScope, useUnit } from "@virentia/react";

const tags = createArrayField(["forms"], {
  createItem(value) {
    return createField(value);
  },
});

function TagsEditor() {
  const scope = useProvidedScope();
  const tagItems = useUnit(tags.items);

  return (
    <section>
      {tagItems.map((tag, index) => (
        <TagInput key={index} field={tag} />
      ))}

      <button
        type="button"
        onClick={() => void scoped(scope, () => tags.push(""))}
      >
        Add tag
      </button>
    </section>
  );
}

function TagInput({ field }: { field: ReturnType<typeof createField<string>> }) {
  const tag = useField(field);

  return (
    <input
      value={tag.value}
      onChange={(event) => void tag.fill(event.currentTarget.value)}
    />
  );
}
```

`useUnit(tags.items)` reads the child models, and each one flows back into
`useField`. `tags.push` is wrapped in `scoped` because it is a method of the
array field itself, not a handler returned by a React hook. Handlers returned
from `useField` are already bound to the current scope. See
[array fields](../array-fields) for the field-side model.

## Contract

`useField`:

```ts
interface FieldView<Value, Errors, Fill> {
  readonly field: NormalizedField<Value, Errors, Fill>;
  readonly value: Value;
  readonly errors: Errors;
  readonly innerErrors: Errors;
  readonly outerErrors: Errors;
  readonly isValid: boolean;
  readonly isValidationPending: boolean;
  readonly view: unknown;

  fill(payload: Fill): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  setInnerErrors(errors: Errors): Promise<void>;
  setOuterErrors(errors: Errors): Promise<void>;
  clearInnerErrors(): Promise<void>;
  clearOuterErrors(): Promise<void>;
}
```

The `innerErrors` and `outerErrors` channels back the same priority rules as the
field model — see [validation](../validation) for how they combine into
the plural `errors`.

## Next

- [useForm](./use-form) — whole-form submit and backend errors.
- [useWizard](./use-wizard) — step navigation gated by validation.
