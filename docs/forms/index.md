---
title: Forms
---

# Forms

`@virentia/forms` is a model layer for forms. It is not a component library and
does not prescribe markup. A form is described once as fields, validators,
errors, dynamic sections, and navigation rules; UI, tests, SSR, and background
flows use the same model through a Virentia scope.

Use it when form behavior is part of the product logic: server errors must not
erase local validation, a step should validate before navigation, a row in a
list has its own fields, or a domain input should behave as one reusable field.

## Install

```sh
pnpm add @virentia/forms @virentia/core
```

Optional packages:

```sh
pnpm add @virentia/forms-react @virentia/react react
pnpm add @virentia/forms-zod zod
pnpm add @virentia/forms-yup yup
```

## How The Section Is Structured

The forms guide is organized by mental pattern. Each page explains why the
pattern exists, when to use it, how the API looks, and the cases people usually
hit first.

| Pattern | Use it when |
| --- | --- |
| [Field model](./fields) | One value needs lifecycle: fill, reset, validation, focus, metadata. |
| [Form model](./form) | Several fields should become one values/errors payload. |
| [Validation lifecycle](./validation) | Rules should run as functions, effects, schemas, or store-aware validators. |
| [Error channels](./errors) | Backend errors and local validation must coexist. |
| [Custom fields](./custom-fields) | Several internal fields should expose one domain value. |
| [Field types](./field-types) | A field factory should carry reusable domain behavior. |
| [Shape fields](./shape-fields) | An object has dynamic keys. |
| [Array fields](./array-fields) | A form has ordered repeated items. |
| [Wizard forms](./wizard) | Navigation is driven by validation of step forms. |
| [React bindings](./react) | Components should read models and call scoped handlers. |
| [Schema adapters](./adapters) | Zod or Yup should act as validators, not as the form runtime. |

## First Model

Start with fields and a form. Fields own their values; the form reads them into
one payload and runs cross-field rules.

```ts
import { scope, scoped } from "@virentia/core";
import { createField, createForm } from "@virentia/forms";

const signup = createForm({
  schema: {
    email: createField(""),
    password: createField(""),
    confirmPassword: createField(""),
  },
  validation(values) {
    return values.password === values.confirmPassword
      ? null
      : { confirmPassword: "Passwords do not match" };
  },
});

const appScope = scope();

await scoped(appScope, async () => {
  await signup.fill({
    values: {
      email: "ada@example.com",
      password: "supersecret",
      confirmPassword: "supersecret",
    },
  });

  await signup.submit();
});
```

What this gives you:

- `signup.values` is derived from the fields;
- `signup.errors` has the same shape as the schema;
- `submit()` validates and updates the snapshot only after success;
- the same model can be reused in React, tests, or another scope.

## Package Map

```ts
@virentia/forms        // core models and contracts
@virentia/forms-react  // React hooks
@virentia/forms-zod    // Zod validators
@virentia/forms-yup    // Yup validators
```

Full signatures live in the [API reference](/api/forms).
