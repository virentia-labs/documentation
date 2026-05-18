---
title: Модель поля
---

# Модель поля

Поле - минимальная модельная единица в Virentia Forms. Используйте его, когда
одному значению нужен жизненный цикл: изменение, сброс, валидация, состояние
фокуса, метаданные или серверные ошибки.

Поле может жить внутри формы, внутри другого поля или отдельно. Это важная
граница: поле не является компонентом ввода; это модель одного участка
состояния формы.

## Базовое поле

```ts
import { createField } from "@virentia/forms";

const title = createField("");

await title.fill("Virentia");

title.read();      // "Virentia"
title.state.value; // "Virentia"
```

Что происходит:

- `state` - стор Virentia;
- `fill` записывает новое значение и эмитит `changed`;
- `read` возвращает значение в текущем скоупе;
- `reset` возвращает начальное значение, начальные ошибки, состояние фокуса и
  метаданные.

## Валидация поля

```ts
const username = createField("", {
  validate(value) {
    return value.trim().length >= 3 ? null : "Минимум 3 символа";
  },
});

await username.validate();

username.error.value;   // "Минимум 3 символа"
username.isValid.value; // false
```

Валидация поля подходит для правил, которым нужно одно значение. Если правило
сравнивает несколько полей, кладите его на [модель формы](./form).

## Метаданные и фокус

`meta` нужен для состояния, которое относится к полю, но не должно попадать в
отправляемое значение.

```ts
const price = createField(0, {
  meta: {
    touchedByUser: false,
  },
});

await price.changeMeta({ touchedByUser: true });
await price.focus();
await price.blur();
```

Частые варианты метаданных:

- режим отображения доменного поля;
- источник последнего изменения;
- флаг ручной нормализации;
- подсказки для отображения, связанные с конкретным полем.

## Контракт

```ts
function createField<Value, Meta extends object = Record<string, never>>(
  initial: Value,
  options?: {
    error?: FieldError;
    meta?: Meta;
    validate?: FieldValidator<Value> | readonly FieldValidator<Value>[];
    validationStrategies?: readonly ValidationStrategy[];
  },
): Field<Value, Meta>;

interface Field<Value, Meta extends object = Record<string, never>>
  extends NormalizedField<Value, FieldError, Value> {
  readonly error: Store<FieldError>;
  readonly innerError: Store<FieldError>;
  readonly outerError: Store<FieldError>;
  readonly meta: Store<Meta>;
  readonly isFocused: Store<boolean>;

  fill(value: Value): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  focus(): Promise<void>;
  blur(): Promise<void>;
  changeMeta(meta: Meta): Promise<void>;
}
```

## Частые кейсы

Примитивное поле подходит для:

- текстовых, числовых, булевых, select- и date-значений;
- поисковых фильтров с валидацией и сбросом;
- локальных моделей, которые позже могут стать частью формы;
- полей, переиспользуемых несколькими экранами;
- простых значений внутри [shape-полей](./shape-fields) и
  [array-полей](./array-fields).

## Связанные разделы

- [Модель формы](./form) - как поля становятся одним объектом значений.
- [Жизненный цикл валидации](./validation) - как запускаются валидаторы.
- [Каналы ошибок](./errors) - зачем у поля два слоя ошибок.
- [Кастомные поля](./custom-fields) - как несколько полей дают одно значение.
