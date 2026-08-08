# Operators

Operators are the `use: []` middleware that wrap a query/mutation run. They compose as an onion: the first operator in `use` is the outermost. Scheduler-stage operators (`concurrency`, `debounce`) always wrap executor-stage ones (`retry`, `timeout`, `fallback`), regardless of array order.

```ts
query({
  handler,
  use: [
    concurrency({ strategy: "takeLatest" }), // outer: decides which run wins
    retry({ times: 3, delay: 300 }),         // inner: recovers each run
  ],
});
```

## `concurrency`

The **result-taking strategy** — how overlapping runs behave. State is kept per scope and per lane, using the operator's own abort controllers, so a newer run cancels only the older run (never the whole effect).

| Strategy | Behaviour |
|----------|-----------|
| `takeLatest` *(default)* | abort the previous run, keep the newest. Ideal for search-as-you-type. |
| `takeFirst` | while a run is in flight, a new call **shares** its result (dedup). |
| `takeEvery` | no coordination; every call runs independently. |
| `queue` | serialize — a new run waits for the current one to settle. |

`key: (params) => …` splits runs into independent lanes (per-id concurrency).

## `retry`

Re-runs the handler on failure, honoring the run's abort signal. Skips and aborts are never retried, and the loading state stays `pending` between attempts.

```ts
retry({ times: 3, delay: (attempt) => 2 ** attempt * 100, when: (e) => isNetworkError(e) });
```

`times` = max retries after the first failure (default 3). `delay` may be a `(attempt, error) => ms` backoff. `when(error, attempt)` vetoes a retry.

## `timeout`

Aborts a run that exceeds `ms` and rejects with a `TimeoutError`. It races the deadline, so it fires even if the handler ignores the signal — and it also aborts the run's controller, so a signal-aware handler actually cancels its fetch.

```ts
use: [timeout(5000)];        // or timeout({ ms: 5000 })
```

## `debounce`

Waits `wait` ms before running. On its own it just delays; **paired with `takeLatest`** it becomes a true debounce — a newer run aborts the previous one while it is still waiting.

```ts
use: [concurrency({ strategy: "takeLatest" }), debounce({ wait: 300 })];
```

## `fallback`

Recovers a failed run by resolving with a fallback value instead of failing. Skips and aborts pass through. Place it **before** `retry` in `use` so it catches only after retries are exhausted.

```ts
use: [fallback([]), retry({ times: 2 })];                 // static value
use: [fallback((error, params) => cache.get(params.id))]; // computed from error + params
```

## `tap`

Observes a run without changing its result — analytics, logging, devtools.

```ts
use: [
  tap({
    onStart: (params) => log("start", params),
    onSuccess: (data, params) => track("loaded", params),
    onError: (error, params) => report(error),
    onSettled: (params) => {},
  }),
];
```

Callbacks are side-effects; to write a store from one, wrap the write in `scoped(ctx.scope, …)`.

## Composition

`use` reads outer→inner. A useful full stack:

```ts
use: [
  concurrency({ strategy: "takeLatest" }), // scheduler
  debounce({ wait: 300 }),                 // scheduler
  fallback(() => cached),                  // executor (outer — catches after retry)
  retry({ times: 3 }),                     // executor
  timeout(8000),                           // executor (inner — bounds each attempt)
];
```

A `takeLatest` newer run aborts the older one *including its retry loop and debounce wait*. Because `retry`/`timeout` are inner, all attempts count as one logical run to `concurrency`.

::: tip Skips
When an operator declines a run (a `takeFirst` dedup, a superseded `takeLatest` run), it does so without a fake error. A superseded run rejects with a `SkipSignal` you can recognize via `isSkip(error)` — useful when you subscribe to `failData` and want to ignore cancellations. Triggers and `refresh` swallow these automatically.
:::

::: info More operators on the way
`cache()` (stale-while-revalidate) and a `barrier` gate are planned. Other natural fits — `throttle`, `poll`/`keepFresh` (interval refetch), `contract`/`validate` (response shape check), and `circuitBreaker` — can be built on the same `Operator` contract.
:::
