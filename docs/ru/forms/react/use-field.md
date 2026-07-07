---
title: useField
---

# useField

`useField(field)` превращает контракт поля в представление для input. Хук
подписывает компонент на сторы поля — `value`, `errors`, `innerErrors`,
`outerErrors`, `isValid`, `isValidationPending`, `view` — и возвращает async-
обработчики, уже привязанные к ближайшему скоупу: `fill`, `reset`, `validate`,
`setInnerErrors`, `setOuterErrors`, `clearInnerErrors`, `clearOuterErrors`.

Убедитесь, что над компонентом дан скоуп — общая настройка `ScopeProvider`
описана в [обзоре раздела](./).

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

- `useField(field)` подписывает компонент на `value`, `errors`, `isValid` и
  `isValidationPending`;
- `model.fill` вызывает `field.fill` внутри React-скоупа;
- `fill` возвращает `Promise<void>`, поэтому интерфейс может дождаться сложного
  кастомного поля с несколькими дочерними изменениями;
- компонент не знает, примитивное это поле или кастомное поле с тем же
  контрактом.

## Заметки

- Каждый обработчик представления уже привязан к скоупу. `model.fill` (и
  остальные обработчики) не нужно оборачивать в `scoped` — это требуется только
  для методов, прочитанных прямо из модели поля.
- `fill` возвращает `Promise<void>`. Ожидание позволяет интерфейсу реагировать
  после того, как значение, его валидация и дочерние изменения улеглись.
- Один и тот же компонент работает и для примитивного поля, и для
  [кастомного поля](../fields) с тем же контрактом — `useField` смотрит
  только на форму контракта, а не на реализацию.

## Привязка событий поля

Представление отдаёт **множественное** `errors` и **не** включает события поля
`focus` / `blur`. Их привязывают через `useUnit` из `@virentia/react`.

```tsx
import { useField } from "@virentia/forms-react";
import { useUnit } from "@virentia/react";

function TextInput({ field }: TextInputProps) {
  const model = useField(field);
  const [focus, blur] = useUnit([field.focus, field.blur]);

  return (
    <input
      value={model.value}
      onFocus={() => void focus()}
      onBlur={() => void blur()}
      onChange={(event) => void model.fill(event.currentTarget.value)}
    />
  );
}
```

## Динамические дочерние поля

Для динамических объектов и array-полей интерфейс читает набор дочерних моделей
из их сторов, а каждый элемент снова передаёт в `useField`.

```tsx
import { scoped } from "@virentia/core";
import { createArrayField, createField } from "@virentia/forms";
import { useProvidedScope, useUnit } from "@virentia/react";

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

`useUnit(tags.items)` читает дочерние модели, и каждая снова попадает в
`useField`. `tags.push` обёрнут в `scoped`, потому что это метод самого
array-поля, а не обработчик, возвращённый React-хуком. Обработчики из `useField`
уже привязаны к текущему скоупу. Модель со стороны поля описана в
[array-полях](../array-fields).

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

Каналы `innerErrors` и `outerErrors` подчиняются тем же правилам приоритета, что
и модель поля — как они складываются в множественное `errors`, описано в
[валидации](../validation).

## Дальше

- [useForm](./use-form) — сабмит формы целиком и серверные ошибки.
- [useWizard](./use-wizard) — навигация по шагам с гейтом по валидации.
