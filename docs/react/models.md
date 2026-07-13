# Models and component

React components often need state that depends on props and disappears with the component. In Virentia that state should still be a core model. The React package only creates it at the right time and prepares it for rendering.

## Model Factories

A model factory receives `ModelContext`. Its `props` field is a store, so reactions can read the latest props without recreating the model on every render.

```tsx
function createCounterModel({ props }: ModelContext<{ step: number }>) {
  const clicked = event<void>();
  const count = store(0);

  reaction({
    on: clicked,
    run() {
      count.value += props.step;
    },
  });

  return { clicked, count };
}
```

Use a factory when the model belongs to one component instance, depends on props, or needs lifecycle units such as `mounted` and `unmounted`.

## useModel

`useModel` creates the model once for the component instance and unwraps it for rendering. Stores become values. Events and effects become callbacks bound to the provided scope.

```tsx
export function Counter(props: { step: number }) {
  const model = useModel(createCounterModel, props);

  return <button onClick={() => model.clicked()}>{model.count}</button>;
}
```

When the component unmounts, work created by the factory is disposed unless the model was placed in a cache.

## component

`component` is the same pattern packaged as one declaration: create the model, keep props fresh, send mount/unmount events, unwrap the model, and render the view.

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.clicked()}>{model.count}</button>;
  },
});
```

Use `component` when the model is owned by the view. Use `useModel` when you need to compose it manually inside an existing component.

### Controlled component model

`component` also supports controlled usage. The returned component has `.create(props)`, which lets a parent component model create and own a child component model.

```tsx
export const Parent = component({
  model() {
    const counter = Counter.create({ step: 2 });

    return { counter };
  },

  view({ model }) {
    return <Counter step={2} model={model.counter} />;
  },
});
```

When a controlled model is passed to the child component, React still keeps `props`, `mounted`, `unmounted`, and `mounts` fresh. Unmounting the child view does not dispose the model; the parent owns it.

## Mapping props with `mapProps`

By default a component's **external props** — what you pass in JSX — are also the **model's props**. `mapProps` lets them differ: it receives the external props and returns the model props. It runs during render, so it may read React context or call hooks — a router's params, a theme — and fold them into what the model receives.

```tsx
export const Page = component({
  mapProps: (props: { slug: string }) => {
    const { uuid } = useParams<{ uuid: string }>(); // react-router hook
    return { ...props, uuid };
  },
  model: createPageModel, // receives ModelContext<{ slug: string; uuid: string }>
  view({ model }) {
    return <Article model={model} />;
  },
});
```

The view still receives the **external** props (plus `model`); only the model sees the mapped props. Omit `mapProps` and the two coincide.

`.create(props)` takes the **model** props directly — it runs while a parent model is built, outside any render, so there is no `mapProps` step there.

## Nested models with `@@shape`

A model is often composed from smaller sub-models. When a sub-model is a plain record of units, `useModel` and `component` unwrap it as-is. When it also carries helpers you do not want in the view, declare its bindable units with a `@@shape` property: the field then reaches the view as just those units, and the marker never leaks. Shapes nest, so this holds at any depth.

```tsx
import { SHAPE } from "@virentia/react";

// A reusable field sub-model: two units plus a helper it keeps to itself.
function createField(initial: string) {
  const text = store(initial);
  const changed = event<string>();
  reaction({ on: changed, run: (next) => (text.value = next) });

  return {
    text,
    changed,
    isEmpty: () => text.value.trim() === "", // helper, not bound
    [SHAPE]: { text, changed }, // bind only these
  };
}

// A model built from sub-models.
function createProfileModel() {
  const name = createField("");
  const bio = createField("");
  const saved = event<void>();

  return { name, bio, saved };
}
```

With `useModel`, each field arrives as `{ text, changed }` — `isEmpty` stays out:

```tsx
function Profile() {
  const model = useModel(createProfileModel, {}); // no props

  return (
    <form onSubmit={() => model.saved()}>
      <input value={model.name.text} onChange={(e) => model.name.changed(e.target.value)} />
      <input value={model.bio.text} onChange={(e) => model.bio.changed(e.target.value)} />
    </form>
  );
}
```

`component` binds the same model the same way — the view receives `model.name` and `model.bio` already unwrapped to their units:

```tsx
export const Profile = component({
  model: createProfileModel,
  view({ model }) {
    return (
      <form onSubmit={() => model.saved()}>
        <input value={model.name.text} onChange={(e) => model.name.changed(e.target.value)} />
        <input value={model.bio.text} onChange={(e) => model.bio.changed(e.target.value)} />
      </form>
    );
  },
});
```

Reach for `@@shape` only when a sub-model mixes units with non-units. A sub-model that is a plain record of units needs no declaration — it already unwraps.

## Lifecycle Units

Factories receive `mounted`, `unmounted`, and `mounts`. Use them for model logic that should react to the UI lifetime: loading data on mount, pausing work when the last instance unmounts, or tracking how many mounted views share a cached model.

Lifecycle units are part of the model, not React effects disguised as model code. Prefer them when the result should be testable as part of the model.
