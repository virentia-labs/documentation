# throttle

Emits at most once per window — and the window's **last** value always fires at its end, so nothing is lost.

```ts
throttle(source, ms);
throttle(source, { ms, leading: true });
```

Like every time operator, it preserves the kind of the source: store in — store out, event in — event out.

## Scroll and drag

The classic: a stream of positions that arrives every frame, consumed by something that only needs a steady rate:

```ts
const scrolled = event<number>();
const position = throttle(scrolled, 100); // Event<number>

reaction({ on: position, run: (y) => { readingProgress.value = y / totalHeight.value; } });
```

At most ten updates a second — and when the scrolling stops, the final position still arrives, because the trailing value fires at the window end. A slider, a drag preview, a resize observer — same shape.

## Live metrics without the flood

A store that updates violently (ticker, download progress), a UI that should breathe:

```ts
const progress = store(0);
const shown = throttle(progress, 250); // Store<number> — calm enough to render
```

## Instant first response

`leading: true` also emits the moment a window opens — first hit immediately, trailing still guaranteed:

```ts
const tracked = throttle(mouseMoved, { ms: 100, leading: true });
```

## When to reach for it

- High-frequency streams where the consumer needs a rate, not every sample: scroll, drag, resize, progress, cursors.
- Sending "activity" signals to a server no more than once per interval.

When not: for "wait until it settles" (search input) use [debounce](/utils/debounce) — throttle keeps firing *during* the activity, debounce fires only *after* it.

## Behaviour notes

- **The trailing emission opens a cooldown window** — two emissions are never closer than `ms`, with or without `leading`.
- **Windows are per scope**; owner dispose cancels pending ones.
- Awaiting the source does not include the trailing emission (a new root update; failures are reported, not thrown into the old `await`).
