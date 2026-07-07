---
title: useForm
---

# useForm

`useForm(form)` отдаёт экрану состояние всей формы. Он подписывает компонент на
снапшот формы и возвращает обработчики, уже привязанные к ближайшему скоупу
(см. [Дайте скоуп](./) на странице обзора).

Представление несёт агрегированное состояние — `values`, `errors`,
`innerErrors`, `outerErrors`, `snapshot`, `isChanged`, `isValid`,
`isValidationPending` и карту `fields` — вместе с привязанными к скоупу
обработчиками `fill`, `reset`, `validate`, `submit`, `clearInnerErrors`,
`clearOuterErrors` и `forceUpdateSnapshot`.

Отдельные инпуты по-прежнему рисуются через [`useField`](./use-field); `useForm`
нужен для операций, затрагивающих форму целиком.

## Отправка формы

`useForm` управляет экраном: он читает агрегированные флаги и вызывает
`form.submit()` при отправке. Каждое поле рисуется через `useField`, поэтому
привязанные к скоупу обработчики есть на обоих уровнях.

```tsx
import { createField, createForm } from "@virentia/forms";
import { useForm } from "@virentia/forms-react";
import { zodFieldValidator } from "@virentia/forms-zod";
import { z } from "zod";

const signupForm = createForm({
  schema: {
    email: createField("", {
      validate: zodFieldValidator(z.string().email("Некорректный email")),
    }),
    password: createField("", {
      validate: zodFieldValidator(
        z.string().min(8, "Минимум 8 символов"),
      ),
    }),
  },
});

function SignupScreen() {
  const form = useForm(signupForm);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <TextInput label="Email" field={signupForm.fields.email} />
      <TextInput label="Пароль" field={signupForm.fields.password} />

      <button
        type="submit"
        disabled={form.isValidationPending || !form.isChanged}
      >
        Создать аккаунт
      </button>
    </form>
  );
}
```

Здесь `TextInput` читает каждое поле через [`useField`](./use-field), а экран
работает с операциями всей формы через `useForm`. Так обработчики, привязанные к
скоупу, есть на обоих уровнях.

## Жизненный цикл отправки

`form.submit()` запускает жизненный цикл валидации. Снапшот продвигается только
когда форма валидна: при успехе снапшот переходит к текущим значениям и
`form.isChanged` становится `false`; иначе ошибки остаются в соответствующих
полях, а снапшот не меняется.

Поэтому кнопка выше блокируется по `form.isValidationPending || !form.isChanged` —
отправлять нечего, пока идёт валидация или пока ничего не изменилось. Что именно
происходит во время `submit()` и `validate()`, описано в разделе
[Валидация](../validation).

## Серверные ошибки в интерфейсе

Ответ сервера обычно приходит после отправки формы. Его кладут во **внешний**
канал ошибок через `form.fill({ errors })`.

```tsx
async function saveProfile() {
  const result = await api.saveProfile(form.values);

  if (!result.ok) {
    await form.fill({
      errors: {
        email: result.errors.email,
      },
    });
    return;
  }

  await form.forceUpdateSnapshot();
}
```

`model.errors` внутри `TextInput` покажет серверную ошибку, потому что внешний
канал имеет приоритет над локальной валидацией — сообщение остаётся видимым,
даже пока пользователь продолжает вводить. Очистите его, когда локальные ошибки
должны снова взять верх:

```tsx
await form.clearOuterErrors();
```

При успехе `submit()` не создаёт нового снапшота — значения пришли из
обращения к серверу — поэтому вызовите `form.forceUpdateSnapshot()`, чтобы
пометить текущие значения как сохранённые и сбросить `isChanged`. Два канала
ошибок и их приоритет описаны в разделе [Ошибки](../errors).

## Контракт

```ts
interface FormView<Model extends Form> {
  readonly form: Model;
  readonly fields: Model["fields"];
  readonly values: unknown;
  readonly errors: unknown;
  readonly innerErrors: unknown;
  readonly outerErrors: unknown;
  readonly snapshot: unknown;
  readonly isChanged: boolean;
  readonly isValid: boolean;
  readonly isValidationPending: boolean;

  fill: Model["fill"];
  reset(): Promise<void>;
  validate(): Promise<void>;
  submit(): Promise<void>;
  clearInnerErrors(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  forceUpdateSnapshot(): Promise<void>;
}
```

Сама модель `form` описана в разделе [Форма](../form), а валидаторы,
подключаемые в `createField`, — в разделе [Адаптеры](../adapters).

## Что дальше

- [useWizard](./use-wizard) — управление многошаговым визардом, где каждый шаг —
  форма с гейтом по валидации.
