# Типы DOM и описаний

```ts
interface Readable<T> { readonly value: T; readonly node: unknown }
type Binding<T> = T | Readable<T> | (() => T);
type View = () => Child;
interface ElementDescriptor {
  readonly type: string | Component<any> | symbol;
  readonly props: Record<string, unknown>;
}
```

Child принимает примитивы, null/undefined, описания элементов, массивы, `Readable<Child>`, View и клиентский Node. Boolean не создаёт видимый текст. Readable-скаляр владеет постоянным Text; функция View — заменяемым диапазоном.

Binding применяется к атрибутам, свойствам, стилям и context. Предпочитайте готовые юниты модели. Функция-accessor остаётся низкоуровневым JavaScript-источником, но не требуется для обычных скалярных значений.

CSSProperties принимает известные CSS-свойства в camelCase/kebab-case и custom properties (--name), со значением string/number/null либо соответствующим Binding. Число не автоматически становится px. ClassList — карта токенов с boolean/null/undefined привязками; она накладывается на base class.

`DOMAttributes<T>` включает children/ref/class/className/classList/style/role, события, data-/aria-атрибуты. `HTMLAttributes<T>` и `SVGAttributes<T>` добавляют нативные свойства соответствующего элемента. IntrinsicElements и namespace JSX задают их JSX-контракт. NativeEvent уточняет currentTarget, но target остаётся обычным EventTarget|null.

InnerHTML/textContent не разрешают обходить owned DOM детей. Inline script/style children запрещены в SSR; внешний script src допустим. ForeignHostTag — оставшийся низкоуровневый тип внутреннего opaque-host протокола; публичных ReactTree/VueTree нет.
