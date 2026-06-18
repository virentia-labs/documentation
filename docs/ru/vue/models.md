# Модели и компоненты

Vue-компонентам часто нужно состояние, которое зависит от props и исчезает вместе с компонентом. В Virentia такое состояние все равно должно оставаться моделью ядра. Vue-пакет только создает ее в нужный момент и готовит к рендеру.

## Фабрики моделей

Фабрика модели получает `ModelContext`. Поле `props` — это стор, поэтому реакции могут читать актуальные props без пересоздания модели на каждый рендер.

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

Используйте фабрику, когда модель принадлежит одному экземпляру компонента, зависит от props или нуждается в юнитах жизненного цикла вроде `mounted` и `unmounted`.

## useModel

`useModel` создает модель один раз для экземпляра компонента и подготавливает ее для рендера. Сторы становятся ref; события и эффекты становятся функциями, привязанными к переданному scope.

Передавайте props как getter или ref (`MaybeRefOrGetter`), чтобы изменения props попадали в стор `props` модели.

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

Когда компонент размонтируется, работа, созданная фабрикой, будет очищена, если модель не была помещена в кеш.

## component

`component` упаковывает тот же паттерн в одно объявление: создать модель, поддерживать актуальные props, отправить события монтирования и размонтирования, подготовить модель и отрендерить view. `view` — это Vue-компонент, который получает подготовленный prop `model` плюс props модели.

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

Используйте `component`, когда модель принадлежит view. Используйте `useModel`, когда нужно вручную встроить модель в уже существующий компонент.

### Управляемая модель компонента

`component` также поддерживает controlled-сценарий. Возвращенный компонент имеет `.create(props)`, с помощью которого модель родительского component может создать и владеть моделью дочернего component. Вызывайте `.create()` во время сборки родительской модели — ему нужен scope родителя.

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

Когда controlled-модель передана дочернему component, Vue по-прежнему обновляет `props`, `mounted`, `unmounted` и `mounts`. Размонтирование дочернего view не очищает модель; ей владеет родитель.

## Юниты жизненного цикла

Фабрики получают `mounted`, `unmounted` и `mounts`. Используйте их для логики модели, которая должна реагировать на жизнь UI: загрузить данные при mount, поставить работу на паузу, когда размонтирован последний экземпляр, или понять, сколько view сейчас используют кешированную модель.

Юниты жизненного цикла — это часть модели, а не Vue-хуки, замаскированные под код модели. Предпочитайте их, когда результат должен тестироваться как часть модели.
