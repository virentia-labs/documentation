---
title: Shape Fields
---

# Shape Fields

Use a shape field when an object has dynamic keys. A form schema is static by
default, but real screens often let users add arbitrary links, attributes,
filters, feature flags, or localized values.

Shape field is still one field. It exposes one object value and manages a set of
child fields behind it.

## Dynamic Object

```ts
import { createField, createShapeField } from "@virentia/forms";

const links = createShapeField({
  website: createField(""),
});

await links.add({
  key: "github",
  field: createField(""),
});

await links.fill({
  website: "https://example.com",
  github: "https://github.com/virentia-labs",
});

links.read();
// {
//   website: "https://example.com",
//   github: "https://github.com/virentia-labs"
// }
```

## Unknown Keys From Backend

If keys are not known ahead of time, `createField` can build a child field
during `fill`.

```ts
const attributes = createShapeField(
  {},
  {
    createField(key, value) {
      if (key.endsWith("Url")) {
        return urlField(String(value));
      }

      return createField(value);
    },
  },
);

await attributes.fill({
  avatarUrl: "https://example.com/avatar.png",
  theme: "dark",
});
```

## Contract

```ts
function createShapeField<Shape extends Record<string, AnyField>>(
  initial: Shape,
  options?: {
    createField?(key: string, value: unknown): AnyField;
    validate?: FieldValidator<Record<string, unknown>, Record<string, unknown>>;
    validationStrategies?: readonly ValidationStrategy[];
  },
): ShapeField<Shape>;

interface ShapeField<Shape extends Record<string, AnyField>>
  extends FieldContract<ShapeValues<Shape>, ShapeErrors<Shape>> {
  readonly fields: Store<Readonly<Record<string, AnyField>>>;

  add(payload: { key: string; field: AnyField }): Promise<void>;
  remove(key: string): Promise<void>;
  replace(payload: { key: string; field: AnyField }): Promise<void>;
  clear(): Promise<void>;
}
```

## Common Cases

- profile links;
- arbitrary attributes;
- feature flags;
- localized labels by locale code;
- dynamic filters keyed by field name;
- backend drafts with unknown object keys.

## Related

- [Array fields](./array-fields) - ordered dynamic collections.
- [Custom fields](./custom-fields) - shape field as a child of a domain field.
- [Error channels](./errors) - errors under dynamic keys.
