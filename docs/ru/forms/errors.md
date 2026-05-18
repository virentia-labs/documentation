---
title: Каналы ошибок
---

# Каналы ошибок

У форм обычно два источника ошибок: локальная валидация и ответы сервера.
Если хранить их в одном месте, один источник постоянно затирает другой.
Локальный `validate()` прячет серверную ошибку; ответ сервера прячет то, что
пользователь может исправить локально.

Virentia Forms разделяет эти источники.

```ts
errors = outerErrors ?? innerErrors
```

`innerErrors` пишет валидация. `outerErrors` пишутся снаружи, обычно из
серверного ответа.

## Локальная ошибка

```ts
const slug = createField("", {
  validate(value) {
    return value.trim() ? null : "Введите slug";
  },
});

await slug.validate();

slug.innerError.value; // "Введите slug"
slug.outerError.value; // null
slug.error.value;      // "Введите slug"
```

## Серверная ошибка

Серверные ошибки пишутся через `fill({ errors })` на форме или `setOuterErrors`
на поле.

```ts
await articleForm.fill({
  errors: {
    slug: "Slug уже занят",
  },
});

articleForm.errors.slug; // "Slug уже занят"
```

Если валидация запустится снова, она обновит только `innerErrors`. Серверная
ошибка останется видимой, пока внешний канал не будет очищен.

```ts
await articleForm.validate();

articleForm.errors.slug; // всё ещё "Slug уже занят"

await articleForm.clearOuterErrors();
```

## Вложенные ошибки

Ошибки формы повторяют структуру схемы. Поэтому серверные ошибки и ошибки
адаптера схемы попадают в одно и то же место.

```ts
await profileForm.fill({
  errors: {
    contacts: {
      email: "Email уже используется",
    },
  },
});
```

То же правило работает для [shape-полей](./shape-fields) и
[array-полей](./array-fields): ошибки остаются под динамическим ключом или
индексом элемента.

## Контракт

```ts
interface FieldContract<Value, Errors = FieldError> {
  readonly errors?: Store<Errors>;
  readonly innerErrors?: Store<Errors>;
  readonly outerErrors?: Store<Errors>;

  setInnerErrors?(errors: Errors): Promise<void>;
  setOuterErrors?(errors: Errors): Promise<void>;
  clearInnerErrors?(): Promise<void>;
  clearOuterErrors?(): Promise<void>;
}

interface Form<Schema, Values, Errors> {
  readonly errors: Store<Errors>;
  readonly innerErrors: Store<Errors>;
  readonly outerErrors: Store<Errors>;

  fill(payload: {
    values?: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  clearOuterErrors(): Promise<void>;
  clearInnerErrors(): Promise<void>;
}
```

## Частые кейсы

- показать серверную валидацию после отправки;
- сохранить серверные ошибки при повторной локальной валидации;
- очистить серверные ошибки после пользовательского изменения;
- сохранить вложенные ошибки API для объектов и списков;
- показывать в интерфейсе один итоговый `errors`, не думая об источнике.

## Связанные разделы

- [Жизненный цикл валидации](./validation) - откуда берутся `innerErrors`.
- [Модель формы](./form) - как ошибки формы применяются к дочерним полям.
- [Адаптеры схем](./adapters) - как ошибки схемы становятся вложенными ошибками.
