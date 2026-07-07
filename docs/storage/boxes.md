# Storage boxes

A **box** is the backend `persist` reads from and writes to. Every box implements the same small contract, so a store moves between backends by swapping one factory call.

```ts
interface StorageBox {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  watch?(key: string, listener: (value: unknown) => void): () => void;
}
```

Values crossing this interface are already **deserialized** — a string-backed box (Web Storage, the URL) owns its serialization; a reference-backed box (memory) does none. `get` returns `undefined` for a missing key. `watch` is optional: a box implements it only when it can observe **external** changes.

## local

`localStorage`-backed. Persists across reloads and restarts, shared across tabs of the same origin; cross-tab writes surface through `watch`.

```ts
import { local } from "@virentia/storage-core";

const box = local();
box.set("user", { name: "Ada" }); // stored as '{"name":"Ada"}'
box.get("user"); // { name: "Ada" }
```

## session

`sessionStorage`-backed. Scoped to one tab, cleared when it closes. Same API as `local`, no cross-tab sync.

```ts
import { session } from "@virentia/storage-core";

const box = session();
```

## query

Backed by the URL query string — each key is a `?key=value` param. Reads and writes go through `history.replaceState` (or `pushState`), which don't fire `popstate`, so a write never echoes back into the store; `watch` observes `popstate`, i.e. back/forward navigation.

```ts
import { query } from "@virentia/storage-core";

const box = query();
box.set("q", "docs"); // → ?q=docs
box.set("page", 2); // → ?q=docs&page=2
```

`query` defaults to `querySerializer`: strings pass through verbatim for readable URLs, everything else is JSON; on read it tries JSON first and falls back to the raw string. Add a history entry per write with `history: "push"`:

```ts
const box = query({ history: "push" });
```

## memory

An in-process `Map`. Holds references (no serialization), never touches the DOM, and is the fallback the DOM boxes degrade to. `watch` fires for same-process writes, so several bindings sharing one memory box stay in sync. Use it for tests, non-browser runtimes, or an explicit in-memory tier.

```ts
import { memory } from "@virentia/storage-core";

const box = memory([["theme", "dark"]]); // optional seed
```

## custom

The extension point behind the built-in boxes — they are pre-wired `custom` implementations. Supply a backend, get a `StorageBox`. Wrapping (rather than passing the object through) pins the public surface, so a backend can carry extra methods without leaking them.

```ts
import { custom } from "@virentia/storage-core";

const cookies = custom({
  get: (key) => readCookie(key),
  set: (key, value) => writeCookie(key, value),
  remove: (key) => deleteCookie(key),
  // optional: watch(key, listener) => () => void
});
```

`get`/`set`/`remove` are required; `watch` only when the backend can report outside changes.

## Serialization

The string-backed boxes (`local`, `session`, `query`) take a `serializer` — it turns a value into the stored string and back:

```ts
interface Serializer {
  read(raw: string): unknown;
  write(value: unknown): string;
}
```

`local` and `session` default to `jsonSerializer` (strict JSON), `query` to `querySerializer` (readable URLs). Pass your own for a different encoding:

```ts
import { local, type Serializer } from "@virentia/storage-core";

const base64: Serializer = {
  write: (value) => btoa(JSON.stringify(value)),
  read: (raw) => JSON.parse(atob(raw)),
};

const box = local({ serializer: base64 });
```

A box that cannot parse a stored string (corrupt data, an external write in another format) returns `undefined` from `get` rather than throwing.

## SSR and unavailable environments

`local`, `session`, and `query` probe their environment on creation. When Web Storage is missing (server, worker) or blocked (private mode, sandboxed iframe), they fall back to `memory()`. The same model code runs on the server without guards; nothing is persisted there, which is correct for a per-request run.
