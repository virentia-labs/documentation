# Scope

Scope хранит значения сторов и коллекции моделей одного приложения. Два scope могут использовать одно определение модели и одинаковые ID, не разделяя значения.

<UIFlow kind="scope" />

```ts
const first = scope();
const second = scope();
const a = scoped(first, () => CounterModel.create({
  id: "coffee", count: 1,
}));
const b = scoped(second, () => CounterModel.create({
  id: "coffee", count: 5,
}));
await a.increment();
// a.count.value === 2; b.count.value === 5
```

`scope` и `scoped` импортируются из UI. Готовый экземпляр привязан к своему scope: вызывая его action, не нужно повторно входить в scoped.

## Подключение к DOM

В render передаётся scope, в котором создана модель. Другой scope вызовет ошибку до изменения DOM.

Несколько корней могут разделять один scope и состояние. Их контейнеры и размонтирование при этом независимы.

В параллельных тестах создавайте scope внутри теста. На сервере — внутри обработки запроса. См. [Vitest](../api/testing) и [SSR](../ssr).

## Контекст после await

Прямой await юнита Virentia сохраняет контекст действия. Для произвольного await fetch такой гарантии нет. После него используйте привязанный экземпляр или явно вызовите scoped с нужным scope.
