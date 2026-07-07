# @virentia/storage-core API

`@virentia/storage-core` persists Virentia stores into pluggable storage backends. `@virentia/core` is a peer dependency.

## persist

```ts
import { persist } from "@virentia/storage-core";

const stop = persist({
  source, // StoreWritable<T> — the store to persist
  key, // string — the box key
  storage, // StorageBox — local() | session() | query() | memory() | custom()
  scope, // Scope — defaults to the current active scope
  serialize, // (value: T) => unknown — value → stored form
  deserialize, // (raw: unknown) => T — stored form → value
});
```

Keeps `source` and `storage` in sync both ways for `scope`: hydrate on start, write on change, and pull external changes back in when the box supports `watch`. Returns a `stop()` disposer and, inside an `owner`, tears down on dispose. Throws when no scope is active and none is passed.

## Boxes

### local

```ts
import { local } from "@virentia/storage-core";

const box = local(); // local({ serializer })
```

`localStorage`-backed. Persists across reloads, shared across tabs; `watch` fires on cross-tab writes. Falls back to `memory()` when Web Storage is unavailable or blocked.

### session

```ts
import { session } from "@virentia/storage-core";

const box = session(); // session({ serializer })
```

`sessionStorage`-backed. Scoped to one tab. Falls back to `memory()` when unavailable.

### query

```ts
import { query } from "@virentia/storage-core";

const box = query(); // query({ serializer, history: "replace" | "push" })
```

URL query-string-backed. Each key is a `?key=value` param. `watch` observes `popstate`. Defaults to `querySerializer` and `history: "replace"`. Falls back to `memory()` outside the browser.

### memory

```ts
import { memory } from "@virentia/storage-core";

const box = memory(); // memory([["key", value]])
```

In-process `Map`. Holds references, no serialization; `watch` fires on same-process writes. The fallback for the DOM boxes.

### custom

```ts
import { custom } from "@virentia/storage-core";

const box = custom({
  get: (key) => /* … */ undefined,
  set: (key, value) => {},
  remove: (key) => {},
  watch: (key, listener) => () => {}, // optional
});
```

Adapts a user-supplied backend into a `StorageBox`. The extension point behind the built-in boxes.

## Serializers

### jsonSerializer

```ts
import { jsonSerializer } from "@virentia/storage-core";
```

Strict JSON in both directions. The default for `local` and `session`.

### querySerializer

```ts
import { querySerializer } from "@virentia/storage-core";
```

Strings pass through verbatim; everything else is JSON. On read, JSON is tried first with a fallback to the raw string. The default for `query`.

## Types

```ts
import type {
  StorageBox,
  Serializer,
  StringBoxOptions,
  QueryBoxOptions,
  CustomStorage,
  PersistOptions,
} from "@virentia/storage-core";
```

- `StorageBox` — the box contract: `get`, `set`, `remove`, optional `watch`.
- `Serializer` — `read(raw: string)` / `write(value: unknown)`.
- `StringBoxOptions` — `{ serializer? }`, shared by `local`/`session`.
- `QueryBoxOptions` — `{ serializer?, history? }` for `query`.
- `CustomStorage` — the backend shape `custom` accepts.
- `PersistOptions<T>` — the `persist` argument.
