# Conditional editor with a preserved draft

Create the editor model in the parent's child relation before DOM. Toggle its display only. Hiding preserves draft; reopening creates a fresh input with the model's value.

[Passing a ready model](../learn/setup-and-view).

The course model makes Board own Task state/ref. The editor view receives that ready model and replaces the list, rather than displaying the same Task twice.

Only the conditional fragment reruns. Unmounted finishes before input removal/ref clearing. No keep is needed for a supplied child. DOM-only edits are not preserved across structural replacement; write them to the model through an input action.

See [lifecycle contracts](../api/refs-events).

:::: details Complete example sources
::: code-group
<<< @/ui/examples/tasks/models.ts
<<< @/ui/examples/conditional-editor.tsx
:::
::::
