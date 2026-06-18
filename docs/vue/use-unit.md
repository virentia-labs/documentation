# useUnit

`useUnit` reads stores and binds callable units to the provided scope. Stores come back as refs; events and effects come back as callables.

## Single Store

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
```

The ref updates when that store changes in the provided scope, so the component re-renders. Use `count.value` in script, `{{ count }}` in templates.

## Single Event

```ts
const incremented = useUnit(counter.incremented);
```

The returned function is bound to the provided scope.

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

## Object Shape

Use this when a component needs several units. Destructure so each ref and callable is a top-level binding.

```ts
const { count, incremented, reset } = useUnit({
  count: counter.count,
  incremented: counter.incremented,
  reset: counter.reset,
});
```

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

## Array Shape

```ts
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Effects

Effects become callables too, and `effect.pending` is a store, so it becomes a ref.

```vue
<script setup lang="ts">
const { save, pending } = useUnit({
  save: saveFx,
  pending: saveFx.pending,
});
</script>

<template>
  <button :disabled="pending" @click="save(values)">Save</button>
</template>
```
