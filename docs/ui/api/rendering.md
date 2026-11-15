# Rendering and DOM

render constructs a display in a container; hydrate adopts matching server nodes. Both require a scope and return an awaited unmount function.

```ts
interface RenderOptions {
  scope: Scope;
  owner?: Owner;
  identifierPrefix?: string;
}
render(factory: () => Child, container: Element | DocumentFragment, options: RenderOptions): () => Promise<void>;
hydrate(factory: () => Child, container: Element | DocumentFragment, options: RenderOptions): () => Promise<void>;
h<P extends object>(type: string | Component<P> | symbol, props?: P | null, ...children: Child[]): ElementDescriptor;
mergeProps(...sources: (Record<string, unknown> | (() => Record<string, unknown> | null | undefined))[]): Record<string, unknown>;
```

owner supplies an external application/test lifetime, including automatically created retained models. Without it, retained models stay in their scope until explicit disposal. Several containers can share a scope while unmounting independently.

identifierPrefix participates in named DOM IDs and must match the server/client root pair. It is not the model ID.

Wrong-scope models and duplicate active displays are rejected. Initial failure releases partial bindings/DOM. Hydration mismatch preserves server nodes rather than silently client-rendering.

h and createElement are the same inert descriptor factory. Fragment groups children without an element. Native DOM nodes are client-only children. mergeProps preserves late reads; later sources win. Plain JavaScript spread/destructuring may snapshot values, while unit objects retain reactivity.

Scalar unit updates modify existing nodes/properties. Function children own structural ranges that are completely replaced, with no tag/child comparison.

See [refs/events](./refs-events) and [server rendering](./server-start).
