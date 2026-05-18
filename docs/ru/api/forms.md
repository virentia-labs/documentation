---
title: "@virentia/forms"
---

# @virentia/forms

Это справочник по контрактам. Если нужен маршрут с примерами и объяснениями,
начните с [раздела форм](/ru/forms/).

## Пакеты

```ts
import {
  createField,
  createArrayField,
  createShapeField,
  createForm,
  createWizard,
  createWizardForm,
  step,
  fieldType,
  defineField,
  normalizeField,
  readStoreSnapshot,
} from "@virentia/forms";

import {
  useField,
  useForm,
  useWizard,
  useWizardForm,
} from "@virentia/forms-react";

import {
  zodValidator,
  zodFormValidator,
  zodFieldValidator,
} from "@virentia/forms-zod";

import {
  yupValidator,
  yupFormValidator,
  yupFieldValidator,
} from "@virentia/forms-yup";
```

## Базовые типы

```ts
type FieldError = string | null;
type MaybePromise<T> = T | Promise<T>;
type ValidationStrategy = "change" | "blur" | "focus" | "submit" | "manual";

type PartialRecursive<T> = T extends readonly (infer Item)[]
  ? readonly PartialRecursive<Item>[]
  : T extends object
    ? { [Key in keyof T]?: PartialRecursive<T[Key]> }
    : T;
```

## Поля

```ts
function createField<Value, Meta extends object = Record<string, never>>(
  initial: Value,
  options?: CreateFieldOptions<Value, Meta>,
): Field<Value, Meta>;

interface CreateFieldOptions<Value, Meta extends object> {
  error?: FieldError;
  meta?: Meta;
  validate?: FieldValidator<Value> | readonly FieldValidator<Value>[];
  validationStrategies?: readonly ValidationStrategy[];
}
```

`createField` создаёт примитивное поле: стор значения, два канала ошибок,
состояние фокуса, метаданные и жизненный цикл валидации.

```ts
interface Field<Value, Meta extends object = Record<string, never>>
  extends NormalizedField<Value, FieldError, Value> {
  readonly error: Store<FieldError>;
  readonly innerError: Store<FieldError>;
  readonly outerError: Store<FieldError>;
  readonly meta: Store<Meta>;
  readonly isFocused: Store<boolean>;

  readonly change: EventCallable<Value>;
  readonly focus: EventCallable<void>;
  readonly focused: Event<void>;
  readonly blur: EventCallable<void>;
  readonly blurred: Event<void>;
  readonly changeError: EventCallable<FieldError>;
  readonly changeMeta: EventCallable<Meta>;
}
```

## Контракт поля

Форма принимает любой объект, который структурно удовлетворяет
`FieldContract`.

```ts
interface FieldContract<Value, Errors = FieldError, Fill = Value> {
  readonly kind: string;
  readonly state: Store<Value>;
  readonly errors?: Store<Errors>;
  readonly innerErrors?: Store<Errors>;
  readonly outerErrors?: Store<Errors>;
  readonly isValid?: Store<boolean>;
  readonly isValidationPending?: Store<boolean>;
  readonly changed?: Event<Value>;
  readonly errorsChanged?: Event<Errors>;
  readonly validate?: EventCallable<void>;

  fill(payload: Fill): Promise<void>;
  reset(): Promise<void>;

  setInnerErrors?(errors: Errors): Promise<void>;
  setOuterErrors?(errors: Errors): Promise<void>;
  clearInnerErrors?(): Promise<void>;
  clearOuterErrors?(): Promise<void>;
  serialize?(): { value: Value; errors: Errors };
  read?(): Value;
  readFields?(): Readonly<Record<string, AnyField>>;

  readonly fields?: Store<any> | Readonly<Record<string, AnyField>>;
  readonly view?: unknown;
}

interface NormalizedField<Value = unknown, Errors = unknown, Fill = unknown>
  extends FieldContract<Value, Errors, Fill> {
  readonly errors: Store<Errors>;
  readonly innerErrors: Store<Errors>;
  readonly outerErrors: Store<Errors>;
  readonly isValid: Store<boolean>;
  readonly isValidationPending: Store<boolean>;
  readonly changed: Event<Value>;
  readonly errorsChanged: Event<Errors>;
  readonly validate: EventCallable<void>;

  setInnerErrors(errors: Errors): Promise<void>;
  setOuterErrors(errors: Errors): Promise<void>;
  clearInnerErrors(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  read(): Value;
  readFields(): Readonly<Record<string, AnyField>>;
}
```

`normalizeField(field)` достраивает отсутствующие сторы и методы из дочерних
полей или безопасных значений по умолчанию.

## Shape-поле

```ts
function createShapeField<Shape extends Record<string, AnyField>>(
  initial: Shape,
  options?: CreateShapeFieldOptions,
): ShapeField<Shape>;

interface CreateShapeFieldOptions {
  createField?(key: string, value: unknown): AnyField;
  validate?:
    | FieldValidator<Record<string, unknown>, Record<string, unknown>>
    | readonly FieldValidator<Record<string, unknown>, Record<string, unknown>>[];
  validationStrategies?: readonly ValidationStrategy[];
}

interface ShapeField<Shape extends Record<string, AnyField>>
  extends NormalizedField<
    ShapeValues<Shape>,
    ShapeErrors<Shape>,
    PartialRecursive<ShapeValues<Shape>>
  > {
  readonly fields: Store<Readonly<Record<string, AnyField>>>;

  add<Key extends string, FieldValue extends AnyField>(
    payload: { key: Key; field: FieldValue },
  ): Promise<void>;
  remove(key: keyof Shape | string): Promise<void>;
  replace<Key extends string, FieldValue extends AnyField>(
    payload: { key: Key; field: FieldValue },
  ): Promise<void>;
  clear(): Promise<void>;
}
```

## Array-поле

```ts
function createArrayField<Value, ItemField extends AnyField = Field<Value>>(
  initial?: readonly Value[],
  options?: CreateArrayFieldOptions<Value, ItemField>,
): ArrayField<Value, ItemField>;

type ArrayFieldErrors<ItemErrors = FieldError> =
  | FieldError
  | readonly ItemErrors[];

interface CreateArrayFieldOptions<Value, ItemField extends AnyField> {
  createItem?(value: Value, index: number): ItemField;
  validate?:
    | FieldValidator<readonly Value[], ArrayFieldErrors<FieldErrors<ItemField>>>
    | readonly FieldValidator<readonly Value[], ArrayFieldErrors<FieldErrors<ItemField>>>[];
  validationStrategies?: readonly ValidationStrategy[];
}

interface ArrayField<Value, ItemField extends AnyField = Field<Value>>
  extends NormalizedField<
    readonly Value[],
    ArrayFieldErrors<FieldErrors<ItemField>>,
    readonly Value[]
  > {
  readonly items: Store<readonly ItemField[]>;
  readonly itemFields: Store<Readonly<Record<string, ItemField>>>;
  readonly length: Store<number>;

  push(value: Value | ItemField): Promise<void>;
  unshift(value: Value | ItemField): Promise<void>;
  insert(index: number, value: Value | ItemField): Promise<void>;
  remove(index: number): Promise<void>;
  pop(): Promise<void>;
  replace(index: number, value: Value | ItemField): Promise<void>;
  move(from: number, to: number): Promise<void>;
  swap(first: number, second: number): Promise<void>;
  clear(): Promise<void>;
}
```

## Форма

```ts
function createForm<Schema extends Record<string, any>>(
  config: CreateFormConfig<Schema>,
): Form<Schema>;

interface CreateFormConfig<Schema extends Record<string, any>> {
  schema: Schema;
  validation?:
    | FormValidator<any, any>
    | readonly FormValidator<any, any>[];
  validationStrategies?: readonly ValidationStrategy[];
}
```

```ts
interface Form<Schema, Values = SchemaValues<Schema>, Errors = SchemaErrors<Schema>> {
  readonly kind: "form";
  readonly fields: NormalizeSchema<Schema>;
  readonly values: Store<Values>;
  readonly value: Store<Values>;
  readonly errors: Store<Errors>;
  readonly innerErrors: Store<Errors>;
  readonly outerErrors: Store<Errors>;
  readonly snapshot: Store<Values>;
  readonly isChanged: Store<boolean>;
  readonly isValid: Store<boolean>;
  readonly isValidationPending: Store<boolean>;

  fill(payload: {
    values?: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  reset(): Promise<void>;
  validate(): Promise<void>;
  submit(): Promise<void>;
  clearOuterErrors(): Promise<void>;
  clearInnerErrors(): Promise<void>;
  forceUpdateSnapshot(): Promise<void>;
  pick(selection: SelectionShape<NormalizeSchema<Schema>>): FormProjection<any>;
  serialize(): { values: Values; errors: Errors };
  persist(payload: {
    values: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  read(): Values;
}
```

Вспомогательные типы формы:

```ts
type FieldValue<T> = T extends FieldContract<infer Value, any, any>
  ? Value
  : T extends readonly any[]
    ? T
    : T extends Date
      ? T
      : T extends object
        ? { [Key in keyof T]: FieldValue<T[Key]> }
        : T;

type FieldErrors<T> = T extends FieldContract<any, infer Errors, any>
  ? Errors
  : T extends readonly any[]
    ? FieldError
    : T extends Date
      ? FieldError
      : T extends object
        ? { [Key in keyof T]: FieldErrors<T[Key]> }
        : FieldError;

type SchemaValues<Schema> = {
  [Key in keyof Schema]: FieldValue<Schema[Key]>;
};

type SchemaErrors<Schema> = {
  [Key in keyof Schema]: FieldErrors<Schema[Key]>;
};
```

## Wizard

```ts
function step<Id extends string, StepForm extends AnyForm>(
  id: Id,
  config: Omit<WizardStep<Id, StepForm>, "id">,
): WizardStep<Id, StepForm>;

function createWizard<
  Steps extends readonly WizardStep[],
  RootForm extends AnyForm | undefined = undefined,
>(config: {
  form?: RootForm;
  steps: Steps;
}): Wizard<Steps, RootForm>;

function createWizardForm<Schema extends Record<string, any>, Steps extends readonly WizardStep[]>(
  config: CreateFormConfig<Schema> & {
    steps(form: Form<Schema>): Steps;
  },
): Wizard<Steps, Form<Schema> & AnyForm> & { readonly form: Form<Schema> };
```

```ts
interface WizardStep<Id extends string = string, StepForm extends AnyForm = AnyForm> {
  readonly id: Id;
  readonly form: StepForm;
  readonly title?: string;
  readonly when?: (ctx: { values: unknown }) => boolean;
}

interface Wizard<Steps extends readonly WizardStep[], RootForm> {
  readonly kind: "wizard";
  readonly form: RootForm;
  readonly steps: Store<Steps>;
  readonly visibleSteps: Store<Steps>;
  readonly currentId: Store<Steps[number]["id"]>;
  readonly currentIndex: Store<number>;
  readonly currentStep: Store<Steps[number]>;
  readonly currentForm: Store<Steps[number]["form"]>;
  readonly visitedIds: Store<readonly Steps[number]["id"][]>;
  readonly completedIds: Store<readonly Steps[number]["id"][]>;
  readonly canGoBack: Store<boolean>;
  readonly canGoNext: Store<boolean>;

  next(): Promise<boolean>;
  back(): Promise<boolean>;
  goTo(id: Steps[number]["id"]): Promise<boolean>;
  complete(): Promise<boolean>;
  reset(): Promise<void>;
  read(): unknown;
}
```

## Валидация

```ts
interface ValidationContext {
  readonly signal: AbortSignal;
  readonly path: readonly string[];
  read<T>(unit: Store<T> | StoreWritable<T>): T;
}

type ValidationResult<Errors> = Errors | null | undefined;

interface ValidationPayload<Value> {
  readonly value: Value;
  readonly ctx: ValidationContext;
}

type ValidationFunction<Value, Errors = FieldError> = (
  value: Value,
  ctx: ValidationContext,
) => MaybePromise<ValidationResult<Errors>>;

type ValidationEffect<Value, Errors = FieldError> = Effect<
  ValidationPayload<Value>,
  ValidationResult<Errors>
>;

type FieldValidator<Value, Errors = FieldError> =
  | ValidationFunction<Value, Errors>
  | ValidationEffect<Value, Errors>;

type FormValidator<Values, Errors = Record<string, any>> =
  | ValidationFunction<Values, Errors>
  | ValidationEffect<Values, Errors>;
```

`ctx.read(store)` читает стор в текущем скоупе и подписывает валидацию на его
изменения после первого запуска.

## Типы полей

```ts
function defineField<FieldValue extends AnyField>(field: FieldValue): FieldValue;

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

## Хуки React

```ts
function useField<Value, Errors, Fill>(
  field: FieldContract<Value, Errors, Fill>,
): FieldView<Value, Errors, Fill>;

function useForm<Model extends Form>(form: Model): FormView<Model>;

function useWizard<Model extends Wizard>(wizard: Model): WizardView<Model>;

const useWizardForm: typeof useWizard;
```

Методы, возвращаемые хуками, вызываются внутри ближайшего `ScopeProvider`.

## Адаптеры схем

```ts
function zodValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<z.output<Schema>, any>;

const zodFormValidator: typeof zodValidator;

function zodFieldValidator<Schema extends ZodType>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<z.output<Schema>, FieldError>;

function yupValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FormValidator<InferType<Schema>, any>;

const yupFormValidator: typeof yupValidator;

function yupFieldValidator<Schema extends AnySchema>(
  schema: Schema | ((ctx: ValidationContext) => Schema),
): FieldValidator<InferType<Schema>, FieldError>;
```

## Связанные разделы

- [Формы](/ru/forms/) - руководство по модели формы.
- [Поля](/ru/forms/fields) - кастомные поля и `fieldType.extend`.
- [Валидация](/ru/forms/validation) - жизненный цикл валидаторов.
- [React](/ru/forms/react) - хуки и обработчики, привязанные к скоупу.
