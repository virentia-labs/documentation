---
title: Error Channels
---

# Error Channels

Forms usually have two sources of errors: local validation and backend
responses. If they share one slot, one source constantly erases the other. A
local `validate()` hides a server error; a server response hides what the user
can fix locally.

Virentia Forms separates these sources.

```ts
errors = outerErrors ?? innerErrors
```

`innerErrors` are written by validators. `outerErrors` are written from outside,
usually from the backend.

## Local Validation Error

```ts
const slug = createField("", {
  validate(value) {
    return value.trim() ? null : "Enter a slug";
  },
});

await slug.validate();

slug.innerError.value; // "Enter a slug"
slug.outerError.value; // null
slug.error.value;      // "Enter a slug"
```

## Backend Error

Backend errors go through `fill({ errors })` on the form or `setOuterErrors` on
the field.

```ts
await articleForm.fill({
  errors: {
    slug: "Slug is already taken",
  },
});

articleForm.errors.slug; // "Slug is already taken"
```

If validation runs again, it updates only `innerErrors`. The backend error stays
visible until the outer channel is cleared.

```ts
await articleForm.validate();

articleForm.errors.slug; // still "Slug is already taken"

await articleForm.clearOuterErrors();
```

## Nested Errors

Form errors follow the same shape as the schema. This makes server payloads and
schema adapter errors land in the same place.

```ts
await profileForm.fill({
  errors: {
    contacts: {
      email: "Email is already used",
    },
  },
});
```

The same rule applies to [shape fields](./shape-fields) and
[array fields](./array-fields): errors stay under the dynamic key or item index.

## Contract

```ts
interface FieldContract<Value, Errors = FieldError> {
  readonly errors?: Store<Errors>;
  readonly innerErrors?: Store<Errors>;
  readonly outerErrors?: Store<Errors>;

  setInnerErrors?(errors: Errors): Promise<void>;
  setOuterErrors?(errors: Errors): Promise<void>;
  clearInnerErrors?(): Promise<void>;
  clearOuterErrors?(): Promise<void>;
}

interface Form<Schema, Values, Errors> {
  readonly errors: Store<Errors>;
  readonly innerErrors: Store<Errors>;
  readonly outerErrors: Store<Errors>;

  fill(payload: {
    values?: PartialRecursive<Values>;
    errors?: PartialRecursive<Errors>;
  }): Promise<void>;
  clearOuterErrors(): Promise<void>;
  clearInnerErrors(): Promise<void>;
}
```

## Common Cases

- show backend validation after submit;
- keep server errors visible while local validation reruns;
- clear backend errors after a user edit;
- preserve nested API errors for object and list fields;
- show one final `errors` value in UI without caring about the source.

## Related

- [Validation lifecycle](./validation) - where `innerErrors` come from.
- [Form model](./form) - how form-level errors are applied to children.
- [Schema adapters](./adapters) - how schema issues become nested errors.
