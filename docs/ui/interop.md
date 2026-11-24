# Virentia inside React or Vue

Declare a native model-backed component with one stable root, then use asReact/asVue.

```tsx
const NativeCounter = component({ model: CounterModel, root: "button",
  view: (_props, self) => <button onClick={self.model.increment}>{self.model.count}</button>,
});
const ReactCounter = asReact(NativeCounter);
const VueCounter = asVue(NativeCounter);
```

The host creates that exact button at the child's position. There is no wrapper element. After commit, Virentia owns contents/bindings and count changes require no host rerender.

A ready model supplies its scope unless overridden by a Core provider; mismatch is rejected. Autonomous instances use local scopes.

This is a constrained embedded contract, not automatic arbitrary-root integration. Native-content host SSR and connected DOM after async host-unmount are not implemented. See [types and limitations](./api/interop).
