---
title: Source-stable SIDs
---

# Source-stable SIDs

The optional `@virentia/core/compiler` Babel plugin assigns source-stable SIDs to imported `store`, `reactive`, `readonlyReactive` and `event` calls. Store SIDs let a server [scope snapshot](/ui/ssr) restore state in a client scope. Event SIDs identify event declarations but add no event state to the snapshot.

## Vite without Virentia JSX

Use the standalone adapter when your app uses Core with React, Vue or another JSX runtime:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import virentiaCore from "@virentia/core/compiler/vite";

export default defineConfig({
  plugins: [virentiaCore({ namespace: "my-app" })],
});
```

The adapter needs Babel 7 in the build. It runs before Vite's regular transforms, leaves JSX and TypeScript syntax intact, and processes ordinary `.ts`/`.js` state modules as well as JSX files. It recognizes named, aliased and namespace imports from `@virentia/core` or `@virentia/ui`; unrelated or shadowed calls are left alone. The `@virentia/ui/vite` adapter already includes the Core SID pass while compiling native Virentia JSX.

For another build tool, use the Babel 7 plugin from `@virentia/core/compiler` with a filename and `{ root, namespace }` options. Automatic SIDs encode the namespace, source path relative to `root`, and source call position. Vite defaults `root` to its resolved project root. Keep relative source paths and namespace the same in server and client builds; override `root` if Vite's resolved root is not the intended source root. Set `sid: false` to disable automatic SID generation.

## Explicit identities and snapshots

The compiler preserves an explicit SID in a literal metadata object. Without compilation, provide one yourself:

```ts
import { event, store } from "@virentia/core";

const user = store(null, undefined, { sid: "session/user" });
const changed = event({ sid: "session/changed" });
```

`serialize(scope)` includes materialized writable SID stores. `scope({ snapshot })` restores their values lazily before the first read or write. Duplicate SIDs in one scope throw. Native Virentia UI prefixes local SIDs with a component instance path; repeated factory calls outside that ownership need distinct explicit SIDs. Automatically generated SIDs match across builds of the same source, but are not permanent schema IDs after code edits. The compiler requires explicit call arguments and literal metadata objects for safe rewriting; an argument spread or dynamic metadata object produces a diagnostic unless automatic SIDs are disabled.
