# Storage

`@virentia/storage-core` persists Virentia stores into pluggable backends — `localStorage`, `sessionStorage`, the URL query string, memory, or your own — and keeps them in sync **both ways**.

State stays a model: a store remembers a value, and a `persist` binding mirrors that value into a **box** for one scope. The model never learns where it renders or where it is stored.

```sh
pnpm add @virentia/storage-core @virentia/core
```

## Boxes

A **box** is a small backend `persist` reads from and writes to. Five are built in:

| Box | Backing store | Survives | External sync |
|-----|---------------|----------|---------------|
| `local()` | `localStorage` | reloads, restarts | other tabs (`storage` event) |
| `session()` | `sessionStorage` | reloads (per tab) | — |
| `query()` | URL `?key=value` | in the URL / history | back / forward (`popstate`) |
| `memory()` | in-process `Map` | the session | same process |
| `custom(impl)` | anything you supply | up to you | up to you |

The DOM-backed boxes fall back to `memory()` when their environment is missing (SSR, workers) or blocked (private mode), so the same model code runs on the server unchanged. See [Boxes](/storage/boxes) for each one, serialization, and SSR behavior.

## Persist a store

`persist` keeps one writable store and one box in sync for one scope:

```ts
import { scope, scoped, store } from "@virentia/core";
import { local, persist } from "@virentia/storage-core";

const theme = store<"light" | "dark">("light");
const app = scope();

scoped(app, () => {
  persist({ source: theme, key: "theme", storage: local() });
});
```

On the first run the store is seeded from the box if the key exists; from then on every change is written out, and an external change (another tab, back/forward) is pulled back in. A re-entrancy guard breaks the write↔watch loop, so a value that came from the box is not written straight back to it.

See [Persistence](/storage/persist) for scopes, owners, and custom serialization.
