---
layout: home

hero:
  name: Virentia
  text: Реактивный стек для описания любой бизнес-логики
  tagline: Создавайте приложения любой сложности. Масштабируйте их без сложностей.
  image:
    src: /logo.svg
    alt: Логотип Virentia
  actions:
    - theme: brand
      text: Начать
      link: /ru/guide/getting-started
    - theme: alt
      text: Почему Virentia
      link: /ru/guide/ideology

features:
  - title: Выучи единожды — создавай что угодно
    details: От счётчика до целого продукта, не меняя подхода.
  - title: Реальная изоляция
    details: "Приложение, тест, SSR-запрос: независимые состояния в рамках одной модели."
  - title: Встроенная работа с асинхронностью
    details: Отмена, pending и ошибки — часть сайд-эффекта, а не обвязка вокруг.
---

<CodeRow>
<template #left>

```ts
import { event, reaction, store } from "@virentia/core";

export function createCounterModel() {
  const incremented = event<void>();
  const count = store(0);

  reaction({
    on: incremented,
    run() {
      count.value += 1;
    },
  });

  return { count, incremented };
}
```

</template>

<template #right>

```tsx
import { component } from "@virentia/react";
import { createCounterModel } from "./model";

export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    const increment = () => model.incremented();

    return <button onClick={increment}>{model.count}</button>;
  },
});
```

</template>
</CodeRow>
