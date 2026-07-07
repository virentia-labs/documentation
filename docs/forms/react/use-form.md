---
title: useForm
---

# useForm

`useForm(form)` exposes whole-form state to a screen. It subscribes the
component to the form snapshot and returns handlers already bound to the nearest
scope (see [Provide a scope](./) on the overview page).

The view carries the aggregate state — `values`, `errors`, `innerErrors`,
`outerErrors`, `snapshot`, `isChanged`, `isValid`, `isValidationPending`, and
the `fields` map — together with scoped handlers `fill`, `reset`, `validate`,
`submit`, `clearInnerErrors`, `clearOuterErrors`, and `forceUpdateSnapshot`.

Individual inputs are still rendered through [`useField`](./use-field); `useForm`
is for the operations that touch the form as a whole.

## Submit a form

`useForm` drives the screen: it reads the aggregate flags and calls
`form.submit()` on submit. Each field renders through `useField`, so both levels
get scoped handlers.

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

Here `TextInput` reads each field through [`useField`](./use-field), while the
screen works with whole-form operations through `useForm`. This gives scoped
handlers at both levels.

## The submit lifecycle

`form.submit()` runs the validation lifecycle. It advances the snapshot only
when the form is valid: on success the snapshot moves to the current values and
`form.isChanged` becomes `false`; otherwise the errors stay in the matching
fields and the snapshot is untouched.

That is why the button above disables on `form.isValidationPending || !form.isChanged` —
there is nothing to submit while validation is in flight or nothing has changed.
For exactly what runs during `submit()` and `validate()`, see
[Validation](../validation).

## Server errors in the UI

Backend feedback usually arrives after submit. Write it into the **outer** error
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

`model.errors` inside `TextInput` shows the server error because the outer
channel has priority over local validation, so the message stays visible even as
the user keeps typing. Clear it when local errors should take over again:

```tsx
await form.clearOuterErrors();
```

On success there is no new snapshot from `submit()` — the values came from the
server round-trip — so call `form.forceUpdateSnapshot()` to mark the current
values as saved and reset `isChanged`. The two error channels and their priority
are described in [Errors](../errors).

## Contract

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

The `form` model itself is described in [Form](../form), and the
validators wired into `createField` in [Adapters](../adapters).

## Next

- [useWizard](./use-wizard) — drive a multi-step wizard where each step is a form
  gated by validation.
