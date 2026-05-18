---
title: Router
---

# Router

Virentia Router is a route model family for applications built with
`@virentia/core` and `@virentia/react`.

The router is split into several mental patterns:

- a path template describes how a URL is parsed and built;
- a route is a Virentia model for one addressable state;
- a router registers routes, owns URL matching, and connects to history;
- navigation is a command boundary that opens routes or writes a URL;
- query tracking turns URL query state into model events;
- React bindings only render already-opened route models.

Those pieces are documented separately so setup, routing rules, URL updates, and
rendering do not collapse into one example.

## Packages

| Package | Purpose |
| --- | --- |
| `@virentia/router-paths` | Typed path templates, parsing, building, and Express conversion |
| `@virentia/router` | Routes, routers, history adapters, query tracking, virtual routes, groups, chained routes |
| `@virentia/router-react` | `RouterProvider`, `Link`, route views, lazy views, outlets, hooks |

React Native bindings are planned as `@virentia/router-react-native`, but they
should not be documented as shipped until that package exists with React
Navigation tests.

## Install

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

The router package accepts history adapters, but it does not create browser or
memory history internally. Applications own history creation.

## Pages

- [Path templates](/router/paths)
- [Route model](/router/routes)
- [Router and history](/router/router)
- [Navigation](/router/navigation)
- [Query tracking](/router/query-tracking)
- [React rendering](/router/react)
- [Migrating from argon-router](/router/migration-from-argon-router)
