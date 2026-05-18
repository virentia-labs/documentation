---
title: Shape-поля
---

# Shape-поля

Shape-поле нужно, когда объект имеет динамические ключи. Схема формы по
умолчанию статична, но реальные экраны часто позволяют пользователю добавлять
произвольные ссылки, атрибуты, фильтры, фича-флаги или локализованные значения.

Shape-поле остаётся одним полем. Оно отдаёт одно значение-объект и управляет
набором дочерних полей внутри.

## Динамический объект

```ts
import { createField, createShapeField } from "@virentia/forms";

const links = createShapeField({
  website: createField(""),
});

await links.add({
  key: "github",
  field: createField(""),
});

await links.fill({
  website: "https://example.com",
  github: "https://github.com/virentia-labs",
});

links.read();
// {
//   website: "https://example.com",
//   github: "https://github.com/virentia-labs"
// }
```

## Неизвестные ключи с сервера

Если ключи заранее неизвестны, `createField` может создать дочернее поле во
время `fill`.

```ts
const attributes = createShapeField(
  {},
  {
    createField(key, value) {
      if (key.endsWith("Url")) {
        return urlField(String(value));
      }

      return createField(value);
    },
  },
);

await attributes.fill({
  avatarUrl: "https://example.com/avatar.png",
  theme: "dark",
});
```

## Контракт

```ts
function createShapeField<Shape extends Record<string, AnyField>>(
  initial: Shape,
  options?: {
    createField?(key: string, value: unknown): AnyField;
    validate?: FieldValidator<Record<string, unknown>, Record<string, unknown>>;
    validationStrategies?: readonly ValidationStrategy[];
  },
): ShapeField<Shape>;

interface ShapeField<Shape extends Record<string, AnyField>>
  extends FieldContract<ShapeValues<Shape>, ShapeErrors<Shape>> {
  readonly fields: Store<Readonly<Record<string, AnyField>>>;

  add(payload: { key: string; field: AnyField }): Promise<void>;
  remove(key: string): Promise<void>;
  replace(payload: { key: string; field: AnyField }): Promise<void>;
  clear(): Promise<void>;
}
```

## Частые кейсы

- ссылки профиля;
- произвольные атрибуты;
- фича-флаги;
- локализованные подписи по коду локали;
- динамические фильтры по имени поля;
- серверные черновики с неизвестными ключами объекта.

## Связанные разделы

- [Array-поля](./array-fields) - упорядоченные динамические коллекции.
- [Кастомные поля](./custom-fields) - shape-поле как дочернее доменное поле.
- [Каналы ошибок](./errors) - ошибки под динамическими ключами.
