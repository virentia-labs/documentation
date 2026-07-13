# useUnit

`useUnit` — мост между core-моделью и Vue-компонентом. Он читает сторы как ref и привязывает события и эффекты как вызываемые функции — всё в scope из ближайшего [`ScopeProvider`](/ru/vue/#scope-provider) (или `provideScope`). Компонент перерендеривается, когда прочитанный им стор меняется **в этом scope**.

Сторы возвращаются как ref, события и эффекты — как вызываемые. Передайте один юнит, массив или объект — форма результата повторяет форму входа.

## Один стор

```ts
const count = useUnit(counter.count); // Readonly<Ref<number>>
```

Ref обновляется, когда стор меняется в активном scope, поэтому компонент перерендеривается — и только для этого scope, так что тот же компонент под другим `ScopeProvider` покажет значение того scope. В скрипте используйте `count.value`, в шаблоне `{{ count }}` (авто-разворачивание).

## Событие или эффект

Возвращённая функция привязана к scope, поэтому вызов сразу диспатчит в нужный scope без лишней обвязки.

```ts
const incremented = useUnit(counter.incremented);
```

```vue
<template>
  <button @click="incremented(1)">{{ count }}</button>
</template>
```

Эффект вызывается так же и возвращает промис.

## Несколько юнитов сразу

Передайте **объект**, чтобы прочитать группу юнитов за один вызов. Деструктурируйте, чтобы каждый ref и вызываемая стали top-level биндингами (ref разворачиваются в шаблоне).

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

Или **массив**, когда позиционная привязка читается лучше:

```ts
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Кастомные shape через `@@shape`

Простую запись юнитов `useUnit` читает без всякой помощи. Свойство `@@shape` нужно для случая, когда объект несёт ещё и **не-юниты** — вспомогательные методы, конфиг, приватные поля, — а привязать хочется только часть. Объект объявляет свои привязываемые юниты через `@@shape`, и `useUnit` идёт по этому объявлению, а не перебирает все ключи, поэтому остальное остаётся нетронутым.

Создавайте такой объект **один раз** — в фабрике модели или в модульной области, но не в setup, потому что его юниты должны быть стабильны:

```ts
import { SHAPE, useUnit } from "@virentia/vue";

function createCounter() {
  const count = store(0);
  const incremented = event<number>();
  reaction({ on: incremented, run: (n) => (count.value += n) });

  return {
    count,
    incremented,
    isZero: () => count.value === 0, // метод, а не юнит
    [SHAPE]: { count, incremented }, // привязываем только юниты
  };
}

const counter = createCounter();

// В setup: `isZero` не привязывается, только объявленные юниты. `count` — это ref.
const { count, incremented } = useUnit(counter);
```

Объявление — это обычно сам объект shape. Также принимается форма **функции**, возвращающей shape, — на случай, когда shape выводится из самого объекта:

```ts
const source = {
  count,
  [SHAPE]() {
    return { count: this.count };
  },
};
```

Shape **вкладываются на любую глубину**: членом shape может быть либо простая запись юнитов, либо ещё один источник с `@@shape`, и `useUnit` разрешает всё дерево за один вызов — сторы на любом уровне возвращаются как ref.

```ts
const dashboard = {
  [SHAPE]: {
    header: { title: header.title }, // простая вложенная запись
    counter: createCounter(), // вложенный источник @@shape
  },
};

const { header, counter } = useUnit(dashboard);
// header.title.value, counter.count.value, counter.incremented(1)
```

Тот же протокол работает и для поля модели, прочитанного через `useModel` или `component`: поле, объявляющее `@@shape`, попадает во view как свои привязанные юниты, а маркер наружу не утекает. См. [Вложенные модели с `@@shape`](/ru/vue/models#вложенные-модели-с-shape).

## Эффекты и pending

`effect.pending` — это стор, поэтому он становится ref. Он публикуется сразу — вне транзакции — так что кнопка блокируется в момент старта эффекта.

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

Так же работают `effect.failData` (последняя ошибка), `effect.inFlight` (число выполняющихся вызовов) и другие [юниты эффекта](/ru/core/effects).

## Чтение среза стора

`useUnit(store)` обновляется при любом изменении стора. Когда компоненту нужна лишь часть большого стора, подпишитесь на **производный стор**, чтобы ref обновлялся только при изменении этой части.

```ts
const fullName = useUnit(userSlice);
// где, объявлено один раз рядом с моделью:
const userSlice = user.map((u) => `${u.first} ${u.last}`);
```

Объявляйте производный стор **один раз** — рядом с моделью, — чтобы он был стабилен. Создание `user.map(...)` внутри `setup` на меняющемся значении делало бы новый стор каждый раз.

Для значений из нескольких сторов или тяжёлых вычислений используйте `computed`:

```ts
const total = useUnit(cartTotal);
const cartTotal = computed(() => cart.value.items.reduce((sum, i) => sum + i.price, 0));
```

## Мутабельные сторы

[Мутабельный стор](/ru/mutable/) работает с `useUnit`, как любой стор, — но `useUnit(store)` читает всё значение, поэтому ref обновляется на каждый commit. Чтобы обновлять только при изменении среза, подпишитесь на этот срез через `map` или `computed`:

```ts
const cart = mutableStore({ items: [] as Item[], coupon: null as string | null });
const couponStore = cart.map((c) => c.coupon);

const coupon = useUnit(couponStore);
// `coupon.value` меняется только при изменении купона — `cart.value.items.push(...)` его не трогает.
```

Мутабельный draft трекает чтения по keypath, поэтому производный стор подписывается только на части, которые прочитал его селектор. См. [Гранулярная реактивность](/ru/mutable/#гранулярная-реактивность).

## `useUnit` против `useModel`

`useUnit` привязывает юниты, которые у вас уже есть. Когда состояние принадлежит самому компоненту — создаётся из пропсов и уничтожается при размонтировании — берите [`useModel` или `component`](/ru/vue/models): они строят модель и затем разворачивают её так же, как `useUnit`.
