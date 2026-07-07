# Reactions

A reaction is a model rule. It does not store state, report a fact, or perform external work. Its job is to connect those parts: an event happened, a store changed, an effect finished, so the model should run a rule.

Most reactions live near the units they connect. That makes the model show not only “which data exists”, but also “why it changes”.

```ts
const queryChanged = event<string>();
const searchSubmitted = event<void>();

const query = store("");
const results = reactive({ items: [] as string[] });

const searchFx = effect(async (text: string) => {
  const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
  return (await response.json()) as string[];
});

reaction({
  on: queryChanged,
  run(text) {
    query.value = text;
  },
});

reaction({
  on: searchSubmitted,
  run() {
    void searchFx(query.value);
  },
});

reaction({
  on: searchFx.doneData,
  run(items) {
    results.items = items;
  },
});
```

The events stay small: they name what happened. The effect owns the request. Stores remember state. Reactions describe the causality between them.

## Automatic Dependencies

By default, start with a reaction without `on`. Inside that reaction you read stores, and Virentia remembers which stores the rule depends on. When one of those stores changes, the reaction runs again in the same scope.

```ts
const query = store("");
const online = store(true);
const canSearch = store(false);

reaction(() => {
  canSearch.value = online.value && query.value.trim().length > 2;
});
```

This mode is useful when dependencies are easier to express by reading state than by listing sources. If the rule branches, the dependency list is refreshed after every run: the reaction listens to the stores read by the current branch.

By default a reaction is **global**: it re-runs whenever a store it read changes in **any** scope, and each run reads the value from the scope the change happened in. This fits the common case where the same rule holds in every scope. To bind a reaction to specific scopes and isolate its dependencies per scope, pass `scope:` explicitly — see [Scoped Reactions](#scoped-reactions). Binding is never inferred from the scope that happened to be active when the reaction was created.

If a value is completely derived from other stores and does not need to be written into another store, look at `computed` first. Use a reaction when the rule should do something: write state, call an effect, send an event, or synchronize with external code.

## Explicit on

Use `on` when the reason for running matters: a specific event, effect, or effect lifecycle unit. In this mode the reaction does not run when it is created. It runs only from the listed unit and receives its payload.

```ts
reaction({
  on: messageReceived,
  run(message) {
    messages.items = [...messages.items, message];
  },
});
```

Use explicit `on` when the payload is part of the rule. For example: “a message arrived”, “the form was submitted”, “the request finished”, “the effect was cancelled”. That reads better than a reaction that only watches state and tries to infer what happened.

You can listen to several sources when the rule is genuinely the same:

```ts
reaction({
  on: [saved, cancelled],
  run() {
    modalOpened.value = false;
  },
});
```

## Async Reactions

A reaction body can be `async`. This is for **sequencing** async steps that belong to one rule — await an effect, then continue — not for replacing effects. External async work is still an `effect`; the async body only orchestrates them.

The normal way to write one is to `await` effects directly. Calling an effect inside the body runs it in the reaction's scope automatically, and awaiting it keeps that scope for the next step — so you do not pass a scope or wrap the call in `scoped`:

```ts
reaction({
  on: checkoutRequested,
  async run(order, { signal }) {
    await reserveStockFx(order);
    signal.throwIfAborted();
    await chargeFx(order);
  },
});
```

The body receives `{ scope, signal }`:

- `signal` is an `AbortSignal` that aborts when the same reaction fires again in the same scope, or when the reaction is stopped. This gives **cancel-previous (switch)** semantics: a newer run supersedes an in-flight older one. Gate steps with `signal.throwIfAborted()`.
- `scope` is the scope the reaction fired in. You rarely need it — direct effect calls already run in it. Reach for it only when you deliberately want to run something in it, e.g. `scoped(scope, () => fx())` to await a whole downstream graph rather than a single effect. (The ambient scope is preserved across an awaited **effect**, but not across a raw `await fetch()`, so external async must be an effect.)

The whole async body is awaited by the `scoped` promise at the boundary that triggered the reaction, including any effect it launches without `await`.

### Tracking Across await

An automatic reaction may also be `async`. Every store it reads is a dependency — including reads **after** an `await`:

```ts
reaction(async () => {
  const id = currentId.value; // tracked
  await loadDetailsFx(); // await an effect
  preview.value = details.value[id]; // details is tracked too
});
```

This works only when you await **effects** (or `scoped`), because effects restore the scope for the continuation. A raw `await fetch()` detaches from the scope, so external async must go through an effect. Only the reaction's own direct reads are tracked — a `computed` read inside the body contributes the computed itself, not the computed's internal dependencies. Each run is tracked in isolation, so overlapping async runs never mix dependencies; the latest run wins.

## Scoped Reactions

A reaction is global unless you pass `scope`. Pass it to bind a reaction to one scope — or a list of scopes — so it runs **only** when its source fires in those scopes, and so its automatically tracked dependencies are isolated per scope.

```ts
reaction({
  on: ticked,
  scope: appScope,
  run() {
    count.value += 1;
  },
});
```

Use this for two things:

- **Wiring that belongs to a single runtime instance** — a logger, a sync bridge, devtools glue — rather than to the model in general.
- **A rule whose dependencies differ between scopes.** An automatic reaction that reads different stores in different scopes (a branch driven by a per-scope flag) would, as a global reaction, share one dependency set and stop tracking a branch that another scope took. Binding it with `scope:` gives each scope its own dependency set, so every scope stays precise.

Binding is always explicit. A reaction created inside `scoped(appScope, …)` is **not** silently bound to `appScope` — the ambient scope is a global that the model must not depend on. Pass `scope: appScope` when you mean it.

## Inspector Metadata

`name` and `key` are optional hints for the [inspector](/inspector/). `name` sets the label shown for the reaction node; `key` marks it as a keyed node so the inspector can tell apart reactions that share a name across scopes.

```ts
reaction({
  on: ticked,
  name: "tick-counter",
  run() {
    count.value += 1;
  },
});
```

## Stopping

A reaction returns an object with `stop()`. After it is stopped, it detaches from dependencies and no longer receives new runs.

```ts
const subscription = reaction({
  on: ticked,
  run() {
    count.value += 1;
  },
});

subscription.stop();
```

In dynamic models you usually do not need to call `stop()` by hand. Create those reactions inside an `owner`: when `dispose` runs, Virentia detaches them together with the rest of the temporary work.
