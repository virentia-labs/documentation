---
title: Field
---

# Field

A leaf field — `createField(...)` in the schema — is the smallest node the bridge
projects. After `formToEffector`, it lives at `model.fields.<name>` as a lens
node: every unit the Virentia field exposes is mapped to a set of **unit
actions**, chosen by the unit's kind. The form stays the single source of truth;
the lens node only reads and forwards.

- Read-only units (`Store`, `Event`) become **watchable** — you get
  `.clock(): Event<T>`.
- Writable units (`EventCallable`, `StoreWritable`, `Effect`) become
  **targetable** — you get `.clock()` _and_ `.target(map?): EventCallable`.

So a field's stores (`state`, `error`, `isValid`, …) are watch-only, and its
methods (`change`, `validate`, `fill`, …) are drivable.

| Watch (`.clock()`)                                             | Drive (`.target()` + `.clock()`)                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `state`, `error`, `innerError`, `outerError`, `isValid`,      | `change`, `focus`, `blur`, `validate`, `fill`, `reset`,                  |
| `isFocused`, `meta`, `isValidationPending`                    | `changeError`, `setInnerError`, `setOuterError`, `changeMeta`,           |
| `changed`, `focused`, `blurred`, `validated`,                 | `setInnerErrors`, `setOuterErrors`                                       |
| `validationFailed`, `errorsChanged`                           |                                                                          |

Everything on this page assumes an association and a scope in the current run —
see [Overview → Associate the scopes](./#associate-the-scopes). The bridge does
not invent a scope; trigger inside one.

## Read a field

Each store becomes an `Event<T>` that fires on every update. Use it as a `clock`,
a `source`, or watch it directly.

```ts
model.fields.email.state.clock();               // Event<string>
model.fields.email.error.clock();               // Event<FieldError>
model.fields.email.isValidationPending.clock(); // Event<boolean>

model.fields.email.error.clock().watch((error) => {
  if (error) console.warn("email invalid:", error);
});
```

For a full-form read use the top-level stores instead — `model.$values`,
`model.$errors` — and pick the key. The field lens is the right tool when you
want _one_ field's updates as a standalone clock.

## Drive a field

Every field method is targetable. Call `.target()` once to get an
`EventCallable`, then either `sample` into it or call it directly.

```ts
import { createEvent, sample } from "effector";

// Wire an external Effector event straight into the field.
const emailTyped = createEvent<string>();
sample({ clock: emailTyped, target: model.fields.email.change.target() });

// Or dispatch imperatively (inside a scope).
model.fields.email.change.target()("user@example.com");
```

The same shape covers the rest of the lifecycle:

```ts
model.fields.email.validate.target();  // re-run the field's validators
model.fields.email.fill.target();      // set value + emit changed
model.fields.email.reset.target();     // back to initial value/errors/meta
model.fields.email.focus.target();     // mark focused
model.fields.email.blur.target();      // mark blurred
```

### A backend error

Field errors have two layers (see [Error channels](../errors)). Push a
server-side message into the **outer** channel so the field's own validators keep
owning the inner one:

```ts
import { sample } from "effector";

sample({
  clock: model.submit.failData,
  filter: (error) => error.field === "email",
  fn: (error) => error.message,
  target: model.fields.email.setOuterError.target(),
});
```

### Mapping external props

`.target(map)` accepts _external_ props and maps them to the unit's payload —
handy when the clock carries more than the field wants:

```ts
const inputChanged = createEvent<{ name: string; value: string }>();

sample({
  clock: inputChanged,
  filter: ({ name }) => name === "email",
  target: model.fields.email.change.target(({ value }) => value),
});
```

## End to end

An external event drives the field; a watcher reacts to its error store — no form
rewrite, all state still in Virentia.

```ts
import { createEvent, sample } from "effector";

const emailTyped = createEvent<string>();

// Drive: external input → field.change
sample({ clock: emailTyped, target: model.fields.email.change.target() });

// Validate on blur is already configured on the field; just observe.
model.fields.email.error.clock().watch((error) => {
  render(error ? { state: "error", message: error } : { state: "ok" });
});
```

::: tip
`.change.target()` returns a fresh `EventCallable` each call, so create it once
and reuse it if you need a stable reference to `sample` into or to
`scopeBind`.
:::

## Validation still runs in the field

The bridge forwards triggers; it does not re-implement validation. A field's
`validationStrategies` (change / blur / focus / submit) still fire inside the
Virentia field. Calling `model.fields.email.blur.target()` marks the field
blurred, and if `blur` is a strategy the field validates itself and its
`error` store updates — which you then observe through `error.clock()`. See
[Validation lifecycle](../validation) for when validators run.

::: warning
Do not push validation errors through `changeError` / `setInnerError` to
"simulate" validation. Let the field's own validators own the inner channel;
reserve `setOuterError` for messages that come from outside the form (a backend).
:::

## Next

- [Array field](./array-field) — a keyed lens over an ordered list of items.
- [Recipes](./recipes) — submit wiring, backend errors, and mirroring in one place.
