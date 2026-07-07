---
title: useWizard
---

# useWizard

`useWizard(wizard)` reads a [wizard](../wizard) into a view for a
multi-step screen. It subscribes the component to the wizard stores — `steps`,
`visibleSteps`, `currentId`, `currentIndex`, `currentStep`, `currentForm`,
`visitedIds`, `completedIds`, `canGoBack`, and `canGoNext` — and returns async
handlers already bound to the nearest scope: `next()`, `back()`, `goTo(id)`,
`complete()`, and `reset()`.

The navigation handlers `next()`, `back()`, `goTo(id)`, and `complete()` return
`Promise<boolean>` — `true` when the move happened, `false` when validation
blocked it. `reset()` returns `Promise<void>`.

Make sure a scope is provided above the component — see the
[section overview](./) for the shared `ScopeProvider` setup.

`useWizardForm` is an alias for `useWizard`; use whichever name reads better next
to `createWizardForm`.

## A wizard screen

The current step stores a form model, so the screen can choose a component by
`currentId` and gate the Back and Next buttons on `canGoBack` / `canGoNext`.

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

The buttons are disabled at the edges: `!canGoBack` on the first step,
`!canGoNext` on the last. Clicking them calls `wizard.back()` and
`wizard.next()`, both already scope-bound.

## Validation gates Next

`wizard.next()` validates the current step form. If it is invalid, navigation
does not happen, and the step fields show errors through the same components used
by regular forms — the errors stay inside that step's form model.

```tsx
async function goForward() {
  const moved = await wizard.next();

  if (!moved) {
    // stayed on the current step; its fields now show validation errors
  }
}
```

This is why `next()` returns `Promise<boolean>`: `true` when the step was valid
and the wizard advanced, `false` when it stayed put. `goTo(id)` and `complete()`
follow the same contract — see [validation](../validation) for what runs
inside `step.form.validate()`, and [useForm](./use-form) for how a form surfaces
those errors.

## Reading a step form

Each step component reads its own form with [useForm](./use-form) and renders its
fields the same way any form does. The wizard only decides which step is current
and whether navigation is allowed; the fields themselves are plain form fields.

```tsx
import { useForm } from "@virentia/forms-react";

function AccountStep() {
  const form = useForm(signupWizard.form.pick({ email: true, password: true }));

  return (
    <>
      <TextInput label="Email" field={form.fields.email} />
      <TextInput label="Password" field={form.fields.password} />
    </>
  );
}
```

Because steps are form projections over the same field instances, the values a
step edits flow straight into the root form and into `wizard.read()`.

## Contract

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

- [Wizard forms](../wizard) — the navigation model this hook renders.
- [useForm](./use-form) — whole-form submit and backend errors inside a step.
- [Validation](../validation) — what runs inside `step.form.validate()`.
