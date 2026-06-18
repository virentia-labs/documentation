# API @virentia/vue

Используйте `@virentia/vue` на границе рендера. Доменную логику держите в моделях `@virentia/core`. Сторы отдаются как ref; события и эффекты — как функции, привязанные к scope.

## ScopeProvider

Передает scope ядра поддереву компонентов, отрендеренному в его слоте по умолчанию.

Используйте его один раз на дерево Vue, которое должно разделять состояние. Вложенные деревья могут передать другой scope, когда им нужна изоляция.

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

## provideScope

Передает scope из вашего собственного `setup` вместо рендера `ScopeProvider`.

```ts
import { provideScope } from "@virentia/vue";

setup() {
  provideScope(appScope);
}
```

## useProvidedScope

Читает переданный scope.

Используйте, когда компоненту нужно передать scope в граничные хелперы вроде `allSettled`, кешей или внешних адаптеров.

```ts
import { allSettled } from "@virentia/core";
import { useProvidedScope } from "@virentia/vue";

setup() {
  const scope = useProvidedScope();
  const onClick = () => allSettled(saved, { scope });

  return { onClick };
}
```

Он бросает ошибку, если над компонентом нет `ScopeProvider`.

## useUnit

Читает сторы и привязывает вызываемые юниты к переданному scope. Сторы становятся ref; события и эффекты становятся функциями.

Используйте для простых компонентов, которым нужно лишь несколько сторов, событий или эффектов.

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
const increment = useUnit(incremented);
```

Объектная форма:

```ts
const { count, incremented, save, pending } = useUnit({
  count,
  incremented,
  save: saveFx,
  pending: saveFx.pending,
});
```

Форма массива:

```ts
const [count, increment] = useUnit([counter.count, incremented] as const);
```

## useModel

Подготавливает объект модели для рендера: сторы становятся ref, события и эффекты — функциями.

```ts
const { count, incremented } = useModel({
  count,
  incremented,
});
```

Создает модель из props. Передавайте props как getter или ref (`MaybeRefOrGetter`), чтобы изменения попадали в `context.props`.

```vue
<script setup lang="ts">
import { event, reaction, store } from "@virentia/core";
import { useModel } from "@virentia/vue";
import type { ModelContext } from "@virentia/vue";

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

const props = defineProps<{ step: number }>();
const { count, clicked } = useModel(createCounterModel, () => props);
</script>

<template>
  <button @click="clicked()">{{ count }}</button>
</template>
```

Используйте кеш, когда модель должна пережить размонтирование:

```ts
const model = useModel(createChatModel, () => props, {
  cache: chatCache,
  key: props.chatId,
});
```

## component

Связывает фабрику модели и view-компонент.

Используйте, когда модель принадлежит жизненному циклу компонента. Он держит создание, props, события монтирования и размонтирования и рендер в одном паттерне. `view` получает подготовленный prop `model` плюс props модели.

```ts
import { component } from "@virentia/vue";
import CounterView from "./CounterView.vue";

export const Counter = component({
  model({ props }: ModelContext<{ step: number }>) {
    const clicked = event<void>();
    const count = store(0);

    reaction({
      on: clicked,
      run() {
        count.value += props.step;
      },
    });

    return { clicked, count };
  },
  view: CounterView,
});
```

```vue
<!-- CounterView.vue -->
<script setup lang="ts">
import type { ReactiveModel } from "@virentia/vue";

const props = defineProps<{ step: number; model: ReactiveModel<CounterModel> }>();
const { count, clicked } = props.model;
</script>

<template>
  <button @click="clicked()">{{ count }}</button>
</template>
```

Кешированный компонент:

```ts
export const ChatPanel = component({
  cache: chatCache,
  key: (props: { chatId: string }) => props.chatId,
  model: createChatModel,
  view: ChatPanelView,
});
```

Controlled-компонент:

```ts
export const Parent = component({
  model() {
    const counter = Counter.create({ step: 2 });

    return { counter };
  },
  view: ParentView,
});
```

`.create(props)` позволяет модели родительского component создать и владеть моделью дочернего component. Его нужно вызывать во время сборки родительской модели, потому что он захватывает scope родителя. Передача `model` дочернему компоненту делает эту дочернюю модель управляемой родителем: дочерний компонент обновляет `context.props` и испускает юниты жизненного цикла, пока смонтирован, но не очищает controlled-модель при размонтировании.

## createModelCache

Создает scope-aware кеш с ключом по вашему ID.

Используйте, когда модель должна пережить размонтирование и быть переиспользована позже по ключу: чаты, вкладки, экраны деталей, медиаплееры, превью.

```ts
const chatCache = createModelCache<string, ChatProps, ChatModel>();
```

Чтение кешированных моделей:

```ts
chatCache.has("support", appScope);
chatCache.get("support", appScope);
chatCache.getInstance("support", appScope);
```

Удаление кешированных моделей:

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

Аргумент `scope` необязателен; без него кеш ищет по всем известным ему scope.

## ModelContext

Фабрики моделей получают:

Используйте этот контекст, когда логика модели зависит от props, жизненного цикла, текущего scope или ключа кеша.

```ts
interface ModelContext<Props, Key = undefined> {
  readonly scope: Scope;
  readonly owner: Owner;
  readonly props: StoreWritable<Props>;
  readonly mounted: EventCallable<void>;
  readonly unmounted: EventCallable<void>;
  readonly mounts: StoreWritable<number>;
  readonly key: Key;
}
```

Используйте `mounted`, `unmounted` и `mounts` для логики жизненного цикла внутри модели.
