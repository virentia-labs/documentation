# @virentia/vue API

Use `@virentia/vue` at the rendering boundary. Keep domain logic in `@virentia/core` models. Stores are exposed as refs; events and effects as callables bound to the scope.

## ScopeProvider

Provides a core scope to the component subtree rendered in its default slot.

Use it once per Vue tree that should share state. Nested trees can provide another scope when they need isolation.

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

Provides a scope from inside your own `setup`, instead of rendering `ScopeProvider`.

```ts
import { provideScope } from "@virentia/vue";

setup() {
  provideScope(appScope);
}
```

## useProvidedScope

Reads the provided scope.

Use it when a component needs to pass the scope into boundary helpers such as `scoped`, caches, or external adapters.

```ts
import { scoped } from "@virentia/core";
import { useProvidedScope } from "@virentia/vue";

setup() {
  const scope = useProvidedScope();
  const onClick = () => scoped(scope, () => saved());

  return { onClick };
}
```

It throws when there is no `ScopeProvider` above the component.

## useUnit

Reads stores and binds callable units to the provided scope. Stores become refs; events and effects become callables.

Use it for simple components that only need a few stores, events, or effects.

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
const increment = useUnit(incremented);
```

Object shape:

```ts
const { count, incremented, save, pending } = useUnit({
  count,
  incremented,
  save: saveFx,
  pending: saveFx.pending,
});
```

Array shape:

```ts
const [count, increment] = useUnit([counter.count, incremented] as const);
```

## useModel

Prepares a model object for rendering: stores become refs, events and effects become callables.

```ts
const { count, incremented } = useModel({
  count,
  incremented,
});
```

Creates a model from props. Pass props as a getter or ref (`MaybeRefOrGetter`) so changes flow into `context.props`.

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

Use a cache when the model should survive unmount:

```ts
const model = useModel(createChatModel, () => props, {
  cache: chatCache,
  key: props.chatId,
});
```

## component

Pairs a model factory and a view component.

Use it when the model belongs to the component lifecycle. It keeps creation, props, mount events, unmount events, and rendering in one pattern. The `view` receives the prepared `model` prop plus the model props.

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

Cached component:

```ts
export const ChatPanel = component({
  cache: chatCache,
  key: (props: { chatId: string }) => props.chatId,
  model: createChatModel,
  view: ChatPanelView,
});
```

Controlled component:

```ts
export const Parent = component({
  model() {
    const counter = Counter.create({ step: 2 });

    return { counter };
  },
  view: ParentView,
});
```

`.create(props)` lets a parent component model create and own a child component model. It must be called while the parent model is being built, because it captures the parent's scope. Passing `model` to the child keeps that child model controlled by the parent: the child updates `context.props` and emits lifecycle units while mounted, but it does not dispose a controlled model on unmount.

## createModelCache

Creates a scope-aware cache keyed by your ID.

Use it when a model should survive unmount and be reused later by key: chats, tabs, detail screens, media players, previews.

```ts
const chatCache = createModelCache<string, ChatProps, ChatModel>();
```

Read cached models:

```ts
chatCache.has("support", appScope);
chatCache.get("support", appScope);
chatCache.getInstance("support", appScope);
```

Dispose cached models:

```ts
chatCache.delete("support", appScope);
chatCache.clear(appScope);
```

The `scope` argument is optional; without it the cache searches across every scope it knows.

## ModelContext

Model factories receive:

Use this context when model logic depends on props, lifecycle, the current scope, or a cache key.

```ts
interface ModelContext<Props, Key = undefined> {
  readonly scope: Scope;
  readonly owner: Owner;
  readonly props: ReactiveWritable<Props>;
  readonly mounted: EventCallable<void>;
  readonly unmounted: EventCallable<void>;
  readonly mounts: StoreWritable<number>;
  readonly key: Key;
}
```

Use `mounted`, `unmounted`, and `mounts` for lifecycle logic inside the model.
