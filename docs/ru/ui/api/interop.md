# Embedded в React и Vue

Адаптеры показывают Virentia-компонент внутри родительского React/Vue-приложения. Рендер и точечные изменения DOM остаются на стороне Virentia. Обратное направление — React/Vue tree внутри UI — не входит в публичный API.

```ts
asReact<P extends object>(view: Component<P>): React.ComponentType<P & { id?: string }>;
asVue<P extends object>(view: Component<P>): Vue.DefineComponent<P & { id?: string }>;
```

## Владелец корня

Для текущих адаптеров объявите один стабильный intrinsic root: `component({ model, view, root: "button" })`. Хост создаёт именно эту кнопку, не wrapper. Virentia управляет её содержимым и атрибутами. Fragment или меняющийся корневой тег не поддерживаются; автоматический вывод произвольного корня без настроек не реализован.

Props публикуются только после host commit. Отменённый или suspended React-render не меняет нативную модель. Retarget обычных host inputs обновляет модель и её привязки без повторного view. React StrictMode replay сериализует native teardown/remount на том же host.

С готовым model scope берётся из его нативного binding, если нет явного Core provider. Provider имеет приоритет; несовпадение scope — ошибка. Для автономного embedded компонента создаётся локальный scope. Vue slots не рендерятся адаптером.

## Ограничения SSR и lifecycle

Host SSR пока выдаёт пустой стабильный корень. Native setup/view выполняются после клиентского commit; SSR содержимого Virentia внутри React/Vue не реализован. Standalone SSR работает отдельно.

React/Vue не ждут асинхронного удаления host-узла. Поэтому native unmounted-реакции завершаются, но подключённость DOM после await при host-unmount не гарантируется. Если нужна анимация ухода с DOM на месте, управляйте временем удаления на стороне хоста.

[Пример embedded](../interop) и [нативный SSR](./server-start).
