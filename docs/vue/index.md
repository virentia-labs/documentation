# Vue

`@virentia/vue` connects core models to Vue 3 components.

Keep state logic in `@virentia/core`. Use this package at the rendering boundary. The API mirrors `@virentia/react`, adapted to Vue's reactivity: stores come back as refs, events and effects as callables bound to the scope.

## Scope Provider

`ScopeProvider` is the Vue boundary for a scope. Wrap the subtree that should share state.

```vue
<script setup lang="ts">
import { scope } from "@virentia/core";
import { ScopeProvider } from "@virentia/vue";

const appScope = scope();
</script>

<template>
  <ScopeProvider :scope="appScope">
    <RouterView />
  </ScopeProvider>
</template>
```

Inside your own `setup` you can call `provideScope(appScope)` instead of rendering the component.

## Store Reading

Stores become refs. They auto-unwrap in templates; use `.value` in script.

```vue
<script setup lang="ts">
const count = useUnit(model.count); // Readonly<Ref<number>>
</script>

<template>
  <span>{{ count }}</span>
</template>
```

## Event Calls

Events and effects become callables bound to the provided scope.

```vue
<script setup lang="ts">
const count = useUnit(model.count);
const incremented = useUnit(model.incremented);
</script>

<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

## Model Usage

```vue
<script setup lang="ts">
const { count, incremented } = useModel(model);
</script>

<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

Stores become refs. Events and effects become callables. Destructure the model so the refs unwrap as top-level template bindings.

## Component Shortcut

`component` creates a model from props and passes the prepared model to `view`.

```ts
import { component } from "@virentia/vue";
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

const props = defineProps<{ model: ReactiveModel<CounterModel> }>();
const { count, incremented } = props.model;
</script>

<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

For controlled usage, create the child model from a parent component model and pass it through `model`.

```vue
<template>
  <Counter :step="1" :model="counter" />
</template>
```

## Vue Pages

- [useUnit](/vue/use-unit)
- [Models and component](/vue/models)
- [Cached Models](/vue/cache)
