---
title: Model-Owned Routing
---

# Model-Owned Routing

These model APIs require `@virentia/core` 0.11.2 or newer.

Declare routes and the router in `staticModel.setup` when each screen/editor
instance needs independent route state and history. Return their native APIs:

<<< @/examples/packages/router.ts#model

`page.params`, `page.open`, `navigation.path` and the nested route handles remain
bound to the instance. React `RouterProvider`/`useLink` accept
`screen.navigation`/`screen.page` directly.

## Connect History Per Instance

<<< @/examples/packages/router.ts#use

`knownRoutes` and `activeRoutes` contain the instance's matching bound routes.
History callbacks return to its scope. Disposing the screen disconnects its
history listener; other screens and their histories keep working. Create history
connections in a bound runtime method or after `.create()`, not in shared setup.

Multiple independent routers need independent memory histories. A browser has
one address bar: deliberately choose the router responsible for that URL.
Application-level native routers remain supported; release their history
connection through `router.dispose` when their lifetime ends.

## SSR and Hydration

Use a request scope and memory history on the server. Match the requested URL
and finish required work before rendering. Restore DTOs and scope state before
client hydration, then connect the client history. The history object and its
listener are runtime resources and are not carried by JSON.

Ordinary instances use `.create()` or parent `children`. `.static()` creates a
separate module graph when a module lifetime is intended. See
[route activation](./routes), [history](./router) and
[forms with owned fields](/forms/models) for a screen's editable state.
