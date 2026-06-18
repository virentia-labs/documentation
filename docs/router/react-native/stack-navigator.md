---
title: Stack navigator
---

# Stack Navigator

`createVirentiaStackNavigator` builds a `@react-navigation/stack` navigator from
your route views and returns a `{ Navigator }` component. The navigator follows
the router: whichever route view is the deepest currently opened one is brought
to the front of the stack.

Setup — providers, history, and route views — is shared with the other navigator
and lives on the [React Native overview](/router/react-native/).

```tsx
import { createVirentiaStackNavigator } from "@virentia/router-react-native";
import { createRouteView } from "@virentia/router-react";
import { router, homeRoute, profileRoute } from "./router";
import { HomeScreen, ProfileScreen } from "./screens";

const { Navigator } = createVirentiaStackNavigator({
  router,
  routes: [
    createRouteView({ route: homeRoute, view: HomeScreen }),
    createRouteView({ route: profileRoute, view: ProfileScreen }),
  ],
  initialRouteName: "/home",
  screenOptions: {
    headerShown: false,
  },
});
```

## Configuration

```ts
interface VirentiaStackNavigatorConfig {
  router: Router;
  routes: RouteView[];
  initialRouteName?: string;
  screenOptions?: StackNavigationOptions;
}
```

| Option | Type | Description |
| --- | --- | --- |
| `router` | `Router` | The router whose routes these views belong to |
| `routes` | `RouteView[]` | Route views, in screen registration order |
| `initialRouteName` | `string` | Optional first screen name (see [Screen names](/router/react-native/#screen-names)) |
| `screenOptions` | `StackNavigationOptions` | Optional options applied to the navigator and each screen |

## How it follows the router

The navigator subscribes to the opened views for its `routes`. When the set of
opened routes changes, it calls `navigate` on the screen for the deepest opened
view. Because a child route opens its
[parent](/router/core/routes#parent-routes) too, a nested child screen is
preferred over its opened parent — opening `/profile/friends` shows the friends
screen, and opening `/profile` again returns to the profile screen.

If an opened route has no view in `routes`, the current screen stays on top — the
navigator never blanks out. This lets you open routes that are handled elsewhere
(a different navigator, a modal) without disturbing the stack.

## Virtual routes as screens

[Virtual routes](/router/core/virtual-routes) created with `createVirtualRoute`
are supported as pathless, modal-style screens. They get a generated screen name
(`Route{index}`), and their transformed params are read from the route model the
same as any other screen:

```tsx
const { Navigator } = createVirentiaStackNavigator({
  router,
  routes: [
    createRouteView({ route: homeRoute, view: HomeScreen }),
    createRouteView({ route: detailsRoute, view: DetailsScreen }), // virtual route
  ],
  initialRouteName: "/home",
});
```

Opening `detailsRoute.open({ id: "modal-1" })` pushes its screen; the screen
reads `useUnit(detailsRoute.params)` for the transformed payload.
