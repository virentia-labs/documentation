# Async search

The model owns query/results/pending/error and the input action. Its reaction uses AbortSignal to reject stale results.

The maintained example receives search as a model-factory dependency. After an external native promise, it explicitly re-enters api.scope for writes:

```ts
const found = await search(text, signal);
if (signal.aborted) return;
scoped(api.scope, () => { self.results.value = [...found]; });
```

View consumes units and named pending/error fragments. This recipe replaces the result array wholesale, so rows are recreated with a development warning, not secretly key-matched. Use mutable mutations or model containers for incremental result delivery.

See [list operations](../learn/model-lists).

::: details Complete example sources
::: code-group
<<< @/ui/examples/async-search.tsx
:::
:::
