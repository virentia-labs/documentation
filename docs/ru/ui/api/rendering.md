# Рендер и DOM

`render` создаёт отображение в контейнере. `hydrate` присваивает уже существующие серверные узлы. Оба требуют явного scope и возвращают асинхронную функцию размонтирования.

```ts
interface RenderOptions {
  scope: Scope;
  owner?: Owner;
  identifierPrefix?: string;
}
render(factory: () => Child, container: Element | DocumentFragment, options: RenderOptions): () => Promise<void>;
hydrate(factory: () => Child, container: Element | DocumentFragment, options: RenderOptions): () => Promise<void>;
h<P extends object>(type: string | Component<P> | symbol, props?: P | null, ...children: Child[]): ElementDescriptor;
mergeProps(...sources: (Record<string, unknown> | (() => Record<string, unknown> | null | undefined))[]): Record<string, unknown>;
```

`owner` задаёт внешний lifetime приложения или теста, включая автоматически созданные сохранённые модели. Без него сохранённая модель живёт в своём scope до явного dispose. Для нескольких корней используйте разные контейнеры; в одном scope они разделяют состояние, но unmount независим.

`identifierPrefix` участвует в именованных DOM-ID. На сервере и клиенте он должен совпадать. Не путайте его с ID модели.

Переданная модель из другого scope и повторное отображение одного активного экземпляра отклоняются. При начальной ошибке частично созданные bindings/DOM освобождаются. Hydration mismatch оставляет серверные узлы на месте; библиотека не делает молчаливый fallback на client render.

`h` и `createElement` — одна функция. Они возвращают инертное описание; view не вызывается при создании этого описания. Fragment группирует детей без элемента. DOM-узлы можно передать в клиентский render, но не в SSR.

`mergeProps` — низкоуровневое объединение источников с поздним чтением. Поздний источник выигрывает при одинаковом ключе. Обычные JavaScript spread/destructuring могут получить снимок значения; переданный юнит сам по себе не теряет реактивность.

Изменение скалярного юнита меняет существующий текст или свойство. Функция Child — структурный участок: её изменение пересоздаёт диапазон целиком, без сравнения тегов и детей.

[Refs и события](./refs-events) описывают DOM-параметры; [SSR](./server-start) — серверную границу.
