# Low-level Kernel

Most application code should use stores, events, effects, reactions, and owners — the main `@virentia/core` entry.

The kernel's low-level building blocks live in a separate subpath, **`@virentia/core/internal`**: direct graph nodes, execution contexts, dependency tracking, scope access, and the transaction lifecycle. Reach for it to build an integration that needs raw nodes, or to author a custom unit or store — [`@virentia/mutable`](/mutable/) is built entirely on it.

::: warning Advanced surface
`@virentia/core/internal` is a separate entry point on purpose — application code should not need it. It re-exports the **same singleton modules** the main entry uses (the bundler code-splits them into a shared chunk), so a package built on it shares core's scope, transaction, and graph state instead of getting its own copy. Treat it as advanced and less stable than the main API. From the main entry only the kernel **types** (like `Node`, which appears on every unit as `.node`) are public.
:::

## node and run

```ts
import { node, run } from "@virentia/core/internal";
import { scope } from "@virentia/core";

const appScope = scope();

const logNode = node((ctx) => {
  console.log(ctx.value);
});

await run({
  unit: logNode,
  payload: "hello",
  scope: appScope,
});
```

Nodes can pass values to downstream nodes.

```ts
const second = node((ctx) => {
  console.log(ctx.value); // "next"
});

const first = node({
  run: () => "next",
  next: [second],
});

await run({ unit: first, scope: appScope });
```

A node can also enqueue another branch explicitly. `ctx.launch` keeps the current scope, contexts, metadata, and batch key, but lets the node choose which unit receives the next value.

```ts
const gate = node((ctx) => {
  ctx.stop();
  ctx.launch(second, "next");
});
```

`ctx.stop()` stops the current branch; `ctx.fail(error)` stops it as a failed branch.

## Dependency tracking

A custom store makes its reads reactive by reporting them to the surrounding `computed` or reaction. Call `trackNode(node)` from a read: inside a tracking window it registers `node` as a dependency, so firing that node later re-runs the reader.

```ts
import { node, run, trackNode } from "@virentia/core/internal";

const storeNode = node({ run: (ctx) => ctx.value });

function read(scope: Scope): Value {
  trackNode(storeNode); // this read now depends on `storeNode`
  return currentValue(scope);
}

function commit(scope: Scope, next: Value): void {
  void run({ unit: storeNode, payload: next, scope }); // re-runs readers of `storeNode`
}
```

`isTracking()` returns whether a read would register right now — use it to skip building fine-grained dependency keys on reads nobody is tracking (a plain mutation), keeping the write path cheap. `collectNodes(fn)` runs `fn` and returns `{ result, nodes }`, the set of nodes it tracked — the mechanism a `computed` uses to collect its own dependencies.

For per-keypath tracking — subscribing a reader only to the parts of a value it read — see how [`@virentia/mutable`](/mutable/#keypath-tracking) maps keypaths to lazily-created nodes.

## Active scope

Store values live in a scope, so a custom store resolves the active one on each read or write.

```ts
import { getActiveScope, requireActiveScope, setActiveScope } from "@virentia/core/internal";

const scope = requireActiveScope(() => "read a counter store");
```

`requireActiveScope(describe)` returns the active scope or throws the actionable “Scope is required” error, using `describe()` and the unit path to say what needed a scope. `getActiveScope()` returns it or `null`. `setActiveScope(scope)` swaps the ambient scope and returns the previous one — the low-level primitive behind `scoped`.

## Transaction integration

Store writes are batched and applied at the transaction boundary (see [Transactions](/core/transactions)). A custom store joins that boundary with `writeTransactionStore`:

```ts
import { writeTransactionStore } from "@virentia/core/internal";
import type { StoreCommitResult, StoreTransactionTarget } from "@virentia/core/internal";

const id = Symbol("my-store");

const target: StoreTransactionTarget = {
  id, // dedupes repeated writes to this store in one transaction
  scope,
  commit(): StoreCommitResult {
    const changed = applyStagedValueToScope();
    return {
      changed,
      notify: () => notifySubscribersAndFireNodes(),
    };
  },
};

writeTransactionStore(target, stagedValue);
```

At the boundary the kernel calls each target's `commit()` once (repeated writes to the same `id` + `scope` dedupe), applies the changes, then runs every `notify` — so subscribers observe the committed final value. `readTransactionStore(target)` reads a staged value back inside the same transaction. Transactions never roll back.

This is exactly how [`@virentia/mutable`](/mutable/) defers a whole deep edit to one atomic commit — read its source for a complete worked example.

## Kernel contexts

Kernel contexts pass execution metadata through a run chain.

```ts
import { context, node, run } from "@virentia/core/internal";

const requestId = context<string>();

const reader = node((ctx) => {
  console.log(ctx.getContext(requestId));
});

await run({
  unit: reader,
  scope: appScope,
  contexts: [requestId.setup("request-42")],
});
```

Use stores for application state. Use kernel contexts for metadata that belongs to one execution. `withContexts([...], fn)` sets contexts around a synchronous call made outside a node.

## Mechanics

The user-facing transaction model is described in [Transactions](/core/transactions). Runtime mechanics and design rationale live in [Deep Knowledge](/guide/deep-knowledge).
