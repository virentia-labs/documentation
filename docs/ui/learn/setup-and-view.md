# Model ownership

Create a child in its parent's model when the parent must control it before DOM exists. The display receives a ready instance.

The tutorial's BoardModel owns its counters through children.many(CounterModel). You can create the graph before rendering:

```tsx
const appScope = scope();
const board = scoped(appScope, () => BoardModel.create({
  id: "board",
  counters: [{ label: "Coffee", count: 2 }],
}));
render(() => <Board model={board} />, container, {
  scope: appScope,
});
```

Board and BoardModel come from the [tutorial example](./model-lists#complete-example). Import scope, scoped and render from UI. The parent can add counters before rendering.

<UIWalkthrough kind="ownership" />

## Who disposes the model

board.counters.remove(counter) disposes a child. board.dispose() disposes the board and its children. Both may be asynchronous; await them when teardown completion matters.

Hiding Counter with a model prop does not dispose that model: the board still owns it.

Without a model prop, the component creates an instance itself. Inside another component, that instance belongs to the parent's model. Use this for children that need no advance control.

One instance has one active display. Two independent simultaneous counters require two instances.

Automatically created instances have a separate [retention option](../components).
