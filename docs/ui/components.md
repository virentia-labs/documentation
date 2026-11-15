# Retaining instances

By default, an automatically created model is disposed with its display. keep: true retains the model in its scope, not DOM.

```tsx
const SavedCounter = component({
  model: CounterModel,
  keep: true,
  view: (_props, self) => <button onClick={self.model.increment}>
    {self.model.count}
  </button>,
});
```

Display it with a stable ID, such as SavedCounter id="coffee". Hiding and showing the same ID restores the previous value; view creates a new button.

Override retention for one instance with keep={false}.

When the retained instance is no longer needed:

```ts
const saved = scoped(appScope, () => CounterModel.get("coffee"));
await saved?.dispose();
```

Import scoped from Core. Automatic IDs are fresh for each creation; reopening a retained model requires a stable explicit ID.

An instance supplied through model={counter} remains creator-owned regardless of keep. Prefer [parent model ownership](./learn/setup-and-view) for controlled children.
