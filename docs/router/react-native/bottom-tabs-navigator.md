---
title: Bottom tabs navigator
---

# Bottom Tabs Navigator

`bottomTabsNavigator` builds a `@react-navigation/bottom-tabs`
navigator and returns a `{ Navigator }` component. It follows route opens like
the [stack navigator](/router/react-native/stack-navigator), and it adds one
thing: pressing a tab opens that tab's route inside the Virentia scope.

Setup — providers, history, and route views — is shared and lives on the
[React Native overview](/router/react-native/).

```tsx
import { bottomTabsNavigator } from "@virentia/router-react-native";
import { appRouter, homeRoute, searchRoute } from "./router";
import { HomeScreen, SearchScreen } from "./screens";

const { Navigator } = bottomTabsNavigator({
  router: appRouter,
  routes: [
    { route: homeRoute, view: HomeScreen },
    { route: searchRoute, view: SearchScreen },
  ],
  initialRouteName: "home",
});
```

## Tab press goes through route.open

Because the tab press calls `route.open`, route checks, `beforeOpen`, and query
tracking all run — the same path as opening the route from anywhere else. The tab
does not just swap the visible screen; it changes router state, so the rest of
the app stays consistent.

Routes without an `open` event (a plain view that is not an openable route) fall
back to the default React Navigation tab behavior.

## Opening tabs with params

A tab route that needs params or query carries an `openPayload`, passed to
`route.open` when the tab is pressed. Use a value for static payloads or a
function for payloads computed at press time:

```tsx
const { Navigator } = bottomTabsNavigator({
  router: appRouter,
  routes: [
    { route: homeRoute, view: HomeScreen },
    {
      route: profileRoute,
      view: ProfileScreen,
      openPayload: {
        params: { id: "42" },
        query: { source: "tab" },
      },
    },
    {
      route: detailsRoute,
      view: DetailsScreen,
      openPayload: () => ({ id: currentUserId() }),
    },
  ],
  initialRouteName: "home",
});
```

`openPayload` is the only addition over a plain route view; everything else
matches `routeView`.

```ts
interface BottomTabsRouteView extends RouteView {
  openPayload?: unknown | (() => unknown);
}
```

## Configuration

```ts
interface BottomTabsNavigatorConfig {
  router: Router;
  routes: BottomTabsRouteView[];
  initialRouteName?: string;
  screenOptions?: BottomTabNavigationOptions;
}
```

| Option | Type | Description |
| --- | --- | --- |
| `router` | `Router` | The router whose routes these tabs belong to |
| `routes` | `BottomTabsRouteView[]` | Route views, optionally with `openPayload` |
| `initialRouteName` | `string` | Optional first tab name (see [Screen names](/router/react-native/#screen-names)) |
| `screenOptions` | `BottomTabNavigationOptions` | Optional options applied to each tab |

## Following external opens

The navigator also follows route opens that come from outside the tab bar — a
deep link, a push notification handler, or a `route.open` call in business logic.
When such a route opens, its tab becomes active and the screen reads the fresh
params from the route model, so an external `profileRoute.open({ params: { id:
"99" } })` selects the profile tab and shows id `99`.
