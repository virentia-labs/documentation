# once

Passes the first hit per scope and swallows the rest — until an optional `reset` re-arms it.

```ts
once(source);
once(source, { reset });
```

Returns an `Event<T>` regardless of whether the source is an event or a store.

## Onboarding and one-time banners

```ts
import { once } from "@virentia/core/utils";

const firstOpen = once(appOpened);

reaction({ on: firstOpen, run: () => showOnboarding() });
```

The flag behind `once` is a store, so it lives per scope **and travels with an SSR snapshot**: onboarding shown during server render does not flash again after hydration. This is the whole reason the operator exists — the tempting hand-rolled version with `let fired = false` at module level makes the flag per *process*: one user's SSR request marks it "shown" for everyone.

## First-use analytics

Fire the "feature discovered" event exactly once per session scope:

```ts
const featureTried = once(exportClicked);

reaction({ on: featureTried, run: () => void trackFx("export-first-use") });
```

## Lazy warm-up

Prefetch heavy data the first time a panel opens, and only then:

```ts
const panelFirstOpened = once(panelOpened);

reaction({ on: panelFirstOpened, run: () => void preloadHistoryFx() });
```

## Re-arming

`reset` makes "once" mean "once per era" — per login session, per document:

```ts
const greeted = once(sessionStarted, { reset: loggedOut });
```

After `loggedOut` fires in a scope, the next `sessionStarted` in that scope passes through again.

## When to reach for it

- Anything shown or sent "only the first time": onboarding, hints, first-use analytics, warm-up work.
- With `reset` — "first time per entity/session": re-arm on logout, on switching documents, on opening a new record.

When not: if the guard condition is really state ("has the user completed setup?"), model it as a store and a `computed` — `once` is for *the fact of the first occurrence*, not for long-lived boolean state.

## Behaviour notes

- The fired flag is per scope: scope A consuming the first hit does not silence scope B.
- Being a store, the flag participates in scope serialization — by design (see the onboarding case).
- Owner dispose detaches the operator's subscriptions like any reaction's.
