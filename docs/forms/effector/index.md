---
title: Overview
---

# Forms · Effector

`@virentia/forms` is UI- and runtime-independent: a form is a model whose state
lives in Virentia stores. Some products already run on **Effector** and want to
read a form's state and drive its lifecycle from an Effector graph — `sample`,
effects, `allSettled` — without rewriting the form.

`@virentia/forms-effector` is that bridge. It is built on
[`@virentia/effector`](../../effector/)'s `fool`, so the Virentia form stays the
single source of truth; the package does **not** reimplement the form in
Effector. Nested units (array items, shape fields, nested groups) are exposed
through a lens API shaped like
[`@effector-kit/models`](https://github.com/movpushmov/effector-kit).

## Install

```sh
pnpm add @virentia/forms-effector @virentia/forms @virentia/effector effector @virentia/core
```

## How the section is structured

Each page takes one field kind or situation and shows how it looks after
`formToEffector`. Start here for the top-level model and scopes, then jump to the
field kind you need.

| Page                                | Use it when |
| ----------------------------------- | ----------- |
| [Field](./field)                    | A leaf field should be read and driven from Effector. |
| [Array field](./array-field)        | An ordered list needs a keyed lens over its items. |
| [Shape field](./shape-field)        | A dynamic-key object needs a keyed lens over its children. |
| [Custom field](./custom-field)      | A composite/custom field should expose its nested units. |
| [Recipes](./recipes)                | Small, common situations: submit, backend errors, mirroring. |

## Convert a form

`formToEffector` walks the form once and returns an Effector-facing projection.
It reads only the form's public contract, so custom and composite fields work as
long as they expose their units and `readFields()`.

```ts
import { createArrayField, createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const form = createForm({
  schema: {
    email: createField(""),
    phones: createArrayField<string>([""]),
  },
});

const model = formToEffector(form);
```

## Associate the scopes

The bridge follows the same rule as `@virentia/effector`: a fooled unit resolves
its scope from the **current run**. Pair the Virentia scope with a forked
Effector scope once per run (test, request, render), then trigger inside that
run.

```ts
import { scope as virentiaScope } from "@virentia/core";
import { associate } from "@virentia/effector";
import { allSettled, fork } from "effector";

const vScope = virentiaScope();
const eScope = fork();

associate({ virentia: vScope, effector: eScope });

await allSettled(model.fill, {
  scope: eScope,
  params: { values: { email: "user@example.com" } },
});
```

Without an association, or with no scope in the current run, the underlying
fooled units throw instead of inventing a scope. Choose scopes with `scoped`,
Effector `allSettled` / `scopeBind` / `launch`, or UI providers. See the
[scopes](../../effector/scopes) page of the core Effector bridge for the full model.

## The top-level model

Form state is exposed as `$`-prefixed Effector stores, its lifecycle as Effector
events, and every mutating method as an Effector **effect** that runs the
Virentia method inside the associated Virentia scope.

| Group   | Members |
| ------- | ------- |
| Stores  | `$values`, `$value`, `$errors`, `$innerErrors`, `$outerErrors`, `$snapshot`, `$isChanged`, `$isValid`, `$isValidationPending` |
| Events  | `filled`, `changed`, `errorsChanged`, `validated`, `validationFailed`, `submitted`, `validatedAndSubmitted` |
| Effects | `submit`, `validate`, `fill`, `reset`, `clearOuterErrors`, `clearInnerErrors`, `forceUpdateSnapshot` |

```ts
import { createEvent, sample } from "effector";

// Submit from an Effector clock
const submitClicked = createEvent();
sample({ clock: submitClicked, target: model.submit });

// React to a validated form
model.validated.watch((values) => console.log("valid payload", values));
```

Because methods are effects, `.pending` and `.done` / `.fail` work as usual, and
`fill` / `reset` / `submit` sequence their downstream side effects inside the
Virentia scope.

## Nested units — the lens

`model.fields` mirrors the schema. Leaf fields expose their units as watch
(`clock()`) or dispatch (`target()`) actions; array and shape fields are
collection lenses keyed by a **stable id**. Every page in this section is a tour
of one of those shapes.

```ts
model.fields.email.state.clock();          // Event<string>
model.fields.email.change.target();        // EventCallable<string>
model.fields.phones.ids("0").state.clock();
```

The selection operators — `ids`, `where`, `first`, `last`, `single`, `delete`,
`getSource`, `props` — match the `@effector-kit/models` lens signature.
`union`, `ref`, and instance aliases have no analogue in a fixed form schema and
are intentionally not exposed.
