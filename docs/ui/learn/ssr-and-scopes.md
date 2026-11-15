# Scopes

A scope holds store values and model collections for one application. Two scopes can use the same model definition and IDs without sharing state.

<UIFlow kind="scope" />

```ts
const first = scope();
const second = scope();
const a = scoped(first, () => CounterModel.create({
  id: "coffee", count: 1,
}));
const b = scoped(second, () => CounterModel.create({
  id: "coffee", count: 5,
}));
await a.increment();
// a.count.value === 2; b.count.value === 5
```

Import scope and scoped from UI. A ready instance is bound to its scope; invoking its action needs no surrounding scoped call.

## DOM roots

Pass the model's application scope to render. A model from another scope is rejected before DOM changes.

Multiple roots may intentionally share a scope and state. Their containers and teardown remain independent.

Create scopes inside concurrent test bodies and inside request handlers. See [Vitest](../api/testing) and [SSR](../ssr).

## Context after await

A direct await of a Virentia unit retains the action's context. An arbitrary await fetch does not. After an external await, use a bound instance or explicitly enter the required scope with scoped.
