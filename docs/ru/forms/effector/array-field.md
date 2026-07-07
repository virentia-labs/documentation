---
title: Array-поле
---

# Array-поле

Array-поле — `createArrayField(...)` в схеме — это упорядоченный список
повторяющихся элементов (см. [Array-поля](../array-fields)). После
`formToEffector` оно живёт в `model.fields.<name>` не как leaf-узел линзы, а как
**коллекционная линза**: проекция по элементам-инстансам с ключом по
**стабильному id**. Форма остаётся единственным источником истины; линза читает,
сужает, диспатчит в элементы и удаляет их — но не переизобретает список.

Всё здесь предполагает ассоциацию и скоуп в текущем запуске — см.
[Обзор → Ассоциация скоупов](./#ассоциация-скоупов). Мост не создаёт скрытый
скоуп; триггерьте внутри него.

```ts
import { createArrayField, createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const form = createForm({
  schema: {
    phones: createArrayField<string>([""]),
  },
});

const model = formToEffector(form);
```

## Действия элемента, агрегированные

Под коллекционной линзой элемент отдаёт ту же поверхность, что и обычное
[поле](./field): его стор-ы — watchable (`.clock()`), методы — targetable
(`.target()`). Вызванные прямо на коллекционной линзе, эти действия
**агрегируются по всем текущим совпавшим инстансам**.

```ts
// Срабатывает, когда обновляется value *любого* телефона.
model.fields.phones.state.clock();          // Event<string>

// Диспатчит в *каждый* инстанс телефона.
model.fields.phones.change.target();        // EventCallable<string>
```

Для композитного элемента (shape или группа на строку) сначала навигируйте в
форму элемента, затем выберите leaf-юнит:

```ts
// model.fields.rows === createArrayField(..., createItem: shape строки)
model.fields.rows.address.city.state.clock();
model.fields.rows.address.city.change.target();
```

Терминалы `.clock()` / `.target()` появляются только после навигации к leaf; в
корне коллекционной линзы агрегировать ещё нечего — там используйте операторы
выбора.

## Сужение до инстансов

Агрегация по всему списку нужна редко. Операторы выбора повторяют линзу
`@effector-kit/models` и каждый возвращает **суженную линзу** той же формы,
поэтому от результата продолжают цепочку действий элемента.

```ts
// По стабильному id.
model.fields.phones.ids("0").state.clock();
model.fields.phones.ids("0", "2").change.target();

// По предикату над данными каждого инстанса (+ его id).
model.fields.phones.where((p) => !p.value).change.target();

// Ровно до одного инстанса.
model.fields.phones.first().state.clock();
model.fields.phones.last().state.clock();
model.fields.phones.single().state.clock(); // совпадает, только когда он один
```

`where` получает данные инстанса плюс его `id`. Для **примитивного** элемента
данные — это `{ value, id }`; для **композитного** — объект-значение элемента
плюс `id`:

```ts
model.fields.phones.where((p) => p.value.startsWith("+7"));   // { value, id }
model.fields.rows.where((r) => r.quantity > 0);               // { title, quantity, id }
```

## Диспатч в совпавшие элементы

После сужения `.target()` диспатчит payload в каждый совпавший инстанс —
`sample` в него или вызов императивно внутри скоупа.

```ts
import { createEvent, sample } from "effector";

// Очистить одну конкретную строку.
sample({ clock: cleared, target: model.fields.phones.ids("0").change.target() });

// Перевалидировать каждый пустой телефон.
model.fields.phones.where((p) => !p.value).validate.target();
```

## Удаление совпавших элементов

`.delete()` возвращает `EventCallable<void>`, который удаляет **все текущие
совпавшие** инстансы. Это единственная структурная операция, которой владеет
линза.

```ts
import { sample } from "effector";

// Удалить каждый пустой телефон при сабмите.
const removeEmpty = model.fields.phones.where((p) => !p.value).delete();
sample({ clock: pruneClicked, target: removeEmpty });
```

Посмотреть, что суженная линза совпадает сейчас, можно через `.getSource()` —
совпавшие инстансы с ключом по стабильному id:

```ts
model.fields.phones.where((p) => !p.value).getSource();
// { "1": { value: "", id: "1" }, "3": { value: "", id: "3" } }
```

## Стабильные id

Каждому элементу присваивается стабильный id при первом появлении, в порядке
создания — `"0"`, `"1"`, `"2"`, … Id привязан к **инстансу** элемента, а не к его
позиции, поэтому переживает `move`, `swap` и `remove`: линза, суженная через
`.ids("0")`, продолжает указывать на тот же элемент после переупорядочивания
списка, а новые элементы получают свежие id, а не переиспользуют освободившиеся.

```ts
// phones = ["a", "b"]  ->  id "0", "1"
await scoped(vScope, () => form.fields.phones.swap(0, 1));
// phones = ["b", "a"]  ->  id всё те же "0" (=> "a"), "1" (=> "b")

model.fields.phones.ids("0").state.clock(); // всё ещё отслеживает "a"
```

## Добавление элементов

Коллекционная линза покрывает чтение, сужение, диспатч и **удаление**.
Структурные операции *добавления* (`push` / `unshift` / `insert`) на линзе
отсутствуют — выполняйте их на самом array-поле Virentia, внутри ассоциированного
скоупа, или отдельным эффектом-мостом:

```ts
import { scoped } from "@virentia/core";

// Напрямую, в скоупе Virentia текущего запуска.
await scoped(vScope, () => form.fields.phones.push(""));
```

После добавления новый элемент попадает в линзу автоматически — его стор-ы
появляются в агрегатных `.clock()` и он подхватывается `where` / `getSource`.

## Дальше

- [Shape-поле](./shape-field) — коллекционная линза над объектом с динамическими
  ключами вместо упорядоченного списка.
- [Рецепты](./recipes) — submit, серверные ошибки и зеркалирование в одном месте.
