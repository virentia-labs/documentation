# Server rendering

Create a scope for each request, load data and create the model graph. Then render HTML and capture state.

```ts
const requestScope = scope();
const view = scoped(requestScope, () => createPage(data));
const html = renderToString(view, { scope: requestScope });
const snapshot = serialize(requestScope);
```

createPage is your function that creates models and returns a view; the [SSR recipe](./recipes/ssr) includes a working implementation. Import serialize from Core and renderToString from UI/server.

<UIFlow kind="ssr" />

On the client, create a scope with the snapshot, recreate the same graph from loaded data and hydrate the existing nodes.

## State transfer

Snapshots contain JSON values of writable SID stores and a model identity manifest. Use stable model names/SIDs and matching server/client identifierPrefix values. Give stores explicit SIDs or use the [Core plugin](./api/compiler).

DOM refs and computed caches are excluded. Recreate collection membership from source data. Use serializeState or the Start payload for JSON inside a script.

[Start](./start) builds one load/SSR page. Native-content SSR inside React/Vue adapters is not supported yet.
