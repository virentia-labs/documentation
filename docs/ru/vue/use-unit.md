# useUnit

`useUnit` читает сторы и привязывает вызываемые юниты к переданному scope. Сторы возвращаются как ref; события и эффекты — как функции для вызова.

## Один стор

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
```

Ref обновляется, когда этот стор меняется в переданном scope, поэтому компонент перерисовывается. В скрипте используйте `count.value`, в шаблоне — `{{ count }}`.

## Одно событие

```ts
const incremented = useUnit(counter.incremented);
```

Возвращенная функция привязана к переданному scope.

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

## Объектная форма

Используйте, когда компоненту нужно несколько юнитов. Деструктурируйте, чтобы каждый ref и функция были биндингами верхнего уровня.

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

## Форма массива

```ts
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Эффекты

Эффекты тоже становятся функциями, а `effect.pending` — это стор, поэтому он становится ref.

```vue
<script setup lang="ts">
const { save, pending } = useUnit({
  save: saveFx,
  pending: saveFx.pending,
});
</script>

<template>
  <button :disabled="pending" @click="save(values)">Сохранить</button>
</template>
```
