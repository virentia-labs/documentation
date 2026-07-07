---
title: Navigation
---

# Navigation

Navigation is a boundary between a model decision and the URL. Virentia Router
gives two levels of commands:

- `route.open(payload)` means “open this route with these params”;
- `appRouter.navigate(payload)` means “write this path/query to history”.

`route.open` is the usual choice when the target is known as a route object.
`appRouter.navigate` fits raw paths and query-only changes.

## Opening A Route

In application code, route commands run in the app scope:

```ts
import { scoped } from "@virentia/core";
import { profileRoute } from "./routes";

await scoped(appScope, () =>
  profileRoute.open({
    params: { id: 42 },
    query: { tab: "posts" },
  }),
);
```

If the route is registered in a router with history, `route.open` builds the URL
from the route template and writes it to history. If no router is connected,
the route still runs its own preloaders and `beforeOpen`.

`replace` replaces the current history entry:

```ts
await scoped(appScope, () =>
  profileRoute.open({
    params: { id: 42 },
    replace: true,
  }),
);
```

## Raw Navigation

`appRouter.navigate` performs lower-level URL updates:

```ts
await scoped(appScope, () =>
  appRouter.navigate({
    path: "/users/42",
    query: { tab: "posts" },
  }),
);
```

If `path` is omitted, the current path is kept and only query changes:

```ts
await scoped(appScope, () =>
  appRouter.navigate({
    query: { dialog: "invite" },
  }),
);
```

`back` and `forward` delegate to the history adapter:

```ts
await scoped(appScope, () => appRouter.back());
await scoped(appScope, () => appRouter.forward());
```

These are integration commands, not business events. Domain logic should decide
what happened, then call navigation at the edge of the model.

## React Links

`Link` renders an anchor and still goes through `route.open` on normal clicks:

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

`Link` builds `href` from the registered route. Modified clicks, prevented
clicks, and non-`_self` targets stay with the browser.

`useLink` returns the same pair of `href` and bound open command for
design-system components:

```tsx
const { path, open } = useLink(profileRoute, { id: 42 });
```

## Tests And System Boundaries

`scoped` is for explicit boundaries that must wait for all async graph work. Its
promise resolves only after the async graph the callback triggers has settled:

```ts
await scoped(appScope, () => profileRoute.open({ params: { id: 42 } }));
```

This is the right shape for tests, SSR loaders, command handlers, and adapters,
and it reads the same as ordinary app code.

## Common Cases

Entity page:

```ts
profileRoute.open({ params: { id: 42 } });
```

Tab encoded in query:

```ts
profileRoute.open({
  params: { id: 42 },
  query: { tab: "activity" },
});
```

Redirect from a guard:

```ts
route({
  path: "/admin",
  beforeOpen: [
    async () => {
      if (!session.isAdmin.value) {
        await homeRoute.open({ replace: true });
      }
    },
  ],
});
```

Same path, changed query:

```ts
appRouter.navigate({
  query: { filter: "open" },
});
```
