---
title: useWizard
---

# useWizard

`useWizard(wizard)` читает [визард](../wizard) в вид для многошагового
экрана. Он подписывает компонент на стор-ы визарда — `steps`, `visibleSteps`,
`currentId`, `currentIndex`, `currentStep`, `currentForm`, `visitedIds`,
`completedIds`, `canGoBack` и `canGoNext` — и возвращает async-обработчики, уже
привязанные к ближайшему скоупу: `next()`, `back()`, `goTo(id)`, `complete()` и
`reset()`.

Обработчики навигации `next()`, `back()`, `goTo(id)` и `complete()` возвращают
`Promise<boolean>` — `true`, когда переход произошёл, и `false`, когда его
заблокировала валидация. `reset()` возвращает `Promise<void>`.

Убедитесь, что над компонентом задан скоуп — общая настройка `ScopeProvider`
описана в [обзоре раздела](./).

`useWizardForm` — alias для `useWizard`; используйте то имя, которое лучше читается
рядом с `createWizardForm`.

## Экран визарда

Текущий шаг хранит модель формы, поэтому экран может выбрать компонент по
`currentId` и заблокировать кнопки «Назад» и «Дальше» по `canGoBack` /
`canGoNext`.

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

Кнопки заблокированы на краях: `!canGoBack` на первом шаге, `!canGoNext` на
последнем. Клик по ним вызывает `wizard.back()` и `wizard.next()` — оба уже
привязаны к скоупу.

## Валидация гейтит «Дальше»

`wizard.next()` валидирует текущую форму шага. Если она невалидна, переход не
произойдёт, а поля шага покажут ошибки теми же компонентами, что и в обычной
форме — ошибки остаются внутри модели формы этого шага.

```tsx
async function goForward() {
  const moved = await wizard.next();

  if (!moved) {
    // остались на текущем шаге; его поля теперь показывают ошибки валидации
  }
}
```

Поэтому `next()` возвращает `Promise<boolean>`: `true`, когда шаг был валиден и
визард продвинулся, `false`, когда остался на месте. `goTo(id)` и `complete()`
следуют тому же контракту — см. [валидацию](../validation) о том, что
запускается внутри `step.form.validate()`, и [useForm](./use-form) о том, как
форма показывает эти ошибки.

## Чтение формы шага

Каждый компонент шага читает свою форму через [useForm](./use-form) и
отрисовывает её поля так же, как любая форма. Визард только решает, какой шаг
текущий и разрешена ли навигация; сами поля — это обычные поля формы.

```tsx
import { useForm } from "@virentia/forms-react";

function AccountStep() {
  const form = useForm(signupWizard.form.pick({ email: true, password: true }));

  return (
    <>
      <TextInput label="Email" field={form.fields.email} />
      <TextInput label="Пароль" field={form.fields.password} />
    </>
  );
}
```

Поскольку шаги — это проекции формы над теми же экземплярами полей, значения,
которые редактирует шаг, попадают прямо в корневую форму и в `wizard.read()`.

## Контракт

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

`useWizardForm` — alias для `useWizard`.

## Что дальше

- [Wizard-формы](../wizard) — модель навигации, которую отрисовывает этот хук.
- [useForm](./use-form) — сабмит формы целиком и серверные ошибки внутри шага.
- [Валидация](../validation) — что запускается внутри `step.form.validate()`.
