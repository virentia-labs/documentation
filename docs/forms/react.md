---
title: React
---

# React

`@virentia/forms` is UI-independent. That is useful for tests, SSR, and
reusable feature models, but components still need a simple way to read stores
and call form methods in the correct Virentia scope.

`@virentia/forms-react` solves that integration layer:

- subscribes components to values, errors, and pending state;
- returns async handlers bound to the nearest `ScopeProvider`;
- keeps the form model outside React, so it can be tested and reused without
  components.

## Provide a scope

First, give the React tree a Virentia scope.

```tsx
import { scope } from "@virentia/core";
import { ScopeProvider } from "@virentia/react";

const appScope = scope();

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <ProfileScreen />
    </ScopeProvider>
  );
}
```

All hooks below read this scope. If a page has two scopes, the same form model
can have two independent states.

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

## Form submit

`useForm` is for whole-form state: `values`, `errors`, `isChanged`, `isValid`,
`submit`, and `reset`.

```tsx
import { createField, createForm } from "@virentia/forms";
import { useForm } from "@virentia/forms-react";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const signupForm = createForm({
  schema: {
    email: createField("", {
      validate: zodFieldValidator(z.string().email("Invalid email")),
    }),
    password: createField("", {
      validate: zodFieldValidator(
        z.string().min(8, "Use at least 8 characters"),
      ),
    }),
  },
});

function SignupScreen() {
  const form = useForm(signupForm);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <TextInput label="Email" field={signupForm.fields.email} />
      <TextInput label="Password" field={signupForm.fields.password} />

      <button
        type="submit"
        disabled={form.isValidationPending || !form.isChanged}
      >
        Create account
      </button>
    </form>
  );
}
```

Here `TextInput` reads each field through `useField`, while the screen works
with whole-form operations through `useForm`. This gives scoped handlers at both
levels.

`form.submit()` runs the validation lifecycle. If the form is valid, it updates
the snapshot and `form.isChanged` becomes `false`. If not, errors stay in the
matching fields.

## Server errors in UI

Backend feedback usually arrives after submit. Put it into the external error
channel with `form.fill({ errors })`.

```tsx
async function saveProfile() {
  const result = await api.saveProfile(form.values);

  if (!result.ok) {
    await form.fill({
      errors: {
        email: result.errors.email,
      },
    });
    return;
  }

  await form.forceUpdateSnapshot();
}
```

`model.errors` inside `TextInput` shows the server error because the external
channel has priority over local validation. Clear it when the user should see
local errors again:

```tsx
await form.clearOuterErrors();
```

## Dynamic fields

For dynamic objects and arrays, UI usually reads child field models from their
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

`tags.push` is wrapped in `scoped` because it is a method of the array field
itself, not a handler returned by a React hook. Methods returned from
`useField`, `useForm`, and `useWizard` are already bound to the current scope.

## Wizard UI

Read a wizard through `useWizard`. The current step stores a form model, so the
screen can choose a component by `currentId`.

```tsx
import { useWizard } from "@virentia/forms-react";

function SignupWizardScreen() {
  const wizard = useWizard(signupWizard);

  return (
    <>
      {wizard.currentId === "account" ? <AccountStep /> : null}
      {wizard.currentId === "billing" ? <BillingStep /> : null}

      <footer>
        <button
          type="button"
          disabled={!wizard.canGoBack}
          onClick={() => void wizard.back()}
        >
          Back
        </button>
        <button
          type="button"
          disabled={!wizard.canGoNext}
          onClick={() => void wizard.next()}
        >
          Next
        </button>
      </footer>
    </>
  );
}
```

`wizard.next()` validates the current step form. If it is invalid, navigation
does not happen, and step fields show errors through the same components used by
regular forms.

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

`useForm`:

```ts
interface FormView<Model extends Form> {
  readonly form: Model;
  readonly fields: Model["fields"];
  readonly values: unknown;
  readonly errors: unknown;
  readonly innerErrors: unknown;
  readonly outerErrors: unknown;
  readonly snapshot: unknown;
  readonly isChanged: boolean;
  readonly isValid: boolean;
  readonly isValidationPending: boolean;

  fill: Model["fill"];
  reset(): Promise<void>;
  validate(): Promise<void>;
  submit(): Promise<void>;
  clearInnerErrors(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  forceUpdateSnapshot(): Promise<void>;
}
```

`useWizard`:

```ts
interface WizardView<Model extends Wizard> {
  readonly wizard: Model;
  readonly steps: unknown;
  readonly visibleSteps: unknown;
  readonly currentId: unknown;
  readonly currentIndex: number;
  readonly currentStep: unknown;
  readonly currentForm: unknown;
  readonly visitedIds: readonly unknown[];
  readonly completedIds: readonly unknown[];
  readonly canGoBack: boolean;
  readonly canGoNext: boolean;

  next(): Promise<boolean>;
  back(): Promise<boolean>;
  goTo(id: never): Promise<boolean>;
  complete(): Promise<boolean>;
  reset(): Promise<void>;
}
```

`useWizardForm` is an alias for `useWizard`.

## Next

- [Field model](./fields) - how to build UI components that accept any field
  contract.
- [Validation](./validation) - what happens during `submit()` and `validate()`.
- [Shape fields](./shape-fields) and [array fields](./array-fields) - dynamic
  lists and objects.
- [Wizard forms](./wizard) - navigation between step forms.
