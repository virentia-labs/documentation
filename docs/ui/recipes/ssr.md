# SSR request/client boundary

The server entry loads JSON data and calls renderPage. The client entry restores it with hydratePage. Both use a page factory creating the root graph in the current request/client scope.

<UIFlow kind="ssr" />

Snapshot after view, restore before model creation. Each request has independent values/collections; the identity manifest repeats generated IDs.

Graph bootstrap remains necessary. Snapshots do not create dormant collections, DOM or callbacks. Non-JSON unit state needs separate data preparation. Test actual node identity during hydration, not only equal HTML.

See [SSR API](../api/server-start), DOM identity checks and [Start](../start).

::: details Complete example sources
::: code-group
<<< @/ui/examples/ssr-app.tsx
<<< @/ui/examples/ssr-server.ts
<<< @/ui/examples/ssr-client.ts
:::
:::
