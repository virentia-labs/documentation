---
title: Визард-формы
---

# Визард-формы

Визард нужен, когда пользователь заполняет одну задачу в несколько проходов:
регистрация, онбординг, оформление заказа, настройка интеграции,
многостраничная анкета.
Главная сложность здесь не в кнопках "назад" и "дальше", а в модели: где
хранить общий объект значений, когда валидировать шаг, как пропускать условные шаги и
как переиспользовать уже существующие формы.

В `@virentia/forms` шаг визарда - это форма.

```
шаг = форма + метаданные навигации
```

Визард не владеет полями. Он владеет переходами между формами.

## Общая корневая форма

Самый частый сценарий: все шаги редактируют один итоговый объект. Например,
регистрация состоит из аккаунта, тарифа и данных для оплаты.

```ts
const signup = createForm({
  schema: {
    email: createField("", {
      validate: zodFieldValidator(z.string().email("Некорректный email")),
    }),
    password: createField("", {
      validate: zodFieldValidator(
        z.string().min(8, "Минимум 8 символов"),
      ),
    }),
    plan: createField<"free" | "team">("free"),
    billingEmail: createField(""),
  },
});
```

Шаги создаются как проекции этой формы:

```ts
const wizard = createWizard({
  form: signup,
  steps: [
    step("account", {
      title: "Аккаунт",
      form: signup.pick({
        email: true,
        password: true,
      }),
    }),
    step("plan", {
      title: "Тариф",
      form: signup.pick({
        plan: true,
      }),
    }),
    step("billing", {
      title: "Оплата",
      form: signup.pick({
        billingEmail: true,
      }),
      when: ({ values }) => values.plan === "team",
    }),
  ],
});
```

Что здесь происходит:

- `signup` остается единственным источником итоговых значений;
- `pick` не копирует поля, а создаёт проекцию формы над теми же экземплярами
  полей;
- `account` валидирует только `email` и `password`;
- `billing` видим только для тарифа team;
- `wizard.read()` возвращает `signup.read()`.

## Переход на следующий шаг

```ts
const moved = await wizard.next();
```

Алгоритм:

```
current = visibleSteps[currentIndex]
await current.form.validate()

if current.form.isValid:
  пометить текущий шаг завершённым
  перейти к следующему видимому шагу
  return true

return false
```

Это означает, что пользователь не пройдёт дальше, пока текущая форма шага
невалидна. Ошибки остаются внутри формы шага, поэтому интерфейс показывает их так же,
как в обычной форме.

## Переход к конкретному шагу

`goTo(id)` полезен для навигации по шагам из бокового меню.

```ts
await wizard.goTo("billing");
```

Если цель находится позади текущего шага, визард переходит без валидации. Если
цель впереди, визард валидирует все промежуточные видимые шаги и останавливается
на первом невалидном.

Так боковое меню может быть свободным для уже пройденных шагов, но не позволяет
перепрыгнуть обязательные проверки.

## Завершение визарда

```ts
const completed = await wizard.complete();
```

`complete()` валидирует все видимые шаги. Если один шаг невалиден, визард
перейдет на него и вернет `false`. Если все шаги валидны, он эмитит
`completed` и возвращает `true`.

```ts
if (await wizard.complete()) {
  await saveSignup(signup.read());
}
```

## Самостоятельные формы шагов

Не всегда нужна общая корневая форма. Иногда каждый шаг уже является отдельной
моделью фичи: например, импорт контактов, настройка вебхука и
проверка подключения.

```ts
const importSettings = createForm({
  schema: {
    source: createField<"csv" | "crm">("csv"),
  },
});

const webhookSettings = createForm({
  schema: {
    url: createField("", {
      validate: zodFieldValidator(z.string().url("Некорректный URL")),
    }),
  },
});

const wizard = createWizard({
  steps: [
    step("import", { form: importSettings }),
    step("webhook", { form: webhookSettings }),
  ],
});
```

Без корневой формы `wizard.read()` возвращает объект по id шага:

```ts
{
  import: importSettings.read(),
  webhook: webhookSettings.read(),
}
```

Этот режим удобен, когда шаги действительно независимы и не должны делить одну
схему.

## `createWizardForm`

Если вы всегда создаёте корневую форму и сразу описываете шаги, используйте
вспомогательную функцию.

```ts
const wizard = createWizardForm({
  schema: {
    email: createField(""),
    password: createField(""),
    displayName: createField(""),
  },
  steps: [
    step("account", {
      pick: {
        email: true,
        password: true,
      },
    }),
    step("profile", {
      form: {
        displayName: true,
      },
    }),
    step("review", {
      form: true,
    }),
  ],
});

wizard.form; // корневая форма
```

В шагах `createWizardForm` поля `pick` и `form: { ... }` создают проекции
корневой формы. Используйте `form: true`, если шаг должен валидировать всю
корневую форму. Если у шага уже есть своя модель формы, передайте её через
`form` в `createWizard` или верните из callback-формы `createWizardForm`.

Вспомогательная функция не добавляет новую модель поведения. Она только
сокращает паттерн общей корневой формы.

## React-интерфейс

Визард можно читать через `useWizard`.

```tsx
function WizardControls() {
  const wizard = useWizard(signupWizard);

  return (
    <footer>
      <button disabled={!wizard.canGoBack} onClick={() => void wizard.back()}>
        Назад
      </button>
      <button disabled={!wizard.canGoNext} onClick={() => void wizard.next()}>
        Дальше
      </button>
    </footer>
  );
}
```

Текущий шаг хранит форму, поэтому экран может выбрать нужный компонент по
`currentId` и отдать туда `currentForm`.

## Контракт

```ts
interface WizardStep<Id extends string, StepForm extends AnyForm> {
  readonly id: Id;
  readonly form: StepForm;
  readonly title?: string;
  readonly when?: (ctx: { values: unknown }) => boolean;
}

interface Wizard<Steps, RootForm> {
  readonly form: RootForm;
  readonly steps: Store<Steps>;
  readonly visibleSteps: Store<Steps>;
  readonly currentId: Store<StepId>;
  readonly currentIndex: Store<number>;
  readonly currentStep: Store<Step>;
  readonly currentForm: Store<Form>;
  readonly visitedIds: Store<readonly StepId[]>;
  readonly completedIds: Store<readonly StepId[]>;
  readonly canGoBack: Store<boolean>;
  readonly canGoNext: Store<boolean>;

  next(): Promise<boolean>;
  back(): Promise<boolean>;
  goTo(id: StepId): Promise<boolean>;
  complete(): Promise<boolean>;
  reset(): Promise<void>;
  read(): unknown;
}
```

## Что дальше

- [Валидация](./validation) - что именно происходит при `step.form.validate()`.
- [React](/ru/forms/react/) - как привязать визард к интерфейсу.
- [Модель формы](./form) - почему шаг может быть любой проекцией формы.
- [API-справка](/ru/api/forms) - типы `Wizard`, `WizardStep`,
  `createWizardForm`.
