---
title: React
---

# React

`@virentia/forms` не зависит от интерфейса. Это удобно для тестов, SSR и
переиспользуемых моделей фич, но компонентам всё равно нужен простой способ
читать сторы и вызывать методы формы в правильном скоупе Virentia.

`@virentia/forms-react` решает именно эту задачу:

- подписывает компонент на значения, ошибки и состояние ожидания;
- возвращает асинхронные обработчики, уже привязанные к ближайшему
  `ScopeProvider`;
- оставляет модель формы вне React, чтобы её можно было тестировать и
  переиспользовать без компонентов.

## Подключение скоупа

Сначала приложение должно отдать React-дереву скоуп Virentia.

```tsx
import { scope } from "@virentia/core";
import { ScopeProvider } from "@virentia/react";

const appScope = scope();

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <ProfileScreen />
    </ScopeProvider>
  );
}
```

Все хуки ниже читают именно этот скоуп. Если на странице два скоупа, одна и та
же модель формы может иметь два независимых состояния.

## Input поверх поля

Самый маленький React-слой обычно выглядит так: компонент получает модель поля,
а `useField` превращает её в представление для input.

```tsx
import type { FieldContract, FieldError } from "@virentia/forms";
import { useField } from "@virentia/forms-react";

interface TextInputProps {
  label: string;
  field: FieldContract<string, FieldError, string>;
}

function TextInput({ label, field }: TextInputProps) {
  const model = useField(field);

  return (
    <label>
      <span>{label}</span>
      <input
        value={model.value}
        aria-invalid={!model.isValid}
        onChange={(event) => void model.fill(event.currentTarget.value)}
      />
      {model.errors ? <span role="alert">{model.errors}</span> : null}
    </label>
  );
}
```

Что происходит:

- `useField(field)` подписывает компонент на `value`, `errors`,
  `isValid` и `isValidationPending`;
- `model.fill` вызывает `field.fill` внутри React-скоупа;
- `fill` возвращает `Promise<void>`, поэтому интерфейс может дождаться сложного
  кастомного поля с несколькими дочерними изменениями;
- компонент не знает, примитивное это поле или кастомное поле с тем же
  контрактом.

## Форма с отправкой

`useForm` нужен для состояния всей формы: общий `values`, `errors`,
`isChanged`, `isValid`, `submit`, `reset`.

```tsx
import { createField, createForm } from "@virentia/forms";
import { useField, useForm } from "@virentia/forms-react";
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

Здесь `TextInput` читает каждое поле через `useField`, а экран работает с
операциями всей формы через `useForm`. Так компонент получает обработчики,
привязанные к скоупу, на обоих уровнях.

`form.submit()` запускает жизненный цикл валидации. Если форма валидна, она
обновит снимок (`snapshot`) и `form.isChanged` станет `false`. Если нет -
ошибки останутся в соответствующих полях.

## Серверные ошибки в интерфейсе

Ответ сервера обычно приходит после отправки формы. Его можно положить во
внешний канал ошибок через `form.fill({ errors })`.

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

`model.errors` внутри `TextInput` покажет серверную ошибку, потому что внешний канал
имеет приоритет над локальной валидацией. Когда пользователь должен снова
видеть локальные ошибки, очистите внешний канал:

```tsx
await form.clearOuterErrors();
```

## Динамические поля

Для динамических объектов и array-полей интерфейс обычно читает набор дочерних
моделей из их сторов, а каждый элемент снова передаёт в `useField`.

```tsx
import { scoped } from "@virentia/core";
import { useProvidedScope, useUnit } from "@virentia/react";
import { createArrayField, createField } from "@virentia/forms";

const tags = createArrayField(["forms"], {
  createItem(value) {
    return createField(value);
  },
});

function TagsEditor() {
  const scope = useProvidedScope();
  const tagItems = useUnit(tags.items);

  return (
    <section>
      {tagItems.map((tag, index) => (
        <TagInput key={index} field={tag} />
      ))}

      <button
        type="button"
        onClick={() => void scoped(scope, () => tags.push(""))}
      >
        Добавить тег
      </button>
    </section>
  );
}

function TagInput({ field }: { field: ReturnType<typeof createField<string>> }) {
  const tag = useField(field);

  return (
    <input
      value={tag.value}
      onChange={(event) => void tag.fill(event.currentTarget.value)}
    />
  );
}
```

Здесь `tags.push` обёрнут в `scoped`, потому что это метод самого array-поля,
а не обработчик, возвращённый React-хуком. Методы из `useField`, `useForm` и
`useWizard` уже привязаны к текущему скоупу.

## Интерфейс визарда

Визард читается через `useWizard`. Текущий шаг хранит модель формы, поэтому экран
может выбрать компонент по `currentId`.

```tsx
import { useWizard } from "@virentia/forms-react";

function SignupWizardScreen() {
  const wizard = useWizard(signupWizard);

  return (
    <>
      {wizard.currentId === "account" ? <AccountStep /> : null}
      {wizard.currentId === "billing" ? <BillingStep /> : null}

      <footer>
        <button
          type="button"
          disabled={!wizard.canGoBack}
          onClick={() => void wizard.back()}
        >
          Назад
        </button>
        <button
          type="button"
          disabled={!wizard.canGoNext}
          onClick={() => void wizard.next()}
        >
          Дальше
        </button>
      </footer>
    </>
  );
}
```

`wizard.next()` валидирует текущую форму шага. Если она невалидна, переход не
произойдет, а поля шага покажут свои ошибки теми же компонентами, что и в
обычной форме.

## Контракт

`useField`:

```ts
interface FieldView<Value, Errors, Fill> {
  readonly field: NormalizedField<Value, Errors, Fill>;
  readonly value: Value;
  readonly errors: Errors;
  readonly innerErrors: Errors;
  readonly outerErrors: Errors;
  readonly isValid: boolean;
  readonly isValidationPending: boolean;
  readonly view: unknown;

  fill(payload: Fill): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  setInnerErrors(errors: Errors): Promise<void>;
  setOuterErrors(errors: Errors): Promise<void>;
  clearInnerErrors(): Promise<void>;
  clearOuterErrors(): Promise<void>;
}
```

`useForm`:

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

`useWizard`:

```ts
interface WizardView<Model extends Wizard> {
  readonly wizard: Model;
  readonly steps: unknown;
  readonly visibleSteps: unknown;
  readonly currentId: unknown;
  readonly currentIndex: number;
  readonly currentStep: unknown;
  readonly currentForm: unknown;
  readonly visitedIds: readonly unknown[];
  readonly completedIds: readonly unknown[];
  readonly canGoBack: boolean;
  readonly canGoNext: boolean;

  next(): Promise<boolean>;
  back(): Promise<boolean>;
  goTo(id: never): Promise<boolean>;
  complete(): Promise<boolean>;
  reset(): Promise<void>;
}
```

`useWizardForm` - alias для `useWizard`.

## Что дальше

- [Модель поля](./fields) - как сделать компонент интерфейса, который принимает любое поле по
  контракту.
- [Валидация](./validation) - что происходит при `submit()` и `validate()`.
- [Shape-поля](./shape-fields) и [array-поля](./array-fields) - как
  устроены динамические списки.
- [Визард-формы](./wizard) - навигация между формами шагов.
