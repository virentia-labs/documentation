---
title: Типы полей
---

# Типы полей

Тип поля - это переиспользуемая фабрика поля. Используйте её, когда доменный
примитив должен везде нести одно и то же поведение: валидацию, нормализацию,
метаданные отображения или дополнительные методы.

Так схема формы остаётся читаемой. Форма говорит `emailField()`, а не повторяет
валидацию email на каждом экране.

## Расширение примитивного поля

```ts
import { createField, fieldType } from "@virentia/forms";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const primitive = fieldType({ create: createField });

const emailField = primitive.extend({
  create(base, initial = "") {
    const field = base(initial, {
      validate: [
        zodFieldValidator(z.string().min(1, "Введите email")),
        zodFieldValidator(z.string().email("Некорректный email")),
      ],
    });

    return {
      ...field,
      kind: "email",
      async normalize() {
        await field.fill(field.read().trim().toLowerCase());
      },
    };
  },
});

const email = emailField("");

await email.fill(" ADA@EXAMPLE.COM ");
await email.normalize();
```

Что происходит:

- `base` - предыдущая фабрика;
- расширение может изменить параметры, добавить методы или вернуть другой
  контракт поля;
- новая фабрика сохраняет тип результата;
- форма всё равно работает с результатом как с полем.

## В форме

```ts
const signup = createForm({
  schema: {
    email: emailField(""),
    password: passwordField(""),
  },
});
```

Схема теперь читается в доменных терминах. Валидация и нормализация остаются
рядом с типом поля.

## Контракт

```ts
function fieldType<Factory extends (...args: any[]) => AnyField>(config: {
  kind?: string;
  create: Factory;
}): FieldType<Factory>;

type FieldType<Factory extends (...args: any[]) => AnyField> = Factory & {
  extend<Args extends any[], NextField extends AnyField>(extension: {
    kind?: string;
    create(base: Factory, ...args: Args): NextField;
  }): FieldType<(...args: Args) => NextField>;
};
```

## Частые кейсы

- email, пароль, URL, slug, телефон;
- сумма, процент, диапазон дат;
- нормализация конкретного поля;
- стандартная настройка адаптера схемы;
- подсказки отображения на модели поля;
- доменные методы вроде `normalize`, `format` или `clearUpload`.

## Связанные разделы

- [Кастомные поля](./custom-fields) - структурные поля с дочерними моделями.
- [Адаптеры схем](./adapters) - Zod-валидатор внутри типов полей.
- [Модель поля](./fields) - фабрика примитивного поля.
