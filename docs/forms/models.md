---
title: Owned Fields and Static Models
---

# Owned Fields and Static Models

These model APIs require `@virentia/core` 0.11.2 or newer.

Declare reusable field definitions once. Create an independent child of that
definition for each form. Two forms using the same `Email` definition then have
the same behavior and separate values. Use `refs` when they must edit the same
existing field instance.

## Definitions and Custom Behavior

Import model factories from `@virentia/forms/models`:

<<< @/examples/packages/forms.ts#definitions

`fieldModel` uses traits for value, metadata, focus, errors and reset state.
`staticModel.setup` declares the shared unit graph once; creating instances does
not declare new field units. The native `createField` API remains available.

An existing `fieldType` can provide additional methods. Build on `createField`
or the extension's `base` so those methods use the model's trait cells:

<<< @/examples/packages/forms.ts#custom

The factory's constructor-normalized initial value, metadata and initial error
become the field's defaults. Explicit DTO values take precedence. A restored
scope snapshot also keeps its metadata and original reset baseline:

<<< @/examples/packages/forms.ts#defaults

`create` runs when the definition's shared graph is declared. It is not called
again for each DTO or `fill`; normalize later input through field methods or
model input conversion when that behavior is needed.

## Arrays and Shapes

Compose definitions into nested fields:

<<< @/examples/packages/forms.ts#collections

| Factory | Value | Where behavior is declared |
| --- | --- | --- |
| `fieldModel(initial, options)` | One value | `validate`, metadata and optional `create` |
| `arrayFieldModel(initial, options)` | Ordered array | `item` definition; a scalar definition is supplied when omitted |
| `shapeFieldModel(schema, options)` | Object | Definitions or raw defaults per key; `additional` for new keys |

Array/shape `.field` keeps the existing `fill`, `reset`, validation and membership
methods. The model's `.value` is a readonly derived store; edit it through the
field API or a writable scalar child.

New raw items become owned `children`. Passing an existing model field to
`push`, `add` or `replace` borrows it through `refs`; its original owner controls
its lifetime. Its definition must be declared in `item`, the shape schema or
`additional`. A field from another application scope is rejected.

Removing an owned item awaits its disposal, including async cleanup. Removing a
borrowed item releases the ref. `move`/`swap` preserve the instances. `reset`
restores the original composition and values. Native `createArrayField` and
`createShapeField` retain their existing behavior.

Overlapping changes do not remove an already pending child twice. Each mutation
waits for cleanup it starts; `reset` waits for pending removals before restoring
the baseline, so an original identity is not recreated while still being disposed.

## A Form Owns Its Fields

Resolve the schema inside `setup` and create missing children in synchronous
`onCreate`. The guards also preserve children restored from a DTO:

<<< @/examples/packages/forms.ts#form

Use `.create()` in an application scope, or let a parent create the model through
`children`. The bound form and its nested field stores/methods work directly:

<<< @/examples/packages/forms.ts#edit

Declare `form.pick(...)`, `createWizard` and `createWizardForm` in `setup` too.
Picked forms and the wizard's current/step forms keep the instance binding.
React `useField`/`useForm`/`useWizardForm`, Zod validators, Vue `useUnit` and
Effector form lenses accept these bound APIs.

Form validation treats a superseded run and its calling model's own disposal
abort as cancellation. Actual validator failures still reject an explicitly
awaited `form.validate()`; they are not hidden by this cancellation handling.

## Reuse a Definition or Share an Instance

`children.one(Email)` in two models creates independent email fields. For a
shared draft, keep one owner and attach editing forms to it:

<<< @/examples/packages/forms.ts#sharing

Disposing an editor leaves the profile's email alive. With `nullify`, disposing
the owning field clears refs. A schema that requires that ref must only be used
while it exists; close the editor or handle its absence in the application.

`.static()` creates a separate module graph. Keep it for a deliberately shared
module lifetime. Ordinary per-form fields use `.create()`/`children`; sharing an
existing instance uses `refs` and does not require `.static()`.

## JSON Transfer and Hydration

Use stable model names/SIDs and explicit stable IDs for roots. `json()` transfers
owned child DTOs, composition and order. Transfer the scope snapshot as well to
preserve original reset state, metadata and errors:

<<< @/examples/packages/forms.ts#restore

Restore the scope and root models before hydrating the UI. Render the server and
client with the same view and UI `identifierPrefix`; the UI can then attach to
the server DOM. `onCreate` must not overwrite restored children. Each request and
client application uses its own scope.

For native UI lists, `.field.items` is an array-valued store. Replacing that
array recreates `For` rows by the existing UI contract; stable field instances
do not imply DOM reconciliation. Hydration itself reuses matching server nodes.

Borrowed targets are references, not embedded owned DTOs: transfer their owner's
DTO too and recreate the owner before the borrowers. Reusing a definition does
not make its instances or values global.

## Related

- [Validation lifecycle](./validation), [custom fields](./custom-fields), [wizard](./wizard).
- [Storage bindings](/storage/models), [Net models](/net/core/models), [Router models](/router/core/models).
- [UI SSR and hydration](/ui/ssr).
