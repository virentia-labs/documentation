# Containers, context and Portal

For translates source edits to row DOM operations. It neither chooses keys nor matches previous and next lists.

```ts
For<M extends AnyModel>(props: ModelForProps<M>): ElementDescriptor;
For<T>(props: ForProps<T>): ElementDescriptor;
interface ForProps<T> {
  each: AnyModel | Iterable<T> | { readonly items: readonly T[] }
      | Readable<readonly T[]>
      | (() => Iterable<T> | { readonly items: readonly T[] });
  view?: Component<any> | ((item: Readable<T>, index: Readable<number>) => Child);
  children?: (item: () => T, index: () => number) => Child;
  fallback?: Child;
}
createContext<T>(defaultValue: T): Context<T>;
Portal(props: { mount: Element | DocumentFragment; children?: Child }): ElementDescriptor;
```

The primary form is `<For each={model.tasks} view={Row}/>`; model rows receive a ready model prop. `ModelForProps<M>` takes a definition and reads its scoped collection.

Object data rows supply field input units to configured components; primitive rows supply item. Pure row views receive Readable item/index. children accessors are a lower-level alternative; runtime requires one of view/children. fallback is the empty-list output.

Collections/query and many-relations publish edits; mutable arrays publish mutations. Computed arrays, wholesale replacement or containers without edit feeds recreate rows and warn in development. Model instances belong in model containers.

`Context<T>` has id/defaultValue/Provider. Its provider adds no element; view reads the nearest value through self.context. Context does not implicitly switch scope or model ownership.

Portal places an owned subtree in an existing DOM container, inheriting scope/context. Its teardown leaves external siblings untouched. Server portals have no transport and are rejected.
