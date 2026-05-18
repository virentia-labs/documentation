---
title: Модель формы
---

# Модель формы

Форма собирает поля в одну модель. Используйте её, когда несколько значений
должны вести себя как один объект: загрузить черновик, провалидировать поля
вместе, отправить, сбросить, отследить изменения или принять серверные ошибки.

Форма не заменяет поля. Она читает их, пишет partial updates в них и отдаёт
агрегированные сторы.

## Базовая форма

```ts
import { createField, createForm } from "@virentia/forms";

const profile = createForm({
  schema: {
    name: createField(""),
    age: createField(0),
  },
});

await profile.fill({
  values: {
    name: "Ada",
    age: 36,
  },
});

profile.read(); // { name: "Ada", age: 36 }
```

Что происходит:

- `schema` нормализуется в модели полей;
- `values` собирается из значений всех полей;
- `errors` повторяет структуру схемы;
- `fill({ values })` пишет частичные данные в подходящие поля;
- `reset()` сбрасывает каждое поле.

## Правило между полями

Валидаторы поля должны оставаться локальными к одному значению. Правила,
которые сравнивают несколько полей, кладите на форму.

```ts
const signup = createForm({
  schema: {
    password: createField(""),
    confirmPassword: createField(""),
  },
  validation(values) {
    return values.password === values.confirmPassword
      ? null
      : { confirmPassword: "Пароли не совпадают" };
  },
});

await signup.validate();
```

Возвращённые ошибки записываются в `innerErrors` дочерних полей, поэтому интерфейс
читает их так же, как ошибки валидации отдельного поля.

## Snapshot и changed state

`snapshot` - последнее принятое состояние значений. Успешный `submit()`
обновляет его. Ручное сохранение может вызвать `forceUpdateSnapshot()`.

```ts
await profile.fill({ values: { name: "Ada" } });
profile.isChanged.value; // true

await profile.submit();
profile.isChanged.value; // false
```

Это нужно для:

- кнопок сохранения;
- защиты от ухода со страницы;
- индикаторов несохранённых изменений;
- решения, нужно ли сохранять черновик.

## Projection формы

`pick` создаёт проекцию формы над теми же экземплярами полей. Это удобно для
шагов визарда и компонентов фичи, которые должны работать с частью большой
формы.

```ts
const accountStep = signup.pick({
  password: true,
  confirmPassword: true,
});

await accountStep.validate();
```

Проекция не копирует состояние. Если поле меняется через `accountStep`,
корневая форма видит то же изменение.

## Контракт

```ts
function createForm<Schema extends Record<string, any>>(config: {
  schema: Schema;
  validation?: FormValidator<any, any> | readonly FormValidator<any, any>[];
  validationStrategies?: readonly ValidationStrategy[];
}): Form<Schema>;

interface Form<Schema, Values, Errors> {
  readonly fields: NormalizeSchema<Schema>;
  readonly values: Store<Values>;
  readonly errors: Store<Errors>;
  readonly snapshot: Store<Values>;
  readonly isChanged: Store<boolean>;
  readonly isValid: Store<boolean>;
  readonly isValidationPending: Store<boolean>;

  fill(payload: {
    values?: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  submit(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  clearInnerErrors(): Promise<void>;
  forceUpdateSnapshot(): Promise<void>;
  pick(selection: SelectionShape<NormalizeSchema<Schema>>): FormProjection<any>;
  read(): Values;
}
```

## Частые кейсы

- редактирование профиля или сущности;
- filter forms, которые можно сбросить;
- серверные черновики, загруженные в поля;
- формы, разбитые на шаги визарда;
- сценарии отправки, где `snapshot` обновляется только после валидации.

## Связанные разделы

- [Модель поля](./fields) - из чего состоит форма.
- [Жизненный цикл валидации](./validation) - что запускают `validate()` и `submit()`.
- [Каналы ошибок](./errors) - как работает `fill({ errors })`.
- [Визард-формы](./wizard) - как проекции становятся шагами.
