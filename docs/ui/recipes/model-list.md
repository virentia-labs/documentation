# Owned model list

Declare tasks: children.many(Task) in Board, create the board from data and pass it to view. For receives board.tasks and supplies each TaskRow's ready model.

The maintained example uses For each/view. Row state/actions are declared in the model, not view.

Insert creates a row; move transfers existing DOM/ref attachments; remove awaits lifecycle and destroys that child. Disposing Board cascades through children. Static arrays render once; reactive identity/operations belong to the source, not JSX.

See [For types](../api/collections-context) and [list mechanics](../learn/model-lists).

:::: details Complete example sources
::: code-group
<<< @/ui/examples/tasks/models.ts
<<< @/ui/examples/tasks/App.tsx
<<< @/ui/examples/model-list.tsx
:::
::::
