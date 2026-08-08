---
layout: home

hero:
  name: Virentia
  text: The reactive stack for describing any business logic
  tagline: Build apps of any complexity. Scale them without the complications.
  image:
    src: /logo.svg
    alt: Virentia logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why Virentia
      link: /guide/ideology

features:
  - title: Learn once, create anything
    details: From a counter to a whole product, without changing the approach.
  - title: Real isolation
    details: "App, test, SSR request: separate states of one model."
  - title: Async included
    details: Cancellation, pending, and errors are part of the effect, not wiring around it.
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
