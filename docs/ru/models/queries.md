---
title: Запросы и индексы
---

# Запросы и индексы

Запросы фильтруют, сортируют и режут коллекцию. Используйте их вместо
`.items` с методами массивов: они едут по объявленным индексам, обновляются
реактивно и держат идентичность результата стабильной - ровно то, что нужно
списковым UI.

Дескрипторы полей живут на модели (`Todo.done`), так что для построения
запроса экземпляр в руках не нужен.

Примеры на этой странице выполняются в активном скоупе - см.
[Коллекции и экземпляры](./instances).

## Фильтрация

```ts
const Todo = staticModel({
  data: {
    title: f.string(),
    done: f.boolean(false).indexed(),
    priority: f.number(0).indexed("ord"),
  },
});

const todos = collection(Todo);

todos.add([
  { title: "a", priority: 1 },
  { title: "b", priority: 5, done: true },
  { title: "c", priority: 9 },
]);

todos.where(Todo.done.eq(false)).count;          // 2
todos.where(Todo.priority.between(2, 9)).ids;    // id «b» и «c»
todos.where(Todo.title.startsWith("a")).first;   // экземпляр «a»
```

Цепочка вызовов сужает выборку дальше; обычная функция - запасной выход,
она просто проходит по всем экземплярам:

```ts
todos
  .where(Todo.done.eq(false))
  .where((t) => t.title.value.length > 1);
```

## Сортировка и срезы

```ts
todos.sort(Todo.priority.desc).take(2).items; // топ-2 по приоритету
```

## Проекции и массовые операции

```ts
const done = todos.where(Todo.done.eq(true));

done.select(Todo.title);    // ["b"] - значения поля, не экземпляры
done.set(Todo.done, false); // запись каждому совпавшему
todos.where(Todo.priority.lt(2)).remove(); // dispose каждого совпавшего
```

## Один экземпляр по id

`get(id)` - реактивный вид одного экземпляра:

```ts
const view = computed(() => todos.get("42"));

view.value;              // null - ещё не загружен
todos.add({ id: "42", title: "x" });
view.value;              // экземпляр
todos.remove("42");
view.value;              // снова null - без throw посреди чтения
```

Он также разрешает старые id после [`rebind`](./wire#смена-id-rebind), так
что компонент с id из роута продолжает работать.

## Как сделать быстро

Без индексов запросы сканируют. Их объявление меняет план, а не код:

- `.indexed()` - `eq`-предикаты читают хеш-бакет;
- `.indexed("ord")` - диапазоны и `sort` по полю используют сортированный вид.

Индексы поддерживаются при записи, поэтому результаты никогда не устаревают;
сортированный вид перестраивается лениво при первом запросе после изменения -
тысяча записей за кадр стоит одну перестройку.

## Реактивность

Терминалы запросов - реактивные чтения. Computed или реакция над ними
перезапускаются, когда результат может измениться:

```ts
const activeCount = computed(() => todos.where(Todo.done.eq(false)).count);

activeCount.value;      // 2
todos.first!.done.value = true;
activeCount.value;      // 1 - пересчитано
```

## Стабильные результаты

Планы интернируются по форме; значения - bind-параметры. Цепочка,
пересобранная с нуля, возвращает те же массивы, пока результат не изменился:

```ts
const a = todos.where(Todo.priority.gte(2)).items;
const b = todos.where(Todo.priority.gte(2)).items;

a === b; // true

todos.first!.title.value = "переименовано"; // этот результат не задет
todos.where(Todo.priority.gte(2)).items === a; // по-прежнему true
```

Поэтому пересборку запроса на каждом рендере можно не считать: UI-биндинги
ререндерятся, только когда множество действительно изменилось.

## Контракт

```ts
interface Query<T> extends Iterable<T> {
  readonly items: T[];
  readonly ids: string[];
  readonly count: number;
  readonly first: T | null;

  where(predicate: Predicate | ((item: T) => boolean)): Query<T>;
  sort(by: SortToken): Query<T>;
  take(count: number): Query<T>;

  select(field: Descriptor): unknown[];
  set(field: Descriptor, value: unknown): void;
  remove(): void;       // массовый dispose
  toArray(): T[];
}

// операторы дескрипторов
Todo.field.eq(v)  .neq(v)  .gt(v)  .gte(v)  .lt(v)  .lte(v)
Todo.field.between(from, to)  .startsWith(prefix)  .includes(part)
Todo.field.asc  Todo.field.desc
```

Дескрипторы привязаны к своей модели - чужой дескриптор даёт ошибку, а не
пустой результат.

## Частые кейсы

Используйте запросы для:

- списковых экранов - фильтр + сортировка + `take`, пересобранные прямо в
  рендере;
- бейджей и счётчиков - computed над `count`;
- поиска по вторичному ключу - поле `.indexed().unique()` плюс `eq`;
- массовых действий - `set` и `remove()` на отфильтрованном запросе.

## Связанные разделы

- [Поля и данные](./fields) - объявление `.indexed()`-полей.
- [UI-биндинги](./bindings) - рендер запросов в React и Vue.
- [Объединения](./unions) - запросы по смешанным коллекциям.
