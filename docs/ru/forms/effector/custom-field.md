---
title: Кастомное поле
---

# Кастомное поле

Кастомное (или композитное) поле не является для моста особым узлом. Это
`FieldContract` — структурная форма, которой удовлетворяет каждое поле (см.
[Кастомные поля](../custom-fields)), — поэтому `formToEffector` проецирует
его так же, как примитивное [поле](./field): каждый юнит, который отдаёт контракт,
становится узлом линзы с **действиями над юнитом**.

- Его стор-ы (`state`, `errors`, `isValid`, `isValidationPending`, …) доступны
  только на чтение, поэтому становятся **watchable** — `.clock(): Event<T>`.
- Его вызываемые юниты — `fill`, `reset` и любые кастомные события или эффекты,
  которые он отдаёт, — становятся **targetable** — `.clock()` _и_ `.target(map?)`.

Обычные методы, не являющиеся юнитами Virentia (`read`, `serialize`, `kind`), —
не юниты, поэтому выпадают из линзы. Ничто здесь не переизобретает поле; линза
читает и пробрасывает, а форма Virentia остаётся единственным источником истины.

Всё ниже предполагает ассоциацию и скоуп в текущем запуске — см.
[Обзор → Ассоциация скоупов](./#ассоциация-скоупов). Мост не создаёт скоуп сам;
триггерьте внутри него.

## Композитное поле в форме

Возьмём money-поле из гайда по формам — `amount` плюс `currency`,
представленные форме как одно значение `Money`. Единственная деталь, важная для
моста, — `readFields()`: он отдаёт свои вложенные поля наружу.

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
      return value >= 0 ? null : "Amount cannot be negative";
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
      return { amount: amount.read(), currency: currency.read() };
    },
    readFields() {
      return { amount, currency };
    },
    async fill(next) {
      await Promise.all([amount.fill(next.amount), currency.fill(next.currency)]);
    },
    async reset() {
      await Promise.all([amount.reset(), currency.reset()]);
    },
  });
}
```

Кладём его в форму и конвертируем как обычно:

```ts
import { createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const invoice = createForm({
  schema: {
    title: createField(""),
    price: createMoneyField({ amount: 0, currency: "USD" }),
  },
});

const model = formToEffector(invoice);
```

## Его собственные юниты

В `model.fields.price` вы получаете собственный контракт money-поля,
спроецированный как любое поле. Его стор `state` — watchable; `fill` и `reset` —
targetable:

```ts
model.fields.price.state.clock();   // Event<Money>
model.fields.price.fill.target();   // EventCallable<Money>
model.fields.price.reset.target();  // EventCallable<void>
```

Если поле отдаёт кастомные события или эффекты — скажем, событие `round` или
эффект `convert`, — они тоже появятся здесь, watchable или targetable по своему
виду, ровно как примитивные юниты жизненного цикла на [поле](./field).

## Навигация во вложенные поля

Так как money-поле отдаёт `readFields()`, линза может спускаться в его детей.
Навигируйте по ключу ребёнка, затем выбирайте leaf-юнит — те же юниты, что есть у
обычного поля:

```ts
// Наблюдаем одно вложенное поле.
model.fields.price.amount.state.clock();     // Event<number>
model.fields.price.amount.error.clock();     // Event<FieldError>

// Управляем одним вложенным полем.
model.fields.price.currency.change.target(); // EventCallable<"USD" | "EUR">
```

Это то же самое обнаружение, на которое опирается родительская форма: невалидный
`amount` поднимает свою ошибку под `price.amount`, и линза позволяет наблюдать за
ним и управлять им из Effector, не распаковывая композитное значение вручную.

```ts
import { sample } from "effector";

const amountTyped = createEvent<number>();
sample({ clock: amountTyped, target: model.fields.price.amount.change.target() });

model.fields.price.amount.error.clock().watch((error) => {
  if (error) console.warn("amount невалиден:", error);
});
```

::: warning
Навигация во вложенные поля существует **только** тогда, когда поле отдаёт
`readFields()`. Без него мост видит лишь юниты верхнего уровня поля — `state`,
`fill`, `reset` и любые кастомные юниты, — и `model.fields.price.amount`
недостижим. Это то же требование, что нужно родительской форме, чтобы видеть
ошибки детей, поэтому поле, которое уже сообщает вложенные ошибки, уже доступно
для навигации.
:::

## Фабрики field-типов тоже работают

Переиспользуемая фабрика из [Field-типов](../field-types) — это просто
функция, возвращающая `FieldContract`, поэтому для моста ничего не меняется:
возвращённое поле проецируется по тем же правилам. Отдаёте `readFields()` — его
вложенные поля доступны для навигации; опускаете — доступны только его собственные
юниты.

## Дальше

- [Array-поле](./array-field) — положите кастомные элементы в список и доберитесь
  до каждого через коллекционную линзу.
- [Кастомные поля](../custom-fields) — модель композитного поля Virentia,
  которую мостит эта страница.
