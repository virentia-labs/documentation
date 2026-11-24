# SSR and Start

Native SSR executes view in an explicit request scope without DOM refs or lifecycle. Models remain available for the post-render snapshot.

```ts
renderToString(factory: () => Child, options: RenderOptions): string;
renderToStaticMarkup(factory: () => Child, options: RenderOptions): string;
renderToStringAsync(factory: () => Child, options: RenderOptions): Promise<string>;
renderToStaticMarkupAsync(factory: () => Child, options: RenderOptions): Promise<string>;
serializeState(snapshot: ScopeSnapshot): string;
renderPage<Data>(view: (data: Data) => Child, data: Data,
  options: { identifierPrefix: string }): RenderedPage;
renderPageAsync<Data>(view: (data: Data) => Child, data: Data,
  options: { identifierPrefix: string }): Promise<RenderedPage>;
hydratePage<Data>(view: (data: Data) => Child,
  container: Element | DocumentFragment, payloadText: string): HydratedPage<Data>;
renderDocument(page: RenderedPage, options: DocumentOptions): string;
```

String output includes hydration markers; StaticMarkup omits them and is not a hydrate input. Async variants await internal renderer work, but arbitrary async children remain invalid.

serializeState escapes JSON for scripts. Core serialize(scope) captures the snapshot. Values must be JSON-compatible; stable SIDs/model names and matching identifierPrefix are required. The identity manifest does not recreate dormant model graphs; bootstrap them from load data.

RenderedPage has html/payload. `PagePayload<Data>` has data/snapshot/identifierPrefix. `HydratedPage<Data>` has data/scope/dispose: () => `Promise<void>`. renderPage creates a request scope and snapshots after rendering; hydratePage restores before model reads.

DocumentOptions requires clientEntryUrl, with optional title/stylesheets/modulePreloads. renderDocument emits a complete document.

Default virentiaStart(options?: StartOptions) wires app.tsx and optional load.server.ts for one page, with no router. Options app/load/title/identifierPrefix/namespace are strings. Loader code stays server-only and receives the request URL.

buildStart(options?) returns `Promise<void>`, building client before server with the same configuration. createStartServer/serveStart return `Promise<node:http.Server>`. Build options are root/configFile; serve adds host/port. Build before serving. The asset server rejects static-directory escape and external symlinks.

See the [Start template](../start).
