# Триггеры

Триггер запускает query или mutation при срабатывании юнита Virentia. Поскольку query *это* эффект, это просто `reaction`, который его вызывает, — но `trigger()` берёт на себя преобразование пейлоада, фильтрацию и очистку во владельце.

```ts
import { trigger } from "@virentia/net-core";

trigger(userQuery, {
  on: userRoute.opened,
  params: () => ({ id: userRoute.params.value.id }),
});
```

## Привязка

- `on` — любой юнит Virentia (событие, юнит жизненного цикла эффекта, стор) или их массив.
- `params?` — преобразует пейлоад во вход query. Опустите — пейлоад передаётся как есть.
- `filter?` — запускать только когда возвращает `true`.

`params` может **игнорировать пейлоад** и читать реактивное состояние — форма `() => ({ id: userRoute.params.value.id })` выше читает текущий параметр роута в момент срабатывания триггера.

```ts
trigger(searchQuery, {
  on: queryChanged,
  filter: (text: string) => text.trim().length > 2,
  params: (text: string) => ({ q: text }),
});
```

У query может быть сколько угодно независимых триггеров — разные события, разные преобразования:

```ts
trigger(feedQuery, { on: route.opened });
trigger(feedQuery, { on: pullToRefresh });
```

## Встроенная привязка

`config.trigger` у `query`/`mutation` — это `trigger()`, применённый при создании. Передавайте одну привязку или массив:

```ts
const pingQuery = query({
  handler: async (msg: string) => api.ping(msg),
  trigger: { on: ping },
});
```

## Очистка

`trigger()` возвращает функцию отписки. Вызванный внутри [владельца](/ru/core/owners), он также регистрирует очистку, поэтому привязка снимается при уничтожении владельца.

```ts
const stop = trigger(userQuery, { on: userRoute.opened });
stop(); // позже
```
