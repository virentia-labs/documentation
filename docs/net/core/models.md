---
title: Queries in Static Models
---

# Queries in Static Models

These model APIs require `@virentia/core` 0.11.2 or newer.

Declare queries, mutations and shared triggers in `staticModel.setup`. Return
the native API directly: `.create()` binds its call and nested data/lifecycle
units to the instance. Additional aliases for `load.data` are unnecessary.

<<< @/examples/packages/net.ts#model

The example returns a deterministic result so it can run without a server.
A real fetcher can pass `ctx.signal` to `fetch`. Query/mutation effects preserve
their existing parameters, result types and operators.

## Independent Requests

<<< @/examples/packages/net.ts#use

Instances share declarations and keep `data`, `pending`, last parameters,
refresh/reset and cancellation separate. Disposing one instance aborts its
pending requests and releases its triggers. Sibling instances remain active.
For a replaceable runtime trigger, keep the disposer returned by `trigger`.

Declare a trigger once in `setup`; do not create a fresh trigger every time a
bound method runs unless its shorter lifetime is intended. `.static()` creates
a separate module graph and is only needed for that ownership choice.

## Async Context and SSR

Each SSR request uses its own scope. Finish the server's requests, transfer model
DTOs and scope state, and restore them before rendering/hydrating the client.
Pending requests and abort controllers are runtime resources; recreate them as
needed rather than treating them as serialized data.

Directly awaiting a Virentia unit carries its async context. After an ordinary
external Promise, timer or `fetch`, use a captured `scoped` runner for subsequent
unit calls and unbound store reads/writes. In form validators use `ctx.read`
for reads after an external wait. Bound model APIs retain their instance.

See [queries](./query), [mutations](./mutation), [triggers](./triggers) and
[form ownership](/forms/models). Native APIs created at module scope remain
available for a deliberately application-wide graph.
