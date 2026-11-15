# Components and self

component binds an existing Core model/staticModel definition to a view. .model is that same definition; no hidden UI instance is created.

```ts
component<M extends AnyModel>(config: ComponentConfig<M>): DefinedComponent<M>;
interface ComponentConfig<M extends AnyModel> {
  model: M;
  view: (props: ModelProps<M>, self: ComponentSelf<M>) => Child;
  keep?: boolean;
  id?: (props: ModelProps<M>) => string;
  root?: string;
}
type DefinedComponent<M extends AnyModel> =
  Component<ComponentInput<M>> & { readonly model: M };
type ComponentInput<M extends AnyModel> =
  | (ModelProps<M> & { model?: undefined; keep?: boolean })
  | (Partial<ModelProps<M>> & {
      model: InstanceOf<M> | Readable<InstanceOf<M> | null>;
      keep?: boolean;
    });
```

ModelProps derives value/Readable inputs from model DTO/props; id is a string. ComponentOptions contains keep/id/root. Prefer native model-config id(props); component-level id remains a low-level alternative. root describes the current embedded adapter's stable intrinsic root.

Without a model prop, runtime creates a native instance, disposing it on unmount unless kept. JSX keep overrides the config. Automatic nested instances are parent-owned; local explicit IDs are qualified by stable parent identity.

Supplied instances remain creator-owned. View runs for each DOM attachment, not model creation or scalar changes. Remount creates fresh DOM. One model can have only one active display, including across alternative views.

Create an independent model once, then pass it through `model`:

```tsx
const counter = Counter.model.static();
// Each .static() call creates another model; keep the result you want to display.
<Counter model={counter} />;
```

The renderer binds it to the render scope. It remains alive after unmount;
the same declaration in another scope has separate state. See [model singletons](/models/instances#a-singleton-from-an-existing-model).

| View self member | Contract |
| --- | --- |
| model | `InstanceOf<M>`, the concrete native instance |
| id | Its current string ID |
| scope | Instance scope; a static instance scope is not a separate application |
| instances | Readonly snapshot array of live same-definition models in this application |
| elementId(name) | Named DOM ID including the root prefix |
| context(Context) | Reactive nearest-provider accessor |
| mounted/unmounted | Native units when the model has the UI trait |

There is no ambient self. A captured view self remains bound to its instance.

`Component<P>` is a descriptor-function type; `ComponentProps<T>` extracts JSX inputs. Pure fragments acquire no hidden model or ID. View = () => Child denotes repeatable structure. Declare units in models, not views. withRoot adds explicit metadata; it never analyzes code.

See [ownership](../learn/setup-and-view) and [lifecycle](./refs-events).
