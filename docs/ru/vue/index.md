# Vue

`@virentia/vue` подключает модели ядра к компонентам Vue 3.

Доменную логику держите в `@virentia/core`, а к Vue подключайте через этот пакет. API повторяет `@virentia/react`, адаптированный к реактивности Vue: сторы возвращаются как ref, а события и эффекты — как функции, привязанные к scope.

## Передача scope

`ScopeProvider` передает scope поддереву Vue. Оберните в него часть дерева, которая должна разделять состояние.

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

Внутри собственного `setup` можно вызвать `provideScope(appScope)` вместо рендера компонента.

## Чтение стора

Сторы становятся ref. В шаблоне они разворачиваются автоматически; в скрипте используйте `.value`.

```vue
<script setup lang="ts">
const count = useUnit(model.count); // Readonly<Ref<number>>
</script>

<template>
  <span>{{ count }}</span>
</template>
```

## Вызов события

События и эффекты становятся функциями, привязанными к переданному scope.

```vue
<script setup lang="ts">
const count = useUnit(model.count);
const incremented = useUnit(model.incremented);
</script>

<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

## Использование модели

```vue
<script setup lang="ts">
const { count, incremented } = useModel(model);
</script>

<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

Сторы становятся ref. События и эффекты становятся функциями для вызова. Деструктурируйте модель, чтобы ref разворачивались как биндинги верхнего уровня в шаблоне.

## Быстрый вариант через component

`component` создает модель из props и передает в `view` уже подготовленную модель.

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

Для controlled-сценария создайте дочернюю модель из модели родительского компонента и передайте ее через `model`.

```vue
<template>
  <Counter :step="1" :model="counter" />
</template>
```

## Страницы Vue

- [useUnit](/ru/vue/use-unit)
- [Модели и компоненты](/ru/vue/models)
- [Кешированные модели](/ru/vue/cache)
