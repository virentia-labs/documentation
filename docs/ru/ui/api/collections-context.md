# Контейнеры, context и Portal

For переводит изменения источника в операции строк DOM. Он не выбирает ключи и не сопоставляет предыдущий список с новым.

```ts
For<M extends AnyModel>(props: ModelForProps<M>): ElementDescriptor;
For<T>(props: ForProps<T>): ElementDescriptor;
interface ForProps<T> {
  each: AnyModel | Iterable<T> | { readonly items: readonly T[] }
      | Readable<readonly T[]>
      | (() => Iterable<T> | { readonly items: readonly T[] });
  view?: Component<any> | ((item: Readable<T>, index: Readable<number>) => Child);
  children?: (item: () => T, index: () => number) => Child;
  fallback?: Child;
}
createContext<T>(defaultValue: T): Context<T>;
Portal(props: { mount: Element | DocumentFragment; children?: Child }): ElementDescriptor;
```

Основной синтаксис — `<For each={model.tasks} view={Row}/>`. Row — компонент модели строки; готовый экземпляр передаётся через model. `ModelForProps<M>` принимает определение M и автоматически использует его scoped collection.

Для обычных данных компонент получает props-юниты полей объекта; примитив передаётся как item. Чистая view-функция получает Readable item/index. Children-accessor — низкоуровневая альтернатива; один из view/children обязателен в runtime. fallback показывается при пустом списке.

Native collections/query и many-relations дают операции insert/remove/move. Mutable-массивы дают операции своих мутаций. Обычный computed-массив, wholesale replacement или контейнер без edit-feed полностью пересоздают строки с dev-предупреждением. Не храните модели в mutable-массивах.

## Context

`Context<T>` содержит id, defaultValue и Provider с value: `Binding<T>`. Ближайший Provider задаёт значение без DOM-обёртки. Получить реактивный доступ можно через `self.context(Theme)`. Если provider отсутствует, возвращается defaultValue.

Context — данные окружения view, не способ неявно заменить scope или владельца модели.

## Portal

Portal размещает детей в указанном существующем DOM-контейнере. Его subtree наследует scope и context и удаляется вместе с владельцем, не затрагивая соседние узлы внешнего контейнера. SSR Portal не поддерживается: транспорта в другой серверный контейнер нет.
