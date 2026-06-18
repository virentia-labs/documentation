---
title: React Native
---

# React Native

`@virentia/router-react-native` connects Virentia routes to
[React Navigation](https://reactnavigation.org). It does not declare routes and
it does not decide which screen is active — that work stays in the
[core](/router/core/) route and router models, exactly like on the web.

The package builds React Navigation navigators from your route views and keeps
them in sync with the router in both directions:

- when a route opens (through `route.open`, a link, or history), the matching
  React Navigation screen is brought to the front;
- when the user presses a bottom tab, the bound route is opened in your Virentia
  scope, so route checks, query tracking, and `beforeOpen` still run.

State stays in the route models. The navigator is only a renderer.

## Pages

- [Stack navigator](/router/react-native/stack-navigator) —
  `createVirentiaStackNavigator`.
- [Bottom tabs navigator](/router/react-native/bottom-tabs-navigator) —
  `createVirentiaBottomTabsNavigator` and tab-press opening.

## Install

The package depends on `@virentia/router`, `@virentia/router-react`, and
`@virentia/react` for the route model side, and on React Navigation for the
native UI:

```sh
pnpm add @virentia/router-react-native @virentia/router @virentia/router-react @virentia/react react react-native
pnpm add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
pnpm add react-native-gesture-handler react-native-safe-area-context react-native-screens
```

React Navigation, `react-native-screens`, `react-native-safe-area-context`, and
`react-native-gesture-handler` are peer dependencies. Follow the React
Navigation setup guide for the native modules (gesture handler import, screens
enabling, and the iOS pods).

## Providers

A React Native app is wrapped the same way as a web app, plus a React Navigation
`NavigationContainer`. The order matters: the Virentia scope and router must be
available to every screen, so they sit above `NavigationContainer`.

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider } from "@virentia/router-react";
import { NavigationContainer } from "@react-navigation/native";
import { appScope } from "./scope";
import { router } from "./router";
import { Navigator } from "./navigator";

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router}>
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      </RouterProvider>
    </ScopeProvider>
  );
}
```

History is created by the application, not by the router. On native there is no
browser URL, so use a memory history:

```ts
import { createMemoryHistory } from "history";
import { historyAdapter } from "@virentia/router";
import { allSettled } from "@virentia/core";
import { appScope } from "./scope";
import { router } from "./router";

await allSettled(router.setHistory, {
  scope: appScope,
  payload: historyAdapter(createMemoryHistory({ initialEntries: ["/home"] })),
});
```

`initialEntries` sets the first opened route. If you skip history entirely, the
navigators still render and respond to `route.open`, but deep links and the
back stack are not tracked.

## Route views

Both navigators take an array of route views — the same `{ route, view }` shape
used by [`@virentia/router-react`](/router/react/views). Each view binds one
route model to one screen component:

```tsx
import { createRouteView } from "@virentia/router-react";
import { homeRoute, profileRoute } from "./router";
import { HomeScreen, ProfileScreen } from "./screens";

const routes = [
  createRouteView({ route: homeRoute, view: HomeScreen }),
  createRouteView({ route: profileRoute, view: ProfileScreen }),
];
```

Screens read params and query from the route model, not from React Navigation
props:

```tsx
import { useUnit } from "@virentia/react";
import { profileRoute } from "./router";

function ProfileScreen() {
  const { id } = useUnit(profileRoute.params);

  return <Text>Profile {id}</Text>;
}
```

## Screen names

Screen and tab names are derived from each route's path so `initialRouteName` is
predictable:

- a stack screen name is the route `path` (for example `/profile/:id`), or
  `Route{index}` for a pathless route;
- a tab screen name is the path with slashes removed (`/search` becomes
  `search`), or `Tab{index}` for a pathless route;
- a tab title is the last static path segment (`/profile/:id` becomes
  `profile`), or `Tab {n}` when no static segment exists.

Pass these names to `initialRouteName`. Override the visible tab label through
`screenOptions` if the derived title does not fit.

## Exports

```ts
import {
  createVirentiaStackNavigator,
  createVirentiaBottomTabsNavigator,
} from "@virentia/router-react-native";

import type {
  VirentiaStackNavigatorConfig,
  VirentiaStackNavigatorOptions,
  VirentiaBottomTabsNavigatorConfig,
  VirentiaBottomTabsNavigatorOptions,
  VirentiaBottomTabsRouteView,
} from "@virentia/router-react-native";
```

`VirentiaStackNavigatorOptions` and `VirentiaBottomTabsNavigatorOptions` are
re-exports of the React Navigation option types, so existing screen-option code
keeps working.

## What stays in the route model

The navigators do not introduce a second source of truth. Keep these in route
and router models, the same as on the web:

- which route is active (`route.open`, `route.isOpened`, history);
- params and query (`route.params`, `router.query`, query tracking);
- access checks and redirects (`beforeOpen`).

The navigator reads those models, renders the matching screen, and routes tab
presses back into `route.open`. Navigation semantics are described in
[Navigation](/router/core/navigation), and the rendering model the views build
on is described in [React](/router/react/).
