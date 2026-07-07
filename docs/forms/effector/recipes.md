---
title: Recipes
---

# Recipes

Small, common situations, each self-contained. Every snippet assumes the model
from the [overview](./index): a form converted with `formToEffector`, an
[association](./index#associate-the-scopes) between a Virentia scope and a forked
Effector scope, and a run to trigger inside. Once that pairing exists, the model
is just Effector — `$`-stores, events, effects, and the `fields` lens — so these
recipes are plain `sample` / `combine` / `allSettled` graphs.

```ts
const model = formToEffector(form);
associate({ virentia: vScope, effector: eScope });
```

## Submit on a clock

`submit` is an effect. Point any UI or Effector clock at it, then react to the
lifecycle events instead of awaiting the call site.

```ts
import { createEvent, sample } from "effector";

const submitClicked = createEvent();

sample({ clock: submitClicked, target: model.submit });

// validated: the form passed validation, payload is the values
model.validated.watch((values) => console.log("valid", values));

// submitted: the form's onSubmit ran to completion
model.submitted.watch((values) => console.log("submitted", values));
```

`validationFailed` fires instead of `validated` when validation rejects, and
`validatedAndSubmitted` fires once both have happened.

## Gate a submit button

Derive the button's disabled flag from the top-level stores. `$isValid` reflects
the current errors, `$isValidationPending` is true while async validators run.

```ts
import { combine } from "effector";

const $canSubmit = combine(
  model.$isValid,
  model.$isValidationPending,
  (isValid, isPending) => isValid && !isPending,
);
```

Read `$canSubmit` in your UI binding. It updates inside the associated scope, so
in tests read it with `scope.getState($canSubmit)`.

## Backend errors into the outer channel

Validation errors and backend errors live in separate channels so neither erases
the other — see [error channels](../errors). After a server rejection, write
the response into the **outer** channel with `fill({ errors })`; local validators
only ever touch the inner channel, so the server message stays put until you clear
it.

```ts
import { allSettled, sample } from "effector";

// on a rejected submit effect, forward the server payload
sample({
  clock: saveArticleFx.failData,
  fn: (error) => ({ errors: { email: error.fieldErrors.email } }),
  target: model.fill,
});

// or drive it directly in a test / handler
await allSettled(model.fill, {
  scope: eScope,
  params: { errors: { email: "Taken" } },
});
```

Clear the outer channel — on the next edit, say — with `clearOuterErrors`:

```ts
sample({ clock: model.changed, target: model.clearOuterErrors });
```

## Mirror a field's value into your own store

A leaf field exposes its value store as a watch action. Fold it into a plain
Effector store when you want to derive from it outside the form.

```ts
import { createStore } from "effector";

const $email = createStore("").on(
  model.fields.email.state.clock(),
  (_, value) => value,
);
```

See [field](./field) for the full leaf lens (`state`, `change`, `setOuterError`).

## Drive a field from an external event

`change` is a target action, so an external event can push straight into the
field's value. The form stays the source of truth — this goes through its change
pipeline, not around it.

```ts
import { sample } from "effector";

const emailReceived = createEvent<string>();

sample({ clock: emailReceived, target: model.fields.email.change.target() });
```

To attach a backend error to one field instead, target
`model.fields.email.setOuterError.target()`.

## Reset and snapshot

`reset` returns the form to its initial values; `forceUpdateSnapshot` makes the
current values the new baseline. `$isChanged` compares live values against that
snapshot.

```ts
import { allSettled } from "effector";

// discard edits
await allSettled(model.reset, { scope: eScope });

// accept the current values as the new clean state
await allSettled(model.forceUpdateSnapshot, { scope: eScope });

model.$isChanged.watch((changed) => console.log("dirty:", changed));
```

A common pairing: after a successful save, rebase the snapshot so the form reads
as clean again.

```ts
sample({ clock: model.submitted, target: model.forceUpdateSnapshot });
```

## Prune empty array items

An array-field lens is a collection keyed by a stable id. Select the items you
want with `where`, then `delete()` returns an event you can trigger. Here we drop
every blank phone before submit.

```ts
import { sample } from "effector";

const prune = model.fields.phones.where((p) => !p.value).delete();

sample({ clock: cleanupClicked, target: prune });
```

See [array field](./array-field) for the full collection lens — `ids`, `where`,
`first` / `last` / `single`, and `delete`.
