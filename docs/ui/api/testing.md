# Testing with Vitest

Virentia uses the same render and model APIs in tests as in an application. It does not import Vitest, create a test scope, or provide a replacement for test. Create your scope and DOM container in the test body or in a fixture you control.

Configure Vitest with a DOM environment such as happy-dom:

```ts
export default defineConfig({
  test: { environment: "happy-dom" },
});
```

Import defineConfig from vitest/config. For concurrent tests, do not share a mutable scope variable or DOM container through beforeEach. Each test body creates its own scope; module-level staticModel definitions may be shared.

The existing [rendering API](./rendering) is enough:

```ts
const appScope = scope();
const unmount = render(view, container, { scope: appScope });
await unmount();
```

Scope isolates store values and the native model cache. Separate roots isolate DOM. Several roots may intentionally share a scope; unmounting one does not unmount the others. A ready model passed through model must belong to the render scope.

No global reset is needed between independent scopes. Resource cleanup is a different concern: await unmount in finally or your own fixture teardown when you need to release DOM and lifecycle resources. Supplied models remain creator-owned; dispose them explicitly when their lifetime ends. Automatically created models are destroyed on unmount unless keep is enabled.

Bound instance units work outside an ambient scope. Use scoped(appScope, callback) for shared unit access and model creation. Direct awaits of Virentia units retain context; arbitrary native promises do not.

The [parallel-testing recipe](../recipes/testing) checks equal model IDs, bound units and exact DOM identity with ordinary test.concurrent.
