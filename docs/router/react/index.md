---
title: React
---

# React

`@virentia/router-react` renders route models from `@virentia/router` in a React
tree. It does not declare routes and it does not decide which URL is active —
that work stays in the [core](/router/core/) route and router models. The React
package only answers "given the opened routes, what should the DOM show?"

It covers these UI jobs:

- provide a router and optional history adapter to a React subtree;
- render the deepest opened route view, with parent layouts and child outlets;
- build links that keep normal browser anchor behavior;
- preload React chunks for lazy route views;
- expose small hooks for custom adapters and design-system components.

## Pages

- [Provider](/router/react/provider) — `RouterProvider`, scope, and attaching
  history.
- [Route views & outlets](/router/react/views) — `createRouteView`,
  `createRoutesView`, `Outlet`, layouts, and lazy views.
- [Links](/router/react/links) — `Link` and `useLink`.
- [Hooks](/router/react/hooks) — `useRouter`, `useIsOpened`, `useOpenedViews`.

## Install

```sh
pnpm add @virentia/core @virentia/react @virentia/router @virentia/router-react react
pnpm add history
```

`@virentia/react` provides `ScopeProvider` and `useUnit`; `history` is the
browser/memory history the application owns and passes to the router.

## The smallest tree

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider, createRouteView, createRoutesView } from "@virentia/router-react";
import { historyAdapter } from "@virentia/router";
import { createBrowserHistory } from "history";
import { appScope } from "./scope";
import { router, homeRoute, profileRoute } from "./router";
import { HomePage, ProfilePage } from "./pages";

const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: homeRoute, view: HomePage }),
    createRouteView({ route: profileRoute, view: ProfilePage }),
  ],
  otherwise: NotFoundPage,
});

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router} history={historyAdapter(createBrowserHistory())}>
        <RoutesView />
      </RouterProvider>
    </ScopeProvider>
  );
}
```

From here, route declaration lives in the core models, and every page below
explains one part of the rendering layer. For React Native, the same models are
rendered through React Navigation — see [React Native](/router/react-native/).
