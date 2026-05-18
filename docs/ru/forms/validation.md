---
title: Жизненный цикл валидации
---

# Жизненный цикл валидации

Валидация в Virentia Forms - это жизненный цикл. Ядро не поставляет правила
вроде `required` или `email`; оно решает, когда запускать валидаторы, как
отменять асинхронную работу, куда записывать результат и как отслеживать
зависимости от сторов.

Валидаторы - обычные функции или эффекты Virentia. Адаптеры схем тоже являются
валидаторами.

## Валидатор поля

Используйте валидатор поля, когда правило зависит от одного значения.

```ts
const username = createField("", {
  validate(value) {
    return value.length >= 3 ? null : "Минимум 3 символа";
  },
});

await username.validate();
```

Результат:

- успех пишет `null` в `innerError`;
- ошибка пишет возвращённое значение в `innerError`;
- `isValidationPending` отслеживает асинхронную работу;
- эмитится `validated` или `validationFailed`.

## Валидатор формы

Используйте валидатор формы, когда правило зависит от нескольких полей или
итогового объекта значений.

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
```

Валидация формы:

```
очистить внутренние ошибки
провалидировать дочерние поля
запустить валидаторы формы
записать возвращённые ошибки в дочерние поля
эмитить validated или validationFailed
```

Внешние ошибки не очищаются валидацией. Это поведение относится к
[каналам ошибок](./errors).

## Асинхронный валидатор

Валидаторы могут быть асинхронными. Для отменяемой работы используйте
`ctx.signal`.

```ts
const username = createField("", {
  async validate(value, ctx) {
    const response = await fetch(`/api/users/${value}`, {
      signal: ctx.signal,
    });
    const data = await response.json();

    return data.available ? null : "Имя уже занято";
  },
});
```

Если начнётся новый запуск валидации, предыдущий будет отменён, а устаревший
результат проигнорируется.

## Зависимости от сторов

Используйте `ctx.read(store)`, когда валидация зависит от состояния
приложения.

```ts
const reservedNames = store(["admin", "root"]);

const username = createField("", {
  validate(value, ctx) {
    return ctx.read(reservedNames).includes(value)
      ? "Имя зарезервировано"
      : null;
  },
});
```

После первого запуска валидации поле подпишется на сторы, прочитанные через
`ctx.read`. Когда зависимость изменится в том же скоупе, валидация запустится
снова.

## Стратегии

```ts
const email = createField("", {
  validate: emailValidator,
  validationStrategies: ["blur"],
});

const form = createForm({
  schema: { email },
  validationStrategies: ["change"],
});
```

| Стратегия | Когда запускается |
| --- | --- |
| `manual` | Прямой вызов `validate()` |
| `change` | Изменение значения |
| `blur` | Потеря фокуса полем |
| `focus` | Получение фокуса полем |
| `submit` | Жизненный цикл отправки формы |

`submit()` всегда валидирует форму перед успешной отправкой и обновлением
`snapshot`.

## Контракт

```ts
interface ValidationContext {
  readonly signal: AbortSignal;
  readonly path: readonly string[];
  read<T>(unit: Store<T> | StoreWritable<T>): T;
}

type ValidationResult<Errors> = Errors | null | undefined;

type ValidationFunction<Value, Errors> = (
  value: Value,
  ctx: ValidationContext,
) => ValidationResult<Errors> | Promise<ValidationResult<Errors>>;

type FieldValidator<Value, Errors = FieldError> =
  | ValidationFunction<Value, Errors>
  | ValidationEffect<Value, Errors>;

type FormValidator<Values, Errors> =
  | ValidationFunction<Values, Errors>
  | ValidationEffect<Values, Errors>;
```

## Частые кейсы

- правила обязательности, минимума и максимума на поле;
- правила равенства или зависимости между полями;
- асинхронные проверки доступности;
- валидаторы схем через адаптеры;
- правила, зависящие от сторов: тариф, регион, фича-флаг или настройки клиента.

## Связанные разделы

- [Каналы ошибок](./errors) - где хранится результат валидации.
- [Адаптеры схем](./adapters) - Zod и Yup как валидаторы.
- [Типы полей](./field-types) - переиспользуемая настройка валидаторов.
