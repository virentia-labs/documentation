# Серверный рендеринг

Создайте отдельный scope для запроса, загрузите данные и соберите модельный граф. Затем получите HTML и снимок состояния.

```ts
const requestScope = scope();
const view = scoped(requestScope, () => createPage(data));
const html = renderToString(view, { scope: requestScope });
const snapshot = serialize(requestScope);
```

`createPage` — ваша функция, создающая модели и возвращающая view; рабочая реализация есть в [рецепте SSR](./recipes/ssr). `serialize` импортируется из Core, `renderToString` — из UI/server.

<UIFlow kind="ssr" />

На клиенте создайте scope со snapshot, восстановите тот же граф из загруженных данных и вызовите hydrate. Он подключает привязки к существующим узлам.

## Что переносится

Snapshot содержит JSON-значения writable SID-сторов и manifest идентичностей моделей. Задайте стабильные имена/SID моделей и одинаковый identifierPrefix серверному и клиентскому корню. Для сторов используйте явные SID или [Core-плагин](./api/compiler).

DOM-refs и computed-кэши не сериализуются. Состав коллекций надо воссоздать из исходных данных. Для JSON внутри script используйте serializeState или payload Start.

[Start](./start) собирает одну load/SSR-страницу. SSR нативного содержимого внутри React/Vue-адаптеров пока не поддерживается.
