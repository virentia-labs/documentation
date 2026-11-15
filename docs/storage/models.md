---
title: Storage in Static Models
---

# Storage in Static Models

These model APIs require `@virentia/core` 0.11.2 or newer.

Declare the model graph once and connect storage for each live instance from a
bound method or `onCreate`. `setup` declares a shared graph; opening a storage
binding there would attach a runtime resource to definition setup.

<<< @/examples/packages/storage.ts#model

Pass a writable data field or scalar field-model `.value` as `source`, including
an owned child or a referenced field. A bound source retains its own scope.
Cleanup belongs to the instance calling `persist`; borrowing the source does not
transfer its lifetime. Array/shape `.value` is derived and cannot be a writable
persistence source. Persist their DTO/snapshot explicitly when that is needed.

## Separate Keys and Cleanup

Use different boxes or keys when independent instances should not share stored
values. `persist` returns an explicit `stop()` and registers cleanup with the
calling model:

<<< @/examples/packages/storage.ts#use

With `local()` or `session()`, the same key intentionally addresses the same
browser storage entry. Scope isolation does not change that external key.
Explicit `owner` groups remain useful for independently replaceable subscriptions.

## SSR and Hydration

Use one scope per server request. Restore model DTOs and the scope snapshot
before connecting client storage. The existing storage entry seeds the writable
source; otherwise the source seeds the box. Choose deliberately whether stored
client preferences should replace the restored server value, and connect them
after DOM hydration when the initial DOM must match the server.

See [persist](./persist) for boxes, serialization and two-way sync, and
[owned form fields](/forms/models) for `children`/`refs` and JSON transfer.
