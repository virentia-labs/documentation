# Refs and lifecycle

Focusing an input requires its DOM element. Keep the reference in the model and use mounted to access the connected element.

```tsx
const FieldModel = staticModel({
  with: [ui],
  setup(self) {
    const input = ref<HTMLInputElement>();
    reaction({
      on: self.mounted,
      run: () => input.value?.focus(),
    });
    return { input };
  },
});
const Field = component({
  model: FieldModel,
  view: (_props, self) => <input ref={self.model.input} />,
});
```

Import staticModel from Core models and the other functions from UI. ref is a writable Element | null store. The ui trait supplies mounted and unmounted event units.

<UIWalkthrough kind="refs" />

## Ending a display

Refs are filled before mounted reactions run, parent first and then children.

During unmounted reactions, DOM and refs remain available. Rendering waits for the reactions, removes the nodes and clears refs. Await unmount to wait for an exit animation.

If a reaction fails, cleanup still runs and unmount rejects. On the server, refs stay null and lifecycle events do not fire.

See [refs and events](../api/refs-events) for types and DOM payloads.
