# Компоненты и self

Компонент связывает конкретное определение Core с view. Допустимы model и staticModel. `.model` возвращает исходное определение; отдельный UI-инстанс не создаётся.

```ts
component<M extends AnyModel>(config: ComponentConfig<M>): DefinedComponent<M>;
interface ComponentConfig<M extends AnyModel> {
  model: M;
  view: (props: ModelProps<M>, self: ComponentSelf<M>) => Child;
  keep?: boolean;
  id?: (props: ModelProps<M>) => string;
  root?: string;
}
type DefinedComponent<M extends AnyModel> =
  Component<ComponentInput<M>> & { readonly model: M };
type ComponentInput<M extends AnyModel> =
  | (ModelProps<M> & { model?: undefined; keep?: boolean })
  | (Partial<ModelProps<M>> & {
      model: InstanceOf<M> | Readable<InstanceOf<M> | null>;
      keep?: boolean;
    });
```

`ModelProps` строится из DTO/props модели: обычные входы допускают значение или Readable, ID — только строку. `ComponentOptions` содержит keep/id/root; предпочтительный способ deriving ID — `id(props)` в конфиге нативной модели. Component-level id остаётся низкоуровневым альтернативным селектором. `root` нужен только текущим embedded-адаптерам.

Без model-пропса runtime создаёт нативную модель. По умолчанию он уничтожает её при unmount; keep сохраняет её значения и юниты, не DOM. JSX keep переопределяет конфиг. Вложенные автоматические модели принадлежат родителю, а явные локальные ID квалифицируются его стабильной идентичностью.

С готовым model экземпляр принадлежит создателю. View вызывается при каждом подключении к DOM, не при создании модели и не при скалярных обновлениях. При повторном подключении DOM новый. Одновременные отображения запрещены, даже у разных компонентов с одной .model.

Создайте независимую модель один раз и передайте её через `model`:

```tsx
const counter = Counter.model.static();
// Каждый вызов .static() создаёт другую модель — сохраните нужный результат.
<Counter model={counter} />;
```

Рендерер привязывает её к своему скоупу. Unmount не уничтожает модель; та же
декларация в другом скоупе имеет отдельное состояние. Подробнее: [синглтоны моделей](/ru/models/instances#model-singleton).

## Типизированный контекст view

| Поле | Тип / значение |
| --- | --- |
| `self.model` | `InstanceOf<M>`, конкретный экземпляр |
| `self.id` | string, его текущий ID |
| `self.scope` | Scope экземпляра; для staticModel это не отдельное приложение |
| `self.instances` | `readonly InstanceOf<M>[]`, снимок живых моделей текущего приложения |
| `self.elementId(name)` | string, именованный DOM-ID с префиксом корня |
| `self.context(Context)` | `() => T`, реактивный доступ к ближайшему provider |
| `self.mounted / unmounted` | Юниты модели, если она имеет UI-trait |

Глобального self нет. Сохранённый аргумент view привязан к конкретному экземпляру и не переключится из-за вызова другой view.

`Component<P>` — тип функции описания `(props, self) => Child`; `ComponentProps<T>` извлекает JSX-входы. Чистые функции-фрагменты не получают скрытой модели или собственного ID. `View = () => Child` — явно повторяемый структурный участок. Создавайте юниты в модели, не во view.

`withRoot(component, tag)` добавляет метаданные одного стабильного тега; удобнее root в конфиге component. Ни один из вариантов не анализирует код функции.

[Владение моделями](../learn/setup-and-view) и [lifecycle](./refs-events).
