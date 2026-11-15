# Сохранение экземпляров

По умолчанию автоматически созданная модель удаляется вместе с отображением. `keep: true` сохраняет модель в её scope, но не сохраняет DOM.

```tsx
const SavedCounter = component({
  model: CounterModel,
  keep: true,
  view: (_props, self) => <button onClick={self.model.increment}>
    {self.model.count}
  </button>,
});
```

Показывайте её со стабильным ID, например `<SavedCounter id="coffee" />`. После скрытия и повторного показа с тем же ID вернётся прежнее значение. View создаст новую кнопку.

Можно переопределить настройку для одного показа: `<SavedCounter id="temporary" keep={false} />`.

Когда сохранённый экземпляр больше не нужен:

```ts
const saved = scoped(appScope, () => CounterModel.get("coffee"));
await saved?.dispose();
```

`scoped` импортируется из Core. ID без явного значения каждый раз генерируется заново; для повторного открытия сохранённой модели используйте стабильный ID.

Переданный `model={counter}` и без keep остаётся у создателя. Для управляемых детей предпочтительнее [владение в родительской модели](./learn/setup-and-view).
