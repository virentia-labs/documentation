---
title: Кастомные поля
---

# Кастомные поля

Кастомное поле нужно, когда интерфейс состоит из нескольких внутренних полей,
но форма должна видеть одно доменное значение. Форма не обязана знать, что
`Money` рисуется как сумма и валюта, а адрес - как страна, город и улица.

Кастомные поля структурные. Они не наследуются от базового класса; они
удовлетворяют `FieldContract`.

## Денежное поле

```ts
import { computed } from "@virentia/core";
import { createField, defineField, type FieldContract } from "@virentia/forms";

interface Money {
  amount: number;
  currency: "USD" | "EUR";
}

function createMoneyField(initial: Money): FieldContract<Money> {
  const amount = createField(initial.amount, {
    validate(value) {
      return value >= 0 ? null : "Сумма не может быть отрицательной";
    },
  });
  const currency = createField(initial.currency);

  return defineField({
    kind: "money",
    state: computed(() => ({
      amount: amount.state.value,
      currency: currency.state.value,
    })),
    read() {
      return {
        amount: amount.read(),
        currency: currency.read(),
      };
    },
    readFields() {
      return { amount, currency };
    },
    async fill(next) {
      await Promise.all([
        amount.fill(next.amount),
        currency.fill(next.currency),
      ]);
    },
    async reset() {
      await Promise.all([amount.reset(), currency.reset()]);
    },
  });
}
```

Что важно:

- `state` отдаёт доменное значение как стор Virentia;
- `read()` возвращает снимок значения в текущем скоупе;
- `readFields()` позволяет формам найти дочерние поля для валидации и ошибок;
- `fill` и `reset` ждут все внутренние операции.

## Внутри формы

```ts
const invoice = createForm({
  schema: {
    title: createField(""),
    total: createMoneyField({ amount: 0, currency: "USD" }),
  },
});

await invoice.fill({
  values: {
    total: { amount: 120, currency: "EUR" },
  },
});
```

Форма получает `Money`, а не `{ amountField, currencyField }`. Если внутреннее
поле `amount` невалидно, ошибка появится под `total.amount`.

## Контракт

```ts
interface FieldContract<Value, Errors = FieldError, Fill = Value> {
  readonly kind: string;
  readonly state: Store<Value>;
  readonly errors?: Store<Errors>;
  readonly innerErrors?: Store<Errors>;
  readonly outerErrors?: Store<Errors>;
  readonly isValid?: Store<boolean>;
  readonly isValidationPending?: Store<boolean>;

  fill(payload: Fill): Promise<void>;
  reset(): Promise<void>;
  read?(): Value;
  readFields?(): Readonly<Record<string, AnyField>>;
}

function defineField<FieldValue extends AnyField>(field: FieldValue): FieldValue;
```

## Частые кейсы

- поле суммы и валюты;
- диапазон дат;
- адрес;
- локализованный текст;
- состояние загрузки файла;
- значение rich-text-редактора;
- любой виджет, где поля интерфейса не совпадают с формой API-значения.

## Связанные разделы

- [Модель поля](./fields) - примитивные поля внутри кастомных полей.
- [Типы полей](./field-types) - переиспользуемые фабрики кастомных полей.
- [Каналы ошибок](./errors) - как поднимаются ошибки дочерних полей.
- [React-интеграция](./react) - как отрисовывать кастомные поля через `useField`.
