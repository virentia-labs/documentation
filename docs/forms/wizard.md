---
title: Wizard Forms
---

# Wizard Forms

A wizard is useful when one task is completed in several passes: signup,
onboarding, checkout, integration setup, or a multi-page questionnaire. The
hard part is not the Back and Next buttons. The hard part is the model: where
the final payload lives, when a step is validated, how conditional steps are
skipped, and how existing forms are reused.

In `@virentia/forms`, a wizard step is a form.

```ts
step = form + navigation metadata
```

The wizard does not own fields. It owns navigation between forms.

## Shared root form

The most common case is that all steps edit one final object. For example,
signup has account data, plan choice, and billing details.

```ts
const signup = createForm({
  schema: {
    email: createField("", {
      validate: zodFieldValidator(z.string().email("Invalid email")),
    }),
    password: createField("", {
      validate: zodFieldValidator(
        z.string().min(8, "Use at least 8 characters"),
      ),
    }),
    plan: createField<"free" | "team">("free"),
    billingEmail: createField(""),
  },
});
```

Steps are created as projections of this form:

```ts
const wizard = createWizard({
  form: signup,
  steps: [
    step("account", {
      title: "Account",
      form: signup.pick({
        email: true,
        password: true,
      }),
    }),
    step("plan", {
      title: "Plan",
      form: signup.pick({
        plan: true,
      }),
    }),
    step("billing", {
      title: "Billing",
      form: signup.pick({
        billingEmail: true,
      }),
      when: ({ values }) => values.plan === "team",
    }),
  ],
});
```

What happens:

- `signup` remains the single source of final values;
- `pick` does not copy fields, it creates a form projection over the same field
  instances;
- the `account` step validates only `email` and `password`;
- the `billing` step is visible only for the team plan;
- `wizard.read()` returns `signup.read()`.

## Moving to the next step

```ts
const moved = await wizard.next();
```

Algorithm:

```ts
current = visibleSteps[currentIndex]
await current.form.validate()

if current.form.isValid:
  mark current step completed
  move to next visible step
  return true

return false
```

The user cannot move forward while the current step form is invalid. Errors
stay inside that step form, so the UI displays them the same way as in a
regular form.

## Jump navigation

`goTo(id)` is useful for sidebar navigation.

```ts
await wizard.goTo("billing");
```

If the target is behind the current step, the wizard moves without validation.
If the target is ahead, the wizard validates every intermediate visible step and
stops at the first invalid one.

This keeps completed steps freely reachable without allowing users to skip
required checks.

## Completing the wizard

```ts
const completed = await wizard.complete();
```

`complete()` validates all visible steps. If one step is invalid, the wizard
moves to it and returns `false`. If all steps are valid, it emits `completed`
and returns `true`.

```ts
if (await wizard.complete()) {
  await saveSignup(signup.read());
}
```

## Standalone step forms

A root form is not always needed. Sometimes each step is already a feature
model: contact import settings, webhook configuration, and connection testing.

```ts
const importSettings = createForm({
  schema: {
    source: createField<"csv" | "crm">("csv"),
  },
});

const webhookSettings = createForm({
  schema: {
    url: createField("", {
      validate: zodFieldValidator(z.string().url("Invalid URL")),
    }),
  },
});

const wizard = createWizard({
  steps: [
    step("import", { form: importSettings }),
    step("webhook", { form: webhookSettings }),
  ],
});
```

Without a root form, `wizard.read()` returns an object by step id:

```ts
{
  import: importSettings.read(),
  webhook: webhookSettings.read(),
}
```

Use this mode when steps are genuinely independent and should not share one
schema.

## `createWizardForm`

If you always create a root form and immediately describe steps, use the helper.

```ts
const wizard = createWizardForm({
  schema: {
    email: createField(""),
    password: createField(""),
    displayName: createField(""),
  },
  steps: [
    step("account", {
      pick: {
        email: true,
        password: true,
      },
    }),
    step("profile", {
      form: {
        displayName: true,
      },
    }),
    step("review", {
      form: true,
    }),
  ],
});

wizard.form; // root form
```

For `createWizardForm` steps, `pick` and `form: { ... }` create projections of
the root form. Use `form: true` when a step should validate the whole root
form. If a step already has its own form model, pass it through `form` in
`createWizard`, or return it from the `createWizardForm` callback form.

The helper does not introduce a new behavior model. It only shortens the shared
root form pattern.

## React UI

A wizard can be read through `useWizard`.

```tsx
function WizardControls() {
  const wizard = useWizard(signupWizard);

  return (
    <footer>
      <button disabled={!wizard.canGoBack} onClick={() => void wizard.back()}>
        Back
      </button>
      <button disabled={!wizard.canGoNext} onClick={() => void wizard.next()}>
        Next
      </button>
    </footer>
  );
}
```

The current step stores a form, so a screen can choose the component by
`currentId` and pass `currentForm` to it.

## Contract

```ts
interface WizardStep<Id extends string, StepForm extends AnyForm> {
  readonly id: Id;
  readonly form: StepForm;
  readonly title?: string;
  readonly when?: (ctx: { values: unknown }) => boolean;
}

interface Wizard<Steps, RootForm> {
  readonly form: RootForm;
  readonly steps: Store<Steps>;
  readonly visibleSteps: Store<Steps>;
  readonly currentId: Store<StepId>;
  readonly currentIndex: Store<number>;
  readonly currentStep: Store<Step>;
  readonly currentForm: Store<Form>;
  readonly visitedIds: Store<readonly StepId[]>;
  readonly completedIds: Store<readonly StepId[]>;
  readonly canGoBack: Store<boolean>;
  readonly canGoNext: Store<boolean>;

  next(): Promise<boolean>;
  back(): Promise<boolean>;
  goTo(id: StepId): Promise<boolean>;
  complete(): Promise<boolean>;
  reset(): Promise<void>;
  read(): unknown;
}
```

## Next

- [Validation](./validation) - what happens inside `step.form.validate()`.
- [React](./react) - how to connect a wizard to the UI.
- [Form model](./form) - why a step can be any form projection.
- [API reference](/api/forms) - `Wizard`, `WizardStep`, and
  `createWizardForm`.
