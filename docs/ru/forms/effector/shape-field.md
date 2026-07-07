---
title: Shape-поле
---

# Shape-поле

[Shape-поле](../shape-fields) — `createShapeField(...)` в схеме — это
объект с динамическими ключами: одно значение поля, за которым стоит набор
дочерних полей, чьи ключи определяются в рантайме. После `formToEffector` оно
живёт в `model.fields.<name>` как **коллекционная линза** — та же поверхность
операторов, что и у [array-поля](./array-field), но с ключом по **самому
дочернему ключу**. Ключ _и есть_ стабильный id.

Это единственное отличие, которое стоит держать в голове:

- array-поле идёт с ключом по назначенному стабильному id, переживающему
  `move` / `swap` / `remove`;
- shape-поле идёт с ключом по своему строковому ключу (`"theme"`, `"avatarUrl"`,
  …), так что id, который вы передаёте в `ids(...)` и читаете обратно в `data.id`
  внутри `where`, — это и есть ключ.

Всё остальное — `ids`, `where`, `first` / `last` / `single`, `delete`,
`getSource`, `props` и item-api, агрегированный по совпавшим детям, — это
коллекционная линза, описанная в [Обзоре](./#вложенные-юниты-линза). Эта страница
предполагает ассоциацию и скоуп в текущем запуске; см.
[Обзор → Ассоциация скоупов](./#ассоциация-скоупов). Мост не создаёт скоуп сам;
триггерьте внутри него.

```ts
import { createField, createForm, createShapeField } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const attributes = createShapeField({ theme: createField("dark") });

const form = createForm({ schema: { attributes } });
const model = formToEffector(form);
```

`model.fields.attributes` — теперь линза над детьми с ключом по их ключу.

## Сужение по ключу

`ids(...)` выбирает детей по ключу. Так как ключ и есть id, именно так вы
добираетесь до конкретного именованного ребёнка и управляете его юнитами. Item-api
агрегирован по совпавшим детям, поэтому `model.fields.attributes.state.clock()`
срабатывает на _каждого_ ребёнка, а предварительное сужение ограничивает его
одним.

```ts
import { createEvent, sample } from "effector";

// Наблюдаем значение одного ребёнка.
model.fields.attributes.ids("theme").state.clock(); // Event<string>

// Управляем `change` одного ребёнка.
const themePicked = createEvent<string>();
sample({
  clock: themePicked,
  target: model.fields.attributes.ids("theme").change.target(),
});
```

Не указывайте `ids`, чтобы развернуться по всему shape:

```ts
// Один клок, срабатывающий при изменении значения любого ребёнка.
model.fields.attributes.state.clock().watch((value) => {
  console.log("какой-то атрибут изменился на", value);
});
```

## Фильтрация и чтение

`where` получает данные каждого ребёнка плюс его `id` (ключ). Для примитивного
ребёнка данные — это `{ value, id }`; для композитного — объект значения ребёнка
со слитым в него `id`. Используйте это, чтобы выбирать детей по содержимому, а не
по точному ключу.

```ts
// Все дети, чьё значение всё ещё пустое.
const empties = model.fields.attributes.where(
  (data) => data.value === "",
);

empties.state.clock().watch((value) => console.log("пустой ребёнок ->", value));
```

`getSource()` читает текущих совпавших детей с ключом по их ключу — простой
снимок, снятый вне любого окружающего скоупа:

```ts
model.fields.attributes.ids("theme", "avatarUrl").getSource();
// { theme: <field>, avatarUrl: <field> }
```

`delete()` — единственное структурное изменение, которое отдаёт линза: возвращает
`EventCallable<void>`, удаляющий каждого текущего совпавшего ребёнка.

```ts
import { sample } from "effector";

// Убрать всех пустых детей на сабмите.
sample({
  clock: model.submit,
  target: model.fields.attributes.where((data) => data.value === "").delete(),
});
```

## Добавление и удаление ключей

Кроме `delete()`, структурных изменений на линзе **нет**. Добавление ключа,
замена ребёнка или очистка shape — это методы shape-поля Virentia (`add`,
`remove`, `replace`, `clear`), а линза — это проекция чтения/управления, а не
редактор схемы. Держите ссылку на поле и вызывайте метод внутри скоупа Virentia
через `scoped`:

```ts
import { scoped } from "@virentia/core";
import { createField } from "@virentia/forms";

// `attributes` — это инстанс createShapeField(...) сверху.
await scoped(vScope, () =>
  attributes.add({ key: "avatarUrl", field: createField("") }),
);
```

Как только ключ появился, новый ребёнок подхватывается линзой автоматически —
`model.fields.attributes.ids("avatarUrl").change.target()` управляет им, а любой
уже объявленный `clock()` переподписывается при изменении состава. Если удобнее
оставаться в Effector-графе, оберните тот же вызов в эффект, привязанный к
`vScope`.

## Дальше

- [Кастомное поле](./custom-field) — shape-поле, вложенное в композитное поле, и
  как всплывают его юниты.
- [Рецепты](./recipes) — обвязка submit, серверные ошибки и зеркалирование в одном месте.
