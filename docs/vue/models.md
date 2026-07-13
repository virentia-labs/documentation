# Models and component

Vue components often need state that depends on props and disappears with the component. In Virentia that state should still be a core model. The Vue package only creates it at the right time and prepares it for rendering.

## Model Factories

A model factory receives `ModelContext`. Its `props` field is a store, so reactions can read the latest props without recreating the model on every render.

```ts
// counter-model.ts
import { event, reaction, store } from "@virentia/core";
import type { ModelContext } from "@virentia/vue";

export function createCounterModel({ props }: ModelContext<{ step: number }>) {
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

export type CounterModel = ReturnType<typeof createCounterModel>;
```

Use a factory when the model belongs to one component instance, depends on props, or needs lifecycle units such as `mounted` and `unmounted`.

## useModel

`useModel` creates the model once for the component instance and prepares it for rendering. Stores become refs; events and effects become callables bound to the provided scope.

Pass props as a getter or ref (`MaybeRefOrGetter`) so prop changes flow into the model's `props` store.

```vue
<script setup lang="ts">
import { useModel } from "@virentia/vue";
import { createCounterModel } from "./counter-model";

const props = defineProps<{ step: number }>();
const { count, clicked } = useModel(createCounterModel, () => props);
</script>

<template>
  <button @click="clicked()">{{ count }}</button>
</template>
```

When the component unmounts, work created by the factory is disposed unless the model was placed in a cache.

## component

`component` is the same pattern packaged as one declaration: create the model, keep props fresh, send mount/unmount events, prepare the model, and render the view. The `view` is a Vue component that receives the prepared `model` prop plus the model props.

```ts
import { component } from "@virentia/vue";
import { createCounterModel } from "./counter-model";
import CounterView from "./CounterView.vue";

export const Counter = component({
  model: createCounterModel,
  view: CounterView,
});
```

```vue
<!-- CounterView.vue -->
<script setup lang="ts">
import type { ReactiveModel } from "@virentia/vue";
import type { CounterModel } from "./counter-model";

const props = defineProps<{ step: number; model: ReactiveModel<CounterModel> }>();
const { count, clicked } = props.model;
</script>

<template>
  <button @click="clicked()">{{ count }}</button>
</template>
```

Use `component` when the model is owned by the view. Use `useModel` when you need to compose it manually inside an existing component.

### Controlled component model

`component` also supports controlled usage. The returned component has `.create(props)`, which lets a parent component model create and own a child component model. Call `.create()` while the parent model is being built — it needs the parent's scope.

```ts
import { component } from "@virentia/vue";
import { Counter } from "./counter";
import ParentView from "./ParentView.vue";

export const Parent = component({
  model() {
    const counter = Counter.create({ step: 2 });

    return { counter };
  },
  view: ParentView,
});

export type ParentModel = { counter: ReturnType<typeof Counter.create> };
```

```vue
<!-- ParentView.vue -->
<script setup lang="ts">
import type { ReactiveModel } from "@virentia/vue";
import { Counter } from "./counter";
import type { ParentModel } from "./parent";

const props = defineProps<{ model: ReactiveModel<ParentModel> }>();
</script>

<template>
  <Counter :step="2" :model="model.counter" />
</template>
```

When a controlled model is passed to the child component, Vue still keeps `props`, `mounted`, `unmounted`, and `mounts` fresh. Unmounting the child view does not dispose the model; the parent owns it.

## Mapping props with `mapProps`

By default a component's **external props** — what you pass to it — are also the **model's props**. `mapProps` lets them differ: it receives the external props and returns the model props. It runs in `setup` (once for the initial props, then again whenever the external props change), so it can fold extra data into what the model receives.

```ts
export const Page = component({
  mapProps: (props: { slug: string }) => ({ ...props, uuid: crypto.randomUUID() }),
  model: createPageModel, // receives ModelContext<{ slug: string; uuid: string }>
  view: PageView,
});
```

The view still receives the **external** props (plus `model`); only the model sees the mapped props. Omit `mapProps` and the two coincide. Keep `mapProps` a pure transform of its argument — for reactive route/composable values, read them inside the model factory rather than here.

`.create(props)` takes the **model** props directly — it runs while a parent model is built, outside any setup, so there is no `mapProps` step there.

## Nested models with `@@shape`

A model is often composed from smaller sub-models. When a sub-model is a plain record of units, `useModel` and `component` unwrap it as-is. When it also carries helpers you do not want in the view, declare its bindable units with a `@@shape` property: the field then reaches the view as just those units (stores as refs), and the marker never leaks. Shapes nest, so this holds at any depth.

```ts
// profile-model.ts
import { event, reaction, store } from "@virentia/core";
import { SHAPE } from "@virentia/vue";

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
export function createProfileModel() {
  const name = createField("");
  const bio = createField("");
  const saved = event<void>();

  return { name, bio, saved };
}

export type ProfileModel = ReturnType<typeof createProfileModel>;
```

With `useModel`, each field arrives as `{ text, changed }` with `text` a ref — `isEmpty` stays out. Pull each ref into its own binding so the template auto-unwraps it:

```vue
<script setup lang="ts">
import { useModel } from "@virentia/vue";
import { createProfileModel } from "./profile-model";

const { name, bio, saved } = useModel(createProfileModel, {}); // no props
const nameText = name.text; // Readonly<Ref<string>>
const bioText = bio.text;
</script>

<template>
  <form @submit.prevent="saved()">
    <input :value="nameText" @input="name.changed(($event.target as HTMLInputElement).value)" />
    <input :value="bioText" @input="bio.changed(($event.target as HTMLInputElement).value)" />
  </form>
</template>
```

`component` binds the same model the same way — the view's `model` prop carries `model.name` and `model.bio` already unwrapped to their units:

```ts
import { component } from "@virentia/vue";
import { createProfileModel } from "./profile-model";
import ProfileView from "./ProfileView.vue";

export const Profile = component({
  model: createProfileModel,
  view: ProfileView,
});
```

```vue
<!-- ProfileView.vue -->
<script setup lang="ts">
import type { ReactiveModel } from "@virentia/vue";
import type { ProfileModel } from "./profile-model";

const props = defineProps<{ model: ReactiveModel<ProfileModel> }>();
const { name, bio, saved } = props.model;
const nameText = name.text;
const bioText = bio.text;
</script>

<template>
  <form @submit.prevent="saved()">
    <input :value="nameText" @input="name.changed(($event.target as HTMLInputElement).value)" />
    <input :value="bioText" @input="bio.changed(($event.target as HTMLInputElement).value)" />
  </form>
</template>
```

Reach for `@@shape` only when a sub-model mixes units with non-units. A sub-model that is a plain record of units needs no declaration — it already unwraps.

## Lifecycle Units

Factories receive `mounted`, `unmounted`, and `mounts`. Use them for model logic that should react to the UI lifetime: loading data on mount, pausing work when the last instance unmounts, or tracking how many mounted views share a cached model.

Lifecycle units are part of the model, not Vue lifecycle hooks disguised as model code. Prefer them when the result should be testable as part of the model.
