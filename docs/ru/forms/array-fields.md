---
title: Array-поля
---

# Array-поля

Array-поле нужно, когда форма содержит упорядоченный список повторяемых
элементов: строки счёта, теги, контакты, адреса, условия, пункты чеклиста.
Каждый элемент является моделью поля, поэтому у него есть собственное значение,
валидация, ошибки и вложенные дочерние поля.

С точки зрения родительской формы array-поле остаётся одним полем. Оно отдаёт
одно значение-массив.

## Примитивные элементы

```ts
import { createArrayField, createField } from "@virentia/forms";

const tags = createArrayField(["forms"], {
  createItem(value) {
    return createField(value, {
      validate(next) {
        return next.trim() ? null : "Введите тег";
      },
    });
  },
});

await tags.push("virentia");
await tags.move(0, 1);

tags.read(); // ["virentia", "forms"]
```

`move` и `swap` переставляют экземпляры полей элементов. Их внутреннее состояние
перемещается вместе с ними.

## Составные элементы

Элемент может быть любым контрактом поля. Для повторяемого объекта создайте
shape-поле на строку.

```ts
interface InvoiceLine {
  title: string;
  quantity: number;
}

const lines = createArrayField<InvoiceLine>([], {
  createItem(line) {
    return createShapeField({
      title: createField(line.title),
      quantity: createField(line.quantity),
    });
  },
});

await lines.push({ title: "Design", quantity: 2 });
```

## Контракт

```ts
function createArrayField<Value, ItemField extends AnyField = Field<Value>>(
  initial?: readonly Value[],
  options?: {
    createItem?(value: Value, index: number): ItemField;
    validate?: FieldValidator<readonly Value[], ArrayFieldErrors<FieldErrors<ItemField>>>;
    validationStrategies?: readonly ValidationStrategy[];
  },
): ArrayField<Value, ItemField>;

interface ArrayField<Value, ItemField extends AnyField = Field<Value>>
  extends FieldContract<readonly Value[], ArrayFieldErrors<FieldErrors<ItemField>>> {
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

## Частые кейсы

- теги и чипы;
- строки счёта или заказа;
- адреса и контакты;
- сортируемые списки;
- повторяемые конструкторы условий;
- вложенные строки с независимой валидацией.

## Связанные разделы

- [Shape-поля](./shape-fields) - динамические объекты и структура строки.
- [Жизненный цикл валидации](./validation) - валидация элементов и всего массива.
- [React-интеграция](/ru/forms/react/) - отрисовка полей элементов.
