---
title: Query tracking
---

# Query Tracking

Query tracking turns URL query params into model events. It is useful when the
URL stores UI state that should behave like part of the model: dialogs, filters,
tabs, sort order, or hosted-widget state.

`router.query` is enough for direct reads. `router.trackQuery` is for query
states where entering or leaving should trigger behavior.

## Tracker Shape

```ts
interface QueryTracker<Parameters> {
  entered: Event<Parameters>;
  exited: Event<void>;
  enter: EventCallable<Parameters>;
  exit: EventCallable<{ ignoreParams: string[] } | void>;
}
```

`parameters` can be any schema-like object with `safeParse`:

```ts
interface QuerySchema<T> {
  safeParse(query: Query):
    | { success: true; data: T }
    | { success: false };
}
```

The router does not require Zod. Zod, Valibot, custom parsers, and small inline
schemas can all work.

## Dialogs

A common case is a dialog encoded in query:

```ts
const inviteDialog = router.trackQuery({
  forRoutes: [teamRoute],
  parameters: {
    safeParse(query) {
      return query.dialog === "invite"
        ? { success: true, data: { dialog: "invite" as const } }
        : { success: false };
    },
  },
});
```

React can render from model state, while the tracker owns URL transitions:

```ts
inviteDialog.enter({ dialog: "invite" });
inviteDialog.exit();
```

`entered` fires when query params match and one of `forRoutes` is active.
`exited` fires when params stop matching or the app leaves those routes.

## Filters

Track filters when a screen needs to react to URL changes:

```ts
const issueFilter = router.trackQuery({
  forRoutes: [issuesRoute],
  parameters: {
    safeParse(query) {
      const status = query.status;

      return status === "open" || status === "closed"
        ? { success: true, data: { status } }
        : { success: false };
    },
  },
});

reaction({
  on: issueFilter.entered,
  run({ status }) {
    issues.status.value = status;
    void issues.loadFx();
  },
});
```

`enter` writes query from controls:

```ts
issueFilter.enter({ status: "open" });
```

## Keeping Some Params On Exit

By default `exit()` clears query:

```ts
inviteDialog.exit();
```

Selected params can stay in the URL when closing one query-driven state should
not erase another:

```ts
inviteDialog.exit({ ignoreParams: ["tab", "sort"] });
```

## Manual Checks

By default a tracker evaluates whenever route or query state changes. `check`
limits validation to a specific event while already-entered state still exits
automatically:

```ts
const refreshed = event<void>();

const preview = router.trackQuery({
  check: refreshed,
  parameters: previewSchema,
});
```

This is useful for expensive parsing or host integrations where query changes
should not immediately start work.
