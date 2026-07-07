# Асинхронный поиск

Этот рецепт держит текст запроса, состояние загрузки, результаты и логику поиска в одной модели.

## Модель

```ts
import { effect, event, reaction, store, reactive } from "@virentia/core";

const queryChanged = event<string>();
const submitted = event<void>();

const query = store("");
const status = store<"idle" | "loading" | "ready" | "failed">("idle");
const results = reactive({ items: [] as string[] });

const searchFx = effect(async (text: string) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
  return (await response.json()) as string[];
});
```

## Правила

```ts
reaction({
  on: queryChanged,
  run(text) {
    query.value = text;
  },
});

reaction({
  on: submitted,
  run() {
    void searchFx(query.value);
  },
});

reaction({
  on: searchFx.started,
  run() {
    status.value = "loading";
  },
});

reaction({
  on: searchFx.doneData,
  run(items) {
    results.items = items;
    status.value = "ready";
  },
});

reaction({
  on: searchFx.failData,
  run() {
    status.value = "failed";
  },
});
```

## Запуск

```ts
const appScope = scope();

await scoped(appScope, () => queryChanged("virentia"));
await scoped(appScope, () => submitted());

scoped(appScope, () => {
  console.log(status.value); // ready
  console.log(results.items); // ["virentia:first", "virentia:second"]
});
```
