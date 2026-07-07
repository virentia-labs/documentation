---
title: Array Fields
---

# Array Fields

Use an array field when a form contains an ordered list of repeated items:
invoice lines, tags, contacts, addresses, conditions, checklist rows. Each item
is a field model, so it can have its own value, validation, errors, and nested
children.

Array field is one field from the parent form point of view. It exposes one
array value.

## Primitive Items

```ts
import { createArrayField, createField } from "@virentia/forms";

const tags = createArrayField(["forms"], {
  createItem(value) {
    return createField(value, {
      validate(next) {
        return next.trim() ? null : "Enter a tag";
      },
    });
  },
});

await tags.push("virentia");
await tags.move(0, 1);

tags.read(); // ["virentia", "forms"]
```

`move` and `swap` reorder item field instances. Their internal state moves with
them.

## Composite Items

An item can be any field contract. For a repeated object, create a shape field
per row.

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

## Contract

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

## Common Cases

- tags and simple chips;
- invoice or order lines;
- addresses and contacts;
- sortable lists;
- repeated condition builders;
- nested rows that validate independently.

## Related

- [Shape fields](./shape-fields) - dynamic objects and row shapes.
- [Validation lifecycle](./validation) - item validation plus array validation.
- [React bindings](/forms/react/) - rendering item fields.
