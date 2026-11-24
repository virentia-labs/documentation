---
title: Core
---

# Core

For per-instance requests and automatic cancellation on disposal, start with [queries in static models](./models). The native query/mutation APIs remain the same.

The core of Virentia Net is one framework-agnostic package:

| Package | Purpose |
| --- | --- |
| `@virentia/net-core` | Queries, mutations, triggers, concurrency/retry operators, executor adapters, scoped defaults |

It does not depend on React or Vue. Remote data is modeled as Virentia state —
a query is a real `@virentia/core` effect with `data`/`error`/`stale` stores on
top — so any renderer reads the same models through its own thin binding
([React](/net/react/), [Vue](/net/vue/)) or plain `scoped`.

## Pages

- [Query](/net/core/query) — the fetch effect: config, units, reading and
  driving per scope.
- [Mutation](/net/core/mutation) — the write side: `optimistic` updates and
  `invalidates`.
- [Triggers](/net/core/triggers) — run a query or mutation when any Virentia
  unit fires.
- [Operators](/net/core/operators) — `concurrency` and `retry` as ordered
  `use: []` middleware.
- [Adapters](/net/core/adapters) — TanStack Query and Apollo executors behind
  the same query surface.
- [Defaults](/net/core/defaults) — `overrideDefaults` for a shared executor or
  operators, globally or per scope.
