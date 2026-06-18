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

## Lifecycle Units

Factories receive `mounted`, `unmounted`, and `mounts`. Use them for model logic that should react to the UI lifetime: loading data on mount, pausing work when the last instance unmounts, or tracking how many mounted views share a cached model.

Lifecycle units are part of the model, not Vue lifecycle hooks disguised as model code. Prefer them when the result should be testable as part of the model.
