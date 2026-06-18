---
title: Router
---

# Router

Virentia Router is a route model family for applications built with
`@virentia/core` and `@virentia/react`.

The documentation is grouped by the layer you work in:

- **[Core](/router/core/)** — framework-agnostic routing: path templates, route
  models, the router, navigation, query tracking, and virtual routes.
- **[React](/router/react/)** — rendering opened routes in a React DOM tree.
- **[React Native](/router/react-native/)** — rendering opened routes through
  React Navigation.

Within core, each piece is documented separately so setup, routing rules, URL
updates, and rendering do not collapse into one example: a path template
describes how a URL is parsed and built; a route is a Virentia model for one
addressable state; a router registers routes, owns URL matching, and connects to
history; navigation is a command boundary that opens routes or writes a URL; and
query tracking turns URL query state into model events. The React and React
Native layers only render already-opened route models.

## Packages

| Package | Purpose |
| --- | --- |
| `@virentia/router-paths` | Typed path templates, parsing, building, and Express conversion |
| `@virentia/router` | Routes, routers, history adapters, query tracking, virtual routes, groups, chained routes |
| `@virentia/router-react` | `RouterProvider`, `Link`, route views, lazy views, outlets, hooks |
| `@virentia/router-react-native` | Stack and bottom-tabs navigators that bind route views to React Navigation |

## Install

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

The router package accepts history adapters, but it does not create browser or
memory history internally. Applications own history creation.

## Pages

Core (`@virentia/router` + `@virentia/router-paths`):

- [Overview](/router/core/)
- [Path templates](/router/core/paths)
- [Route model](/router/core/routes)
- [Router and history](/router/core/router)
- [Navigation](/router/core/navigation)
- [Query tracking](/router/core/query-tracking)
- [Virtual, chained & grouped routes](/router/core/virtual-routes)

React (`@virentia/router-react`):

- [Overview](/router/react/)
- [Provider](/router/react/provider)
- [Route views & outlets](/router/react/views)
- [Links](/router/react/links)
- [Hooks](/router/react/hooks)

React Native (`@virentia/router-react-native`):

- [Overview](/router/react-native/)
- [Stack navigator](/router/react-native/stack-navigator)
- [Bottom tabs navigator](/router/react-native/bottom-tabs-navigator)

Other:

- [Migrating from argon-router](/router/migration-from-argon-router)
