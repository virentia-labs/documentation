---
title: Router getting started
---

# Router Getting Started

This page is a short orientation map. The main documentation is split by mental
pattern instead of putting route declaration, history setup, navigation, and
rendering into one tutorial.

## Install

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

`history` is installed in the application. Router packages accept history
adapters but do not create browser or memory history internally.

## Read by task

- URL templates: [Path templates](/router/paths).
- Route state: [Route model](/router/routes).
- Route registration and history: [Router and history](/router/router).
- Route opening and URL writes: [Navigation](/router/navigation).
- Query-driven dialogs and filters: [Query tracking](/router/query-tracking).
- Opened routes in React: [React rendering](/router/react).

## Smallest Shape

The smallest app has three separate pieces:

```ts
// routes.ts
export const homeRoute = createRoute({ path: "/" });
export const profileRoute = createRoute({ path: "/users/:id<number>" });
```

```ts
// router.ts
export const router = createRouter({
  routes: [homeRoute, profileRoute],
});
```

```tsx
// app-providers.tsx
<ScopeProvider scope={appScope}>
  <RouterProvider router={router} history={routerHistory}>
    <App />
  </RouterProvider>
</ScopeProvider>
```

Those responsibilities stay separate in real code too. Routes describe
addressable model state, the router connects that state to URL changes, and
React bindings only render what the model has opened.
