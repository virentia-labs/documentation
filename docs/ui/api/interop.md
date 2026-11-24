# Embedded in React and Vue

Adapters display Virentia components inside host apps. Native rendering and in-place DOM updates stay in Virentia. The reverse direction is not public API.

```ts
asReact<P extends object>(view: Component<P>): React.ComponentType<P & { id?: string }>;
asVue<P extends object>(view: Component<P>): Vue.DefineComponent<P & { id?: string }>;
```

Declare one stable intrinsic root, e.g. component({ model, view, root: "button" }). The host creates that exact button, not a wrapper. Virentia owns contents and attributes. Fragments/changing root tags and automatic arbitrary-root inference are not supported.

Only host commits publish props. Abandoned suspended renders do not mutate native models. Host input commits update model bindings without rerunning view. StrictMode replay serializes native teardown/remount.

A ready model provides its application scope unless a Core provider overrides it; mismatch is an error. Autonomous embedding uses a local scope. Vue slots are not rendered.

Host SSR currently emits an empty root; native setup/view start after client commit. Native-content host SSR is not implemented. Standalone SSR is separate.

Host renderers do not await async physical host removal, so native unmounted reactions settle but connected DOM after await is not guaranteed during host unmount. Keep exit-animation placement alive on the host side when needed.

See [embedding](../interop) and [native SSR](./server-start).
