---
title: Overview
---

# Forms · React

`@virentia/forms` is UI-independent. That is useful for tests, SSR, and reusable
feature models, but components still need a simple way to read stores and call
form methods in the correct Virentia scope.

`@virentia/forms-react` is that integration layer:

- subscribes components to values, errors, and pending state;
- returns async handlers bound to the nearest `ScopeProvider`;
- keeps the form model outside React, so it can be tested and reused without
  components.

## Install

```sh
pnpm add @virentia/forms-react @virentia/forms @virentia/react react
```

## How the section is structured

Each hook gets its own page: how it is called, what it returns, and the cases
people hit first. Start here for the scope setup they all share.

| Page                        | Use it when |
| --------------------------- | ----------- |
| [useField](./use-field)     | A component renders one field and its errors. |
| [useForm](./use-form)       | A screen submits a whole form and shows server errors. |
| [useWizard](./use-wizard)   | A screen drives a multi-step wizard. |

## Provide a scope

First, give the React tree a Virentia scope. Every hook below reads it.

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

If a page mounts two scopes, the same form model has two independent states — one
per scope. The hooks read snapshots from the nearest provider and return handlers
already bound to it, so you never call `scoped` by hand for hook results.

::: tip Field events
The hook results expose the **plural** `errors` and do not include the field
events `focus` / `blur`. Bind those with `useUnit` from `@virentia/react`:

```tsx
import { useUnit } from "@virentia/react";
const blur = useUnit(field.blur);
```
:::

## Next

- [useField](./use-field) — build inputs that accept any field contract.
- [useForm](./use-form) — whole-form submit and backend errors.
- [useWizard](./use-wizard) — step navigation gated by validation.
