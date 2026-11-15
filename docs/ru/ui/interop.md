# Virentia внутри React или Vue

Сначала объявите обычный нативный component с model и view. Для нынешнего adapter укажите стабильный root-тег. Затем asReact/asVue возвращает компонент хоста.

```tsx
const NativeCounter = component({ model: CounterModel, root: "button",
  view: (_props, self) => <button onClick={self.model.increment}>{self.model.count}</button>,
});
const ReactCounter = asReact(NativeCounter);
const VueCounter = asVue(NativeCounter);
```

React создаёт эту кнопку на месте ребёнка; Vue тоже создаёт именно её. Дополнительного layout-элемента нет. После commit Virentia управляет содержимым и подписками, не требуя host rerender для изменения count.

Можно передать готовый model — scope будет выведен из него при отсутствии Core provider. Для autonomous экземпляра используется локальный scope. Provider с несовпадающим scope отклоняется.

Это пока ограниченный embedded-контракт, а не универсальная автоматическая интеграция произвольных корней. Native content SSR внутри хоста и гарантированное удержание connected DOM после async host-unmount не реализованы. [Ограничения и типы](./api/interop).
