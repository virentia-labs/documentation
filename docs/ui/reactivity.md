# Reactive inputs

A plain prop supplies an input value. Pass a store when that input must change after attachment:

```tsx
const initial = store(2);
render(() => <Counter count={initial} />, container, {
  scope: appScope,
});
scoped(appScope, () => { initial.value = 8; });
```

This is the tutorial's [Counter](./learn/model-lists). Import store, scoped and render from UI.

The existing button now shows 8, and doubled shows 16. View does not run again. Passing initial.value instead would supply a number snapshot.

DOM properties accept units too: class={model.className}, disabled={model.busy}, value={model.text}. Declare their computations in the model.

value={model.text} displays a value. Handle user input with an event/action; there is no automatic two-way binding.

Host integrations can retarget a prop to another source store without rerunning view. See the [component API](./api/components) for the input contract.
