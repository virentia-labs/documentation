# Mutation

`mutation(config)` — сторона записи. Это тот же эффект-с-операторами, что и [query](/ru/net/query) — `handler`, `params`, `use`, `executor` и `trigger` работают так же, — с двумя добавлениями для записи: **оптимистичные обновления** и **инвалидация**.

```ts
import { mutation } from "@virentia/net-core";

const renameUser = mutation({
  handler: async (name: string) => api.rename(name),
});
```

Вызывайте для запуска; читайте `renameUser.pending` и `renameUser.failData` ровно как у query.

## Инвалидация

`invalidates` перезапускает указанные query при успехе через их `refresh`, поэтому они перезагружаются с последними параметрами в скоупе:

```ts
const addTodo = mutation({
  handler: async (text: string) => api.add(text),
  invalidates: [todosQuery],
});

await scoped(app, () => addTodo("buy milk"));
// todosQuery перезапустился с последними параметрами
```

Передавайте один query или массив.

## Оптимистичные обновления

`optimistic.update` применяется в момент старта мутации; `optimistic.rollback` откатывает один раз, если мутация в итоге падает. Оба выполняются в скоупе мутации, поэтому сторы можно писать напрямую:

```ts
const items = store<string[]>([]);

const addItem = mutation({
  handler: async (name: string) => api.add(name),
  optimistic: {
    update: (name) => (items.value = [...items.value, name]),
    rollback: (name) => (items.value = items.value.filter((i) => i !== name)),
  },
});
```

Поскольку `optimistic` оборачивает *снаружи* `retry`, обновление применяется один раз и откат срабатывает один раз — после всех попыток, а не на каждую.

## Замечания

- Пересекающиеся отправки по умолчанию не согласованы; добавьте `concurrency` в `use` для сериализации или дедупа — см. [операторы](/ru/net/operators).
- Мутация предоставляет тот же стор `data` (последний результат) и `reset`. `cache()` нет — запись не кешируется.
