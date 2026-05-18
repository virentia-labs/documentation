---
title: Адаптеры схем
---

# Адаптеры схем

Валидация форм редко начинается с пустого листа. В проекте уже может быть
Zod-схема для API-контракта, Yup-схема для старого экрана или доменная функция,
которую нельзя заменить прямо сейчас.

`@virentia/forms` не встраивает собственный язык правил. Вместо этого адаптеры
превращают внешнюю библиотеку схем в обычный `FormValidator` или
`FieldValidator`. Форма продолжает отвечать за жизненный цикл, скоуп, состояние
ожидания, ошибки и зависимости от сторов.

## Zod для всей формы

Используйте адаптер формы, когда схема описывает итоговый объект значений
целиком.

```ts
import { createField, createForm } from "@virentia/forms";
import { zodValidator } from "@virentia/forms-zod";
import { z } from "zod";

const profileForm = createForm({
  schema: {
    name: createField(""),
    age: createField(0),
  },
  validation: zodValidator(
    z.object({
      name: z.string().min(1, "Введите имя"),
      age: z.number().min(18, "Доступно только взрослым"),
    }),
  ),
});

await profileForm.validate();
```

Что происходит:

- `profileForm.validate()` сначала валидирует дочерние поля;
- затем адаптер вызывает `safeParseAsync(values)`;
- ошибки Zod превращаются во вложенный объект ошибок;
- форма записывает эти ошибки в `innerErrors` соответствующих полей.

Например ошибка с путём `["user", "email"]` станет такой ошибкой:

```ts
{
  user: {
    email: "Некорректный email",
  },
}
```

Если несколько ошибок указывают на один путь, адаптер оставит первое сообщение.
Так пользователь видит самую раннюю и обычно самую понятную причину.

## Zod для одного поля

Адаптер поля удобен, когда правило принадлежит конкретному типу поля:
email, password, URL, slug.

```ts
import { createField } from "@virentia/forms";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const email = createField("", {
  validate: zodFieldValidator(
    z.string().email("Некорректный email"),
  ),
});

await email.validate();
```

Адаптер поля возвращает строку ошибки или `null`. Если Zod вернул несколько
ошибок, поле получает первое сообщение.

Более полезный вариант - собрать переиспользуемый тип поля:

```ts
import { createField, fieldType } from "@virentia/forms";

const primitive = fieldType({ create: createField });

export const emailField = primitive.extend({
  create(base, initial = "") {
    return {
      ...base(initial, {
        validate: [
          zodFieldValidator(z.string().min(1, "Введите email")),
          zodFieldValidator(z.string().email("Некорректный email")),
        ],
      }),
      kind: "email",
    };
  },
});
```

Теперь правила живут рядом с типом поля, а форма просто использует
`emailField()`.

## Yup для формы

Yup-адаптер решает ту же задачу, но использует `schema.validate`.

```ts
import { createField, createForm } from "@virentia/forms";
import { yupValidator } from "@virentia/forms-yup";
import * as yup from "yup";

const contactForm = createForm({
  schema: {
    name: createField(""),
    email: createField(""),
  },
  validation: yupValidator(
    yup.object({
      name: yup.string().required("Введите имя"),
      email: yup.string().required("Введите email").email("Некорректный email"),
    }),
  ),
});
```

Для валидации формы адаптер запускает Yup с `abortEarly: false`, чтобы собрать
ошибки по всем полям за один проход.

## Yup для поля

```ts
import { createField } from "@virentia/forms";
import { yupFieldValidator } from "@virentia/forms-yup";
import * as yup from "yup";

const title = createField("", {
  validate: yupFieldValidator(
    yup.string().required("Введите заголовок"),
  ),
});
```

Валидация поля использует `abortEarly: true`, потому что одному полю нужно
одно сообщение. Если нужно показать разные сообщения в правильном порядке,
используйте массив валидаторов.

```ts
const slug = createField("", {
  validate: [
    yupFieldValidator(yup.string().required("Введите slug")),
    yupFieldValidator(
      yup.string().matches(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
    ),
  ],
});
```

## Схема, зависящая от сторов

Иногда правила зависят от состояния приложения: тариф, регион, настройки
организации, фича-флаг. Адаптеры принимают не только схему, но и фабрику.
Фабрика получает `ValidationContext`.

```ts
import { store } from "@virentia/core";
import { zodValidator } from "@virentia/forms-zod";
import { z } from "zod";

const minimumAge = store(18);

const profileForm = createForm({
  schema: {
    age: createField(0),
  },
  validation: zodValidator((ctx) =>
    z.object({
      age: z.number().min(ctx.read(minimumAge), "Возраст ниже лимита"),
    }),
  ),
});
```

После первого `profileForm.validate()` форма запомнит, что фабрика схемы
прочитала `minimumAge`. Когда стор изменится в том же скоупе, форма запустит
валидацию заново.

Этот механизм полезен для правил, которые должны быть реактивными, но не должны
заставлять интерфейс вручную синхронизировать валидацию с внешним состоянием.

## Смешивание адаптера и ручных правил

Адаптер возвращает обычный валидатор. Его можно комбинировать с функциями и
эффектами Virentia.

```ts
const username = createField("", {
  validate: [
    zodFieldValidator(z.string().min(3, "Минимум 3 символа")),
    async (value, ctx) => {
      const reserved = ctx.read(reservedUsernames);
      return reserved.includes(value) ? "Имя зарезервировано" : null;
    },
  ],
});
```

Форма выполнит валидаторы по порядку и остановится на первой ошибке.
Асинхронная часть получит `ctx.signal`, если нужно отменять сетевые запросы.

## Когда выбирать адаптер поля, а когда адаптер формы

| Сценарий | Что использовать |
| --- | --- |
| Правило зависит только от одного значения | `zodFieldValidator` или `yupFieldValidator` |
| Правило сравнивает несколько полей | `zodValidator`, `yupValidator` или валидатор формы |
| Схема уже описывает API-объект | адаптер формы |
| Поле является переиспользуемым доменным примитивом | адаптер поля внутри `fieldType.extend` |
| Нужно читать сторы Virentia | фабрика схемы или ручной валидатор с `ctx.read` |

## Контракт

Zod:

```ts
function zodValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<z.output<Schema>, any>;

function zodFieldValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<z.output<Schema>, FieldError>;
```

Yup:

```ts
function yupValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<InferType<Schema>, any>;

function yupFieldValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<InferType<Schema>, FieldError>;
```

## Что дальше

- [Валидация](./validation) - жизненный цикл, стратегии, асинхронность и зависимости.
- [Типы полей](./field-types) - переиспользуемая настройка валидаторов.
- [Shape-поля](./shape-fields) и [array-поля](./array-fields) - как ошибки
  схемы ложатся на динамические поля.
- [API-справка](/ru/api/forms) - типы валидаторов и `ValidationContext`.
