---
title: Поле
---

# Поле

Leaf-поле — `createField(...)` в схеме — это наименьший узел, который проецирует
мост. После `formToEffector` оно живёт в `model.fields.<name>` как узел линзы:
каждый юнит, который отдаёт поле Virentia, отображается в набор **действий над
юнитом**, выбранный по виду юнита. Форма остаётся единственным источником истины;
узел линзы только читает и пробрасывает.

- Read-only юниты (`Store`, `Event`) становятся **watchable** — вы получаете
  `.clock(): Event<T>`.
- Writable юниты (`EventCallable`, `StoreWritable`, `Effect`) становятся
  **targetable** — вы получаете `.clock()` _и_ `.target(map?): EventCallable`.

Так что стор-ы поля (`state`, `error`, `isValid`, …) доступны только на чтение, а
его методы (`change`, `validate`, `fill`, …) можно вызывать.

| Watch (`.clock()`)                                            | Drive (`.target()` + `.clock()`)                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `state`, `error`, `innerError`, `outerError`, `isValid`,      | `change`, `focus`, `blur`, `validate`, `fill`, `reset`,                 |
| `isFocused`, `meta`, `isValidationPending`                    | `changeError`, `setInnerError`, `setOuterError`, `changeMeta`,          |
| `changed`, `focused`, `blurred`, `validated`,                 | `setInnerErrors`, `setOuterErrors`                                      |
| `validationFailed`, `errorsChanged`                           |                                                                         |

Всё на этой странице предполагает ассоциацию и скоуп в текущем запуске — см.
[Обзор → Ассоциация скоупов](./#ассоциация-скоупов). Мост не создаёт скоуп сам;
триггерьте внутри него.

## Чтение поля

Каждый стор становится `Event<T>`, который срабатывает на каждое обновление.
Используйте его как `clock`, `source` или наблюдайте напрямую.

```ts
model.fields.email.state.clock();               // Event<string>
model.fields.email.error.clock();               // Event<FieldError>
model.fields.email.isValidationPending.clock(); // Event<boolean>

model.fields.email.error.clock().watch((error) => {
  if (error) console.warn("email невалиден:", error);
});
```

Для чтения всей формы используйте стор-ы верхнего уровня — `model.$values`,
`model.$errors` — и выбирайте ключ. Линза поля уместна, когда нужны обновления
_одного_ поля как самостоятельный клок.

## Управление полем

Каждый метод поля — targetable. Вызовите `.target()` один раз, чтобы получить
`EventCallable`, затем либо делайте `sample` в него, либо вызывайте напрямую.

```ts
import { createEvent, sample } from "effector";

// Заводим внешнее Effector-событие прямо в поле.
const emailTyped = createEvent<string>();
sample({ clock: emailTyped, target: model.fields.email.change.target() });

// Или диспатчим императивно (внутри скоупа).
model.fields.email.change.target()("user@example.com");
```

Та же форма покрывает остальной жизненный цикл:

```ts
model.fields.email.validate.target();  // перезапустить валидаторы поля
model.fields.email.fill.target();      // задать значение + эмитнуть changed
model.fields.email.reset.target();     // вернуть initial значение/ошибки/мету
model.fields.email.focus.target();     // пометить как focused
model.fields.email.blur.target();      // пометить как blurred
```

### Серверная ошибка

У ошибок поля два слоя (см. [Каналы ошибок](../errors)). Кладите серверное
сообщение во **внешний** канал, чтобы внутренним по-прежнему владели собственные
валидаторы поля:

```ts
import { sample } from "effector";

sample({
  clock: model.submit.failData,
  filter: (error) => error.field === "email",
  fn: (error) => error.message,
  target: model.fields.email.setOuterError.target(),
});
```

### Маппинг внешних пропсов

`.target(map)` принимает _внешние_ пропсы и отображает их в payload юнита —
удобно, когда клок несёт больше, чем нужно полю:

```ts
const inputChanged = createEvent<{ name: string; value: string }>();

sample({
  clock: inputChanged,
  filter: ({ name }) => name === "email",
  target: model.fields.email.change.target(({ value }) => value),
});
```

## Сквозной пример

Внешнее событие управляет полем; наблюдатель реагирует на его стор ошибки — без
переписывания формы, всё состояние по-прежнему в Virentia.

```ts
import { createEvent, sample } from "effector";

const emailTyped = createEvent<string>();

// Управление: внешний ввод → field.change
sample({ clock: emailTyped, target: model.fields.email.change.target() });

// Валидация на blur уже настроена на поле; просто наблюдаем.
model.fields.email.error.clock().watch((error) => {
  render(error ? { state: "error", message: error } : { state: "ok" });
});
```

::: tip
`.change.target()` возвращает новый `EventCallable` при каждом вызове, поэтому
создайте его один раз и переиспользуйте, если нужна стабильная ссылка для
`sample` или `scopeBind`.
:::

## Валидация по-прежнему в поле

Мост пробрасывает триггеры; он не переизобретает валидацию. `validationStrategies`
поля (change / blur / focus / submit) по-прежнему срабатывают внутри поля
Virentia. Вызов `model.fields.email.blur.target()` помечает поле как blurred, и
если `blur` — стратегия, поле валидирует само себя и обновляет стор `error` —
который вы затем наблюдаете через `error.clock()`. Когда именно запускаются
валидаторы — см. [Жизненный цикл валидации](../validation).

::: warning
Не проталкивайте ошибки валидации через `changeError` / `setInnerError`, чтобы
«сымитировать» валидацию. Дайте собственным валидаторам поля владеть внутренним
каналом; `setOuterError` оставьте для сообщений извне формы (сервер).
:::

## Дальше

- [Array-поле](./array-field) — линза с ключом над упорядоченным списком элементов.
- [Рецепты](./recipes) — обвязка submit, серверные ошибки и зеркалирование в одном месте.
