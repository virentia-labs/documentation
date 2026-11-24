---
layout: page
pageClass: virentia-landing
description: "Your next framework to create web applications. A reactive foundation for state, business logic, and async work."
---

<script setup>
import HomePage from "./.vitepress/theme/components/HomePage.vue";
</script>

<HomePage>

<template #model>

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

<template #view>

```tsx
import { component } from "@virentia/react";
import { createCounterModel } from "./model";

export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    const increment = () => model.incremented();

    return (
      <button onClick={increment}>
        {model.count}
      </button>
    );
  },
});
```

</template>

</HomePage>
