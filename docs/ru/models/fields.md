---
title: Поля и данные
---

# Поля и данные

Поле объявляет одно типизированное значение сущности - и одновременно то, как
это значение выглядит в JSON. Используйте фабрики `f.*`, когда данные приходят
с сервера и должны на него вернуться: одна декларация разбирает вход,
валидирует его и сериализует обратно. Отдельного DTO-слоя, который нужно
синхронизировать, нет.

Примеры на этой странице выполняются в активном скоупе - см.
[Экземпляры моделей](./instances).

## Объявление полей

```ts
const Todo = staticModel({
  data: {
    title: f.string(),
    done: f.boolean(false),
  },
});

const t = Todo.create({ title: "написать доку" });

t.title.value; // "написать доку"
t.done.value;  // false - дефолт
t.json();      // { id: "...", title: "написать доку", done: false }
```

Что происходит:

- каждое поле становится стором на экземпляре (`t.title.value`);
- в объектной форме `data` ключ JSON совпадает с именем поля;
- поле с дефолтом опционально во входе; без дефолта - обязательно.

Недостающие обязательные ключи и неверные типы падают до любой записи:

```ts
Todo.create({});             // Error: creating requires missing keys: title
Todo.create({ title: 42 });  // Error: invalid "title" - Expected string
```

## Даты

`f.date` держит в модели `Date`, а в JSON - ISO-строку:

```ts
const Task = staticModel({
  data: { due: f.date().optional() },
});

const task = Task.create({ due: "2026-08-08T10:00:00.000Z" });

task.due.value;  // экземпляр Date
task.json().due; // "2026-08-08T10:00:00.000Z"
```

`.optional()` разрешает `null` и в модели, и в JSON.

## Переименование ключей JSON

Когда серверный ключ отличается от имени поля, используйте функциональную
форму `data`: она получает объект пропсов, и каждое поле привязывается явно.

```ts
import type { Props } from "@virentia/core/models";

const Todo = staticModel({
  data: (p: Props<{ name: string; is_done?: boolean }>) => ({
    title: f.string(p.name),              // ключ JSON "name"
    done: f.boolean(p.is_done.or(false)), // ключ "is_done", дефолт false
  }),
});

const t = Todo.create({ name: "написать доку" });

t.title.value;  // "написать доку"
t.json();       // { id: "...", name: "написать доку", is_done: false }
```

`p.key` привязывает обязательный ключ, `p.key.or(default)` делает его
опциональным с дефолтом.

## Локальные поля

В функциональной форме поле без привязки `p.*` - локальное: оно существует на
экземпляре, но не появляется в JSON и не принимается `add`.

```ts
const Todo = staticModel({
  data: (p: Props<{ name: string }>) => ({
    title: f.string(p.name),
    draft: f.string(""), // локальное - состояние UI, не данные
  }),
});

const t = Todo.create({ name: "x" });

t.draft.value = "несохранённая правка";
t.json(); // { id: "...", name: "x" } - без draft
```

## Трансформы

`p.key.map(input, output)` конвертирует между значением в JSON и значением в
модели:

```ts
data: (p: Props<{ tags: string }>) => ({
  tags: f.list(f.string(), p.tags.map(
    (wire) => wire.split(","),
    (value) => value.join(","),
  )),
}),
```

Односторонний трансформ (только `input`) выкидывает поле из `json()` с
предупреждением. Если так и задумано - пометьте `p.key.inOnly()`.

`.map` на поле забирает конверсию целиком: он получает сырое значение из
JSON, владеет обеими сторонами, и schema-валидация этого ключа становится
ответственностью самого `map`.

## Сборка типов

Любой тип собирается из `f.*`. Комбинаторы композируют вместе со схемами и
конверсии - `f.array(f.date())` держит в модели `Date[]`, а в JSON
ISO-строки, поэлементно:

```ts
const Track = staticModel({
  data: {
    marks: f.array(f.date(), []),
    meta: f.object({ due: f.date(), note: f.string() }),
    entry: f.tuple([f.string(), f.number()]),
    value: f.union([f.string(), f.number()]),
  },
});

const track = Track.create({
  marks: ["2026-08-08T10:00:00.000Z"],
  meta: { due: "2026-08-08T10:00:00.000Z", note: "hi" },
  entry: ["deploy", 1],
  value: "dark",
});

track.marks.value[0];       // Date
track.meta.value.due;       // Date
track.json().marks;         // ["2026-08-08T10:00:00.000Z"]
```

Что происходит:

- позиция элемента у каждого комбинатора принимает поле `f.*` или голую
  TypeBox-схему;
- вложенные конверсии применяются поэлементно, по ключам, по позициям
  кортежа;
- простые формы не аллоцируют конверсию вовсе;
- `f.union`/`f.intersect`/`f.recursive` отклоняют элементы с конверсиями
  (ветку конверсии выбрать нельзя) - вешайте `.map` на всё поле.

Рекурсивные значения описывают деревья одним полем:

```ts
outline: f.recursive<Node>((self) =>
  f.object({ label: f.string(), children: f.array(self) }),
),
```

## Контракт

```ts
// скаляры
f.string(default?)   f.number(default?)   f.integer(default?)
f.boolean(default?)  f.date(default?)     // в JSON - ISO-строка
f.literal(value)     f.enum(values, default?)  // строковые и числовые литералы
f.null(default?)     f.any(default?)      f.unknown(default?)

// комбинаторы - элементы: поля f.* или голые TypeBox-схемы
f.array(item, default?)        // f.list - алиас
f.tuple([a, b, ...], default?)
f.union([a, b, ...], default?)
f.intersect([a, b, ...], default?)
f.record(value, default?)
f.object(шейпПолей | schema, default?)
f.recursive((self) => item, default?)
f.from(schema, default?)       // любая TypeBox-схема как лист

field.optional()      // null допустим в модели и в JSON
field.indexed()       // хеш-индекс для eq-поиска
field.indexed("ord")  // упорядоченный индекс для диапазонов и сортировки
field.unique()        // дубль значения отклоняется при записи
field.meta({ ... })   // аннотации формата, вливаются в опции схемы

fn<Signature>()       // требование поведения для трейтов, не поле
f.arg(n)              // плейсхолдер схемы для параметризованных трейтов
```

Имена полей не могут совпадать с API экземпляра (`id`, `key`, `alive`,
`json`, `dispose`, `rebind`, ...) - такая декларация падает сразу.

## Частые кейсы

Используйте поля для:

- атрибутов серверных сущностей, которые ходят через JSON туда и обратно;
- значений, по которым фильтруют и сортируют запросы - добавьте `.indexed()`;
- вторичных ключей поиска - `.indexed().unique()` вместо второго id;
- UI-состояния на сущности - локальное поле в функциональной форме.

## Связанные разделы

- [Трейты](./traits) - как делить декларации полей между моделями.
- [Запросы и индексы](./queries) - что меняет `.indexed()`.
- [Загрузка и сериализация](./wire) - сериализация целиком.
