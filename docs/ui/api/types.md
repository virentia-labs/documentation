# DOM and descriptor types

```ts
interface Readable<T> { readonly value: T; readonly node: unknown }
type Binding<T> = T | Readable<T> | (() => T);
type View = () => Child;
interface ElementDescriptor {
  readonly type: string | Component<any> | symbol;
  readonly props: Record<string, unknown>;
}
```

Child supports primitives, null/undefined, descriptors, arrays, `Readable<Child>`, View and client-only Node. Booleans produce no visible text. Scalar Readables own permanent text nodes; functions own replaceable ranges.

Binding covers properties/attributes/styles/context. Prefer model units; explicit accessors remain a low-level JavaScript source.

CSSProperties accepts known camelCase/kebab-case and --custom properties with string/number/null bindings; numbers do not automatically get px. ClassList maps tokens to boolean/null/undefined bindings and overlays base classes.

`DOMAttributes<T>` covers children/ref/classes/styles/role/events/data-/aria-. HTMLAttributes/SVGAttributes add native fields. IntrinsicElements/JSX specify their JSX contract. NativeEvent narrows currentTarget, not target.

Owned children cannot be bypassed with innerHTML/textContent. SSR rejects inline script/style children, while script src is supported. ForeignHostTag is a remaining internal opaque-host type; there are no public ReactTree/VueTree adapters.
