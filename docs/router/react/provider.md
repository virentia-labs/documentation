---
title: Provider
---

# Provider

`RouterProvider` puts a router into React context so that route views, `Link`,
and the router hooks can find it. It optionally attaches a history adapter when
it mounts.

```tsx
function RouterProvider(props: {
  router: Router;
  history?: RouterAdapter;
  children?: ReactNode;
}): ReactNode;
```

## Scope and provider order

Router state lives in a Virentia scope, so `RouterProvider` sits inside a
`ScopeProvider`. Everything that reads route state must be under both:

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider } from "@virentia/router-react";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import type { ReactNode } from "react";
import { appScope } from "./scope";
import { appRouter } from "./router";

const routerHistory = historyAdapter(createBrowserHistory());

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={appRouter} history={routerHistory}>
        {children}
      </RouterProvider>
    </ScopeProvider>
  );
}
```

The order matters: `ScopeProvider` first, so the router writes into the scope
React renders from.

## Attaching history

When you pass `history`, `RouterProvider` calls `appRouter.setHistory` on mount in
the provider's scope. This is the usual place to connect history in a
React-driven app.

If history is created and attached outside React — in a server loader, a startup
command, or a test — omit the prop and pass only `router`:

```tsx
<RouterProvider router={appRouter}>
  <App />
</RouterProvider>
```

The router then uses whatever history was set through
`appRouter.setHistory` elsewhere. See
[Router and history](/router/core/router#connecting-history) for the history
adapter contract and the non-React ways to attach it.

## Nested routers

A [nested router](/router/core/router#nested-routers) is rendered with its own
`RouterProvider` only if a subtree needs a different router in context. Most apps
provide a single root router; child routers registered through `router`
receive history from their parent and do not need their own provider.
