---
title: Performance and benchmark methodology
description: Reproducible comparisons of Virentia Mutable, models, UI, and Core with Immer, Mutative, MobX, Reatom, Effector, Redux, React, Vue, Solid, and $mol, with conditions and raw results.
prev: false
next: false
---

<script setup>
import { withBase } from "vitepress";
</script>

# Performance and benchmark methodology

The homepage compares specific operations involving data, models, DOM, and events. The results apply to the documented workloads and library snapshot. They do not measure arbitrary application performance.

<a :href="withBase('/#performance')">Back to the homepage charts →</a>

## Environment and sources

All measurements were taken on November 8, 2026, on an **Apple M1 Max laptop: 10 cores, 64 GiB RAM**, macOS 26.5. Node workloads use **Node 24.14.0, V8 13.6.233.17-node.41**. Browser workloads use **Chromium 153**, headless, driven by Playwright 1.63. Absolute numbers depend on the machine; compare libraries within one table.

The numbers come from two suites:

- **The documentation suite**: Mutable, staticModel creation, the UI table, and scoped events. Its runner, harnesses, lockfile, and reports are published on this site.
- **The comparison suite**: todo lists, js-framework-benchmark rows, and reactive graphs against more libraries. Every library is written idiomatically; graph workloads share one adapter.

Both suites use the same Virentia sources: the working tree on top of commit [`fc3378e`](https://github.com/virentia-labs/virentia/tree/fc3378e8313df7feea0bde2cd93fdbc2ceb92ae2) as of November 8, 2026, including changes that are not committed yet. Library source is not patched. All variants are bundled and minified with `NODE_ENV=production` using esbuild 0.28.2.

| Documentation suite | Version |
| --- | --- |
| Immer | 10.2.0 |
| Mutative | 1.3.0 |
| MobX | 7.1.0 |
| Effector | 23.4.4 |
| React / React DOM | 19.2.6 |
| Vue | 3.5.38 |
| Vue Vapor | vue 3.6.0-rc.13 (the `vue-vapor` alias) |
| Reatom | @reatom/core 1001.3.0 |
| Redux | @reduxjs/toolkit 2.13.0 (redux 5.0.1, reselect 5.3.0) |
| Solid | solid-js 1.9.17, babel-preset-solid 1.9.16 |
| $mol | mol_jsx_lib 0.0.1682 |
| TypeBox | 0.34.52 |

| Comparison suite | Version |
| --- | --- |
| MobX | 7.1.1 |
| Reatom | @reatom/core 1001.3.0 |
| Effector | 23.4.4 |
| Redux | redux 5.0.1, reselect 5.3.0, @reduxjs/toolkit 2.13.0 |
| React / React DOM | 19.3.1 |
| Vue | 3.5.44 |
| Vue Vapor | vue 3.6.0-rc.13 (the `vue-vapor` alias) |
| Solid | solid-js 1.9.17, babel-preset-solid 1.9.16 |
| $mol | mol_jsx_lib 0.0.1682, mol_wire_lib 1.0.1824 |

**Documentation suite.** Each Node variant runs in **five fresh processes** with `--expose-gc`; variant ordering rotates. Warmup and five GC calls precede the timer. Tables show the median of five results and their full range. GC remains enabled during timing, and outliers are retained. The browser runs **fourteen rounds** after one warmup round per variant: each variant takes every ordering slot twice. The suite ran four times in a row on one bundle; tables show the median and full range of all 56 rounds. The viewport is 1280 × 900 with DPR 2. Since the October 23 series, the suite also compares Reatom, Effector, and Redux in instance creation, MobX, Reatom, and Redux in scoped events, and Solid, $mol, and vanilla DOM in the UI table. The models harness calls `Model.create` instead of `collection(Model).add`, which the library no longer exports, and the runner accepts `VIRENTIA_COMMIT` to measure a commit other than the pinned one. Since October 30 the models harness also has an Effector factory with units per instance and Virentia with records in one store, and instance creation is reported in two groups.

**Comparison suite.** Each Node cell (library, scenario, size) runs in **three fresh processes** with rotating library order: 5 warmup and 10 measured rounds at the smaller size, 2 and 4 at the larger one, 1 and 3 for cellx at 2,500 nodes. Every round is validated: observer call counts and values. Full GC is not forced around timed runs. Tables show the median of all measured rounds. In the browser, each framework, scenario, and size gets a **fresh browser context**. A functional check comes first. Then 5 warmup and 20 measured rounds run at 1,000 rows, or 3 and 10 at 10,000 rows. A frame, a macrotask, and a full GC precede every timed operation. The browser run is repeated three times; tables show the median of all measured rounds of the three runs.

These are local microbenchmarks, not confidence intervals or measurements across different devices.

<a :href="withBase('/benchmarks/performance/node-results.json')">Documentation suite: Node report</a> · <a :href="withBase('/benchmarks/performance/ui-results.json')">UI report</a> · <a :href="withBase('/benchmarks/comparison/core-results.jsonl')">Comparison suite: Node report</a> · <a :href="withBase('/benchmarks/comparison/ui-results.json')">UI report</a> · <a :href="withBase('/benchmarks/comparison/ui-results-nogc.json')">UI report without forced GC</a>

Documentation suite reports include the environment, dependency versions, a source label, and SHA-256 hashes of the source archive, harness, runner, and bundle. Comparison suite reports include every measured round.

## Mutable vs Immer and Mutative {#mutable}

Each process creates an array of 50,000 `{ id, v: 0 }` objects. An operation increments `v` on 1,000, 5,000, or all 50,000 evenly spaced items. State evolves across operations. After 20 warmup updates, the next 80 are timed, and the total is divided by 80. The median comes from five per-process averages, not 400 individual operation timings.

### Update 1,000 items

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 0.53 ms | 0.52–0.55 ms |
| Immer | 12.71 ms | 12.65–12.78 ms |
| Mutative | 1.00 ms | 0.98–1.19 ms |

### Update 5,000 items

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 2.30 ms | 2.27–2.37 ms |
| Immer | 15.87 ms | 15.79–16.76 ms |
| Mutative | 4.14 ms | 4.08–4.21 ms |

### Update 50,000 items

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 22.99 ms | 22.61–23.49 ms |
| Immer | 46.07 ms | 45.80–46.61 ms |
| Mutative | 47.06 ms | 45.01–50.27 ms |

The **result contracts differ**: `createRootDraft` reuses owned nodes, while `produce` and `create` return new immutable states. Immer uses `setAutoFreeze(false)` and Mutative uses `enableAutoFreeze: false`. Preserve these settings when reproducing the test: [freezing settings affect Immer’s behavior](https://immerjs.github.io/immer/freezing/).

Virentia retains its owned-object `WeakSet`, disables tracking, and uses empty read/change hooks. The workload excludes the full mutable store, subscribers, UI reactions, patches, and memory measurements. Final values and the unchanged original seed are checked after timing. This tests repeated writes where Virentia does not retain every intermediate state as an immutable snapshot.

## Instance creation: MobX, Reatom, Effector, and Redux {#models}

Each variant creates 10,000 instances with `count`, `title`, and `active` fields, an increment operation, and `doubled`. The libraries keep instances in two different ways, so the variants form two groups, each with its own tables: models where every instance is reactive, and plain records in one store.

### Models with per-instance reactivity {#models-reactive}

Every instance has its own observable fields, its own increment operation, and its own derived value:

- **Virentia**: `staticModel` with an `increment` event, a reaction, and a computed; one `Model.create(list)` in a scope for all instances.
- **MobX**: a class with explicit `makeObservable` annotations, a prototype action method, and a computed getter. No automatic annotation or per-instance autorun is added. The MobX API follows the [makeObservable documentation](https://mobx.js.org/observable-state).
- **Reatom**: an atom per field, a `computed`, and an `action` for every instance.
- **Effector, factory**: Effector has no instance models in its core, so a factory creates every instance's units, as Effector apps build per-instance models: a store per field, an `increment` event attached with `.on`, and a `$doubled` store made with `.map`. Units are created without `fork()`.

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 9.91 ms | 9.49–10.98 ms |
| MobX | 27.14 ms | 25.13–27.49 ms |
| Reatom | 46.92 ms | 46.50–56.15 ms |
| Effector, factory | 363.40 ms | 359.94–411.28 ms |

After creation, GC runs and additional `heapUsed` is measured relative to baseline:

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 5.39 MiB | 5.39–5.39 MiB |
| MobX | 15.55 MiB | 15.54–15.55 MiB |
| Reatom | 53.58 MiB | 53.58–53.58 MiB |
| Effector, factory | 348.37 MiB | 348.11–348.38 MiB |

### Records in one store {#models-records}

A collection is one store of plain records. One event or action adds all of them, another increments one by id, and `doubled` is computed from the state when it is read. A single record has no reactivity of its own:

- **Effector**: a store of records with two events attached with `.on`.
- **Redux**: Redux Toolkit `createEntityAdapter`. One `addMany` dispatch adds all instances, an `incremented` action changes one, and `doubled` is a selector.
- **Virentia, records**: a `store` of records with two events and their reactions, in a scope.

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Effector | 1.92 ms | 1.72–1.99 ms |
| Redux | 26.46 ms | 25.94–27.19 ms |
| Virentia, records | 1.88 ms | 1.83–1.96 ms |

Additional `heapUsed` after creation and GC:

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Effector | 0.82 MiB | 0.82–0.82 MiB |
| Redux | 1.01 MiB | 1.00–1.01 MiB |
| Virentia, records | 0.84 MiB | 0.84–0.84 MiB |

### Conditions and results {#models-conditions}

Model declarations, scopes, and stores are prepared before timing. Warmup creates 200 instances of the corresponding variant; Virentia `staticModel` also disposes them, and the record variants start over with a new store. **Virentia `staticModel` includes collection and identity bookkeeping.** Heap is additional JS heap with live instances before the first derived read, including internal structures and collection bookkeeping. It is neither RSS nor the payload size of an individual instance. Reading all derived values, checking checksum `99,990,000`, incrementing the first counter, and verifying the second instance’s independence happen after creation and heap measurements. There are no UI subscribers or indexes.

Among models with per-instance reactivity, Virentia creates instances the fastest: 2.7 times faster than MobX, 4.7 times faster than Reatom, and 37 times faster than the Effector factory, where every store, event, and derived store is a separate graph unit. It also uses the least heap: 2.9 times less than MobX, 10 times less than Reatom, and 65 times less than the Effector factory. With records in one store, the time goes mostly into building the records, and Effector and Virentia are on par: Virentia is 1.02 times faster, and Effector uses 2% less heap. Redux Toolkit, which applies the change through Immer, is about 14 times slower than both. Records cost the least, but a single record cannot be observed on its own; that is what the first group pays for. The earlier [staticModel vs model benchmark](/models/benchmarks) from the presentation compares two Virentia model kinds on a different commit and machine; its results do not extend to other libraries.

## Todo lists: MobX, Reatom, Effector, and Redux {#todos}

A todo has a title and a `done` flag. Creating the list also subscribes an observer to every todo’s flag, like a UI binding, and one more observer to the number of completed todos. The workloads:

- **create** N todos with their observers;
- **toggle every 10th** todo, each toggle a separate update that reaches the todo’s observer and the completed count;
- **toggle all** todos in one action: each todo’s observer runs once;
- **unsubscribe and remove** all todos.

Every round checks observer call counts, the completed count, and the list size. Implementations:

- **Virentia**: `staticModel` with an event and a reaction. The `done` field is indexed, and the completed count is `where(done.eq(true)).count`.
- **Virentia, no index**: the same model; the completed count scans the instances like the other libraries do.
- **MobX**: a class with `makeObservable` and a computed count.
- **Reatom**: atoms per todo. Reatom notifies in a microtask, so changes are flushed with `batch(fn, true)` to keep the work inside the timer.
- **Effector**: a normalized store and derived per-todo stores, like `useStoreMap`.
- **Redux**: Redux Toolkit `createEntityAdapter` and per-todo selectors.

Medians, ms:

| Scenario | N | Virentia | Virentia, no index | MobX | Reatom | Effector | Redux |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Create | 1,000 | 1.23 | 2.46 | 3.82 | 1.45 | 5.20 | 2.73 |
| Create | 10,000 | 10.4 | 27.1 | 29.5 | 22.8 | 62.5 | 28.5 |
| Toggle every 10th, one by one | 1,000 | 0.99 | 15.4 | 14.5 | 10.7 | 45.0 | 33.5 |
| Toggle every 10th, one by one | 10,000 | 29.4 | 1,734 | 2,033 | 2,439 | 14,184¹ | —² |
| Toggle all at once | 1,000 | 0.93 | 1.27 | 0.71 | 0.51 | 1.10 | 2.04 |
| Toggle all at once | 10,000 | 10.7 | 16.5 | 11.8 | 10.4 | 20.8 | 24.0 |
| Unsubscribe and remove all | 1,000 | 0.37 | 0.97 | 0.28 | 0.11 | 2.02 | 0.11 |
| Unsubscribe and remove all | 10,000 | 3.91 | 10.8 | 5.08 | 2.86 | 30.6 | 1.20 |

¹ One process instead of three: a single process took about three minutes. ² Not measured in this series: the slowest cells were skipped to keep a full run within hours.

The index keeps the completed count current on every change; without it, every toggle rescans the list, as in the other libraries. At 10,000 todos, Virentia creates and toggles one by one faster than the other libraries; toggling all at once is on par with Reatom and 1.1 times faster than with MobX. It removes 1.3 times faster than MobX, 1.4 times slower than Reatom, and 3.3 times slower than Redux. At 1,000, Virentia creates the fastest, 1.18 times faster than Reatom; toggling all is 1.8 times slower than Reatom, and removing is 3.3–3.5 times slower than Redux and Reatom.

## UI table: React, Vue, Vue Vapor, Solid, $mol, and vanilla DOM {#ui}

One table contains 1,000 row components with two cells: an ID and a local counter. Every framework that has a compiler is built with it, as its production setup does:

- **Virentia**: JSX compiled into templates by the Virentia compiler (`@virentia/ui/vite`), a row-local store;
- **React**: `createElement`, `createRoot`, and `useState`;
- **Vue**: SFCs with `<script setup>`, compiled by `compileScript` with an inline template, as `@vitejs/plugin-vue` does, and `shallowRef`;
- **Vue Vapor**: the same SFCs with `<script setup vapor>` on Vue 3.6.0-rc.13, a release candidate: Vapor mode renders without a virtual DOM;
- **Solid**: JSX compiled by `babel-preset-solid` and `createSignal`;
- **$mol**: `$mol_jsx_view` per row with a `$mol_mem` value; `$mol_jsx` is called directly, as compiled JSX would call it;
- **vanilla DOM**: nodes created and updated by hand, as a floor.

React Compiler, SSR, and hydration are outside this workload. Vue rows register their `shallowRef` in a module rather than through a function prop: a function prop does not reach a Vapor child in 3.6.0-rc.13, and both Vue variants use the same code.

### Initial render

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 4.80 ms | 3.20–8.30 ms |
| React | 4.10 ms | 2.50–7.70 ms |
| Vue | 4.75 ms | 3.00–6.40 ms |
| Vue Vapor | 4.10 ms | 2.60–7.20 ms |
| Solid | 2.35 ms | 1.50–4.50 ms |
| $mol | 12.10 ms | 7.40–18.70 ms |
| Vanilla DOM | 1.90 ms | 1.20–2.60 ms |

Timing starts before UI root creation and ends after DOM commit. React signals completion through all row layout effects, without `flushSync`. The other variants mount synchronously. Local row state initialization is included. Bundle loading and compilation happen beforehand.

### Update 100 rows in 25 batches

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 7.75 ms | 6.50–12.10 ms |
| React | 40.75 ms | 32.50–52.60 ms |
| Vue | 8.60 ms | 6.60–12.80 ms |
| Vue Vapor | 5.30 ms | 4.50–6.40 ms |
| Solid | 4.90 ms | 4.10–6.30 ms |
| $mol | 20.75 ms | 17.80–23.90 ms |
| Vanilla DOM | 3.10 ms | 2.30–4.00 ms |

Every tenth row updates; values within a batch change in one synchronous call. After one warmup update, 25 batches with distinct values are timed. The table shows their total time, not one write. React changes only the affected rows’ local state and signals completion through layout effects. Vue awaits `nextTick`. Virentia, Solid (in `batch`), $mol (with `$mol_wire_fiber.sync`), and vanilla DOM update the DOM synchronously. The parent list is not forced to rerender.

Each mount and update batch waits for `requestAnimationFrame` **outside the timer**. After timing, all 1,000 row IDs and values are checked; final checksum `2600` and root cleanup are also asserted. This measures elapsed time from dispatch through DOM commit, including normal framework scheduling. It does not wait for paint, force layout, or measure FPS, interaction latency, or scrolling. The visible host is 400 px tall with `overflow: auto; contain: strict`.

Solid is the fastest framework here, close to vanilla DOM. Virentia’s initial render is 2 times slower than Solid’s, slower than React’s and Vue Vapor’s, on par with Vue 3.5’s, and faster than $mol’s. Its total row-update time is 5.3 times lower than React’s, lower than $mol’s, 1.1 times lower than Vue’s, and 1.5–1.6 times higher than Vue Vapor’s and Solid’s. Vue Vapor updates 1.6 times faster than Vue 3.5 and mounts 1.2 times faster.

## Rows like js-framework-benchmark {#ui-rows}

Three workloads, each in a fresh browser context:

- **A** mounts and unmounts a root with N [js-framework-benchmark](https://github.com/krausest/js-framework-benchmark) rows: four cells, a link, and an icon. Every row is a component with its own selection state, a reactive label, and two handlers. Mount includes creating the rows’ state from the data array.
- **B** creates N rows in an already mounted list and then clears them, like js-framework-benchmark’s create rows and clear rows.
- **C** mounts light rows `<tr><td>id</td><td>{count}</td></tr>` with state per row, updates every 10th counter in one batch, and unmounts.

Implementations:

- **Virentia**: in A, a board model with `children.many` rows and an inverse relation; in B, `RowModel.create` with `For` over the model’s instances; in C, a component with a `staticModel` per row. JSX is compiled into templates, as `@virentia/ui/vite` does by default.
- **React**: `memo` rows with `useState` and `flushSync`.
- **Vue**: SFC rows with `shallowRef`, compiled with `compileScript` and an inline template, as `@vitejs/plugin-vue` does.
- **Vue Vapor**: the same SFCs with `<script setup vapor>` on Vue 3.6.0-rc.13, a release candidate, mounted with `createVaporApp`. In C the light rows register their counter in a module instead of a function prop, which does not reach a Vapor child in this version.
- **Solid**: `For` and signals, compiled with `babel-preset-solid`.
- **$mol**: `$mol_jsx_view` per row with `$mol_wire`.
- **Vanilla DOM**: hand-written DOM operations, as a floor.

In A and B every implementation produces the same DOM: 8 elements and 2 text nodes per row. Before measuring, every framework passes a functional check: a click toggles the class, an update patches rows in place, remove deletes the right row, and unmount leaves no DOM. Timing is synchronous JavaScript until the DOM is complete; returned promises are awaited (Virentia’s asynchronous unmount, Vue’s `nextTick`). Layout and paint are not included.

Medians, ms, with a full GC before every operation:

| Scenario | N | Virentia | React | Vue | Vue Vapor | Solid | $mol | Vanilla DOM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A: mount | 1,000 | 8.40 | 6.50 | 7.70 | 10.2 | 3.10 | 23.9 | 3.20 |
| A: mount | 10,000 | 66.9 | 55.2 | 71.5 | 94.3 | 28.7 | 237 | 24.4 |
| A: unmount | 1,000 | 4.70 | 3.45 | 3.00 | 2.60 | 2.45 | 2.60 | 1.90 |
| A: unmount | 10,000 | 38.6 | 35.0 | 32.7 | 23.5 | 21.9 | 30.6 | 20.1 |
| B: create rows | 1,000 | 7.20 | 7.50 | 6.70 | 10.6 | 3.40 | 23.1 | 2.50 |
| B: create rows | 10,000 | 55.2 | 176 | 63.6 | 91.7 | 25.4 | 227 | 25.0 |
| B: clear rows | 1,000 | 3.30 | 3.60 | 3.20 | 2.80 | 2.60 | 4.20 | 1.95 |
| B: clear rows | 10,000 | 31.7 | 35.8 | 38.1 | 29.0 | 22.0 | 44.1 | 20.8 |
| C: mount | 1,000 | 3.80 | 3.60 | 5.20 | 3.70 | 1.70 | 11.3 | 2.95 |
| C: mount | 10,000 | 29.1 | 22.7 | 26.4 | 23.3 | 11.9 | 90.1 | 10.4 |
| C: update every 10th | 1,000 | 0.20 | 0.60 | 0.40 | 0.20 | 0.20 | 1.30 | 0.10 |
| C: update every 10th | 10,000 | 1.50 | 3.80 | 2.40 | 1.60 | 1.10 | 8.10 | 0.60 |
| C: unmount | 1,000 | 1.90 | 2.30 | 2.05 | 1.70 | 1.40 | 1.50 | 1.25 |
| C: unmount | 10,000 | 14.6 | 17.2 | 16.3 | 12.9 | 11.2 | 12.9 | 9.85 |

Without a forced GC before operations, mount and update times change as follows:

| Scenario | N | Virentia | React | Vue | Vue Vapor | Solid | $mol | Vanilla DOM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A: mount | 1,000 | 6.60 | 5.30 | 6.30 | 9.60 | 2.40 | 21.6 | 2.40 |
| A: mount | 10,000 | 61.8 | 49.3 | 60.6 | 87.3 | 24.2 | 259 | 23.3 |
| B: create rows | 1,000 | 6.10 | 6.60 | 6.05 | 9.70 | 2.70 | 20.9 | 2.30 |
| B: create rows | 10,000 | 55.5 | 171 | 55.4 | 86.0 | 24.0 | 252 | 23.2 |
| C: mount | 1,000 | 3.25 | 1.80 | 5.50 | 3.90 | 2.85 | 7.05 | 1.00 |
| C: mount | 10,000 | 28.3 | 16.2 | 28.4 | 19.8 | 10.3 | 75.2 | 11.2 |
| C: update every 10th | 1,000 | 0.20 | 0.40 | 0.30 | 0.20 | 0.20 | 0.80 | 0.10 |
| C: update every 10th | 10,000 | 1.60 | 2.90 | 2.65 | 1.30 | 1.30 | 6.75 | 0.60 |

With a full GC before operations, Virentia mounts js-framework-benchmark rows 1.3 times slower than React in A and on par with it in B at 1,000; at 10,000 it is 1.2 times slower than React in A and 3.2 times faster in B. It mounts light C rows on par with React at 1,000 and 1.3 times slower at 10,000. It mounts faster than Vue in A at 10,000 and in B at 10,000 and faster than Vue Vapor in A and B. Without a forced GC, A is 1.2–1.3 times slower than React, B is 1.1 times faster at 1,000 and 3.1 times faster at 10,000, and light C rows are 1.7–1.8 times slower. Virentia updates rows 2.5–3 times faster than React and faster than Vue, on par with Vue Vapor at 1,000 and 1.1 times faster at 10,000. Unmounting takes 0.83–1.4 times React’s time. Solid is faster in every mount scenario: 2.1–2.7 times with a GC and 1.1–2.7 times without one. Vue Vapor (3.6.0-rc.13) mounts the js-framework-benchmark rows 1.3–1.6 times slower than Vue 3.5 and light C rows faster, updates faster, and unmounts faster or on par.

## Scoped events: Effector, MobX, Reatom, and Redux {#core}

Each process dispatches 10,000 sequential events that each increment 10 numeric stores. One graph, and a scope where the library has one, are prepared outside timing. Warmup dispatches 1,000 identical events. Every call is awaited before the next begins.

- **Virentia** awaits `scoped(app, () => tick(1))`; one explicit reaction writes all 10 stores.
- **Effector** uses `fork()` and `allSettled(tick, { scope: app, params: 1 })`, with `.on` attached to each store. `allSettled` is the public API for [awaiting scoped operations](https://effector.dev/en/api/effector/allsettled/).
- **MobX** has no scopes: one action writes 10 observable boxes.
- **Reatom** has no scopes either: one action writes 10 atoms, flushed synchronously with `batch(fn, true)`.
- **Redux**: a Redux Toolkit store of its own with one reducer for the 10 counters.

| Variant | Median | Min–max |
| --- | ---: | ---: |
| Virentia | 17.99 ms | 17.73–20.19 ms |
| MobX | 5.81 ms | 5.72–5.88 ms |
| Reatom | 22.05 ms | 21.53–22.63 ms |
| Effector | 46.65 ms | 46.15–53.12 ms |
| Redux | 75.67 ms | 73.71–76.93 ms |

Each value and final checksum `110000`, including warmup, are verified. The workload has no I/O effects, derived stores, UI subscribers, long chains, or model creation. Timing includes dispatch, scope handling where there is a scope, batching, and completion through the public APIs.

MobX writes plain values without a scope and is the fastest here; Reatom, also without a scope, is 1.2 times slower than Virentia. Virentia and Effector isolate every event in a scope; Virentia is 2.6 times faster than Effector. Redux, which copies its state through Immer on every action, is the slowest.

## Reactive graph: MobX, Reatom, Effector, and Redux {#graph}

Graph workloads go through one thin adapter: `signal`, `computed`, `observe`, `write`, and `batch`. Every write and batch must reach all derived values and observers before it returns. Virentia observes with `store.subscribe`. Effector uses `map` and `combine`. Redux uses `reselect` and `useSelector`-style subscribers. Reatom is flushed synchronously with `batch(fn, true)`. Workloads:

- **create**: N independent chains of a source, a derived value, and an observer; **unsubscribe** removes them all;
- **N/10 separate writes**: every 10th source changes, each write a separate update;
- **all N in one batch**: every source changes in one batch; each observer runs once;
- **1 → N**: one source, N derived values with observers, 10 writes; **1 → N → sum** adds one aggregate over them;
- **chain**: N derived values in a row with an observer at the end, 10 writes;
- **cellx**: the [cellx](https://github.com/Riim/cellx) benchmark graph, layers of 4 nodes with every node observed: building it, and a batch that updates its 4 sources;
- **events**: N events, each updating 10 stores, written idiomatically for each library.

Medians, ms:

| Scenario | N | Virentia | MobX | Reatom | Effector | Redux |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Create N × (store → computed → subscription) | 1,000 | 0.83 | 1.40 | 1.77 | 17.7 | 1.03 |
| Create N × (store → computed → subscription) | 10,000 | 7.58 | 10.4 | 22.6 | 172 | 11.4 |
| Unsubscribe everything | 1,000 | 0.05 | 0.27 | 0.14 | 0.33 | 0.06 |
| Unsubscribe everything | 10,000 | 0.64 | 5.64 | 3.27 | 5.91 | 0.79 |
| N/10 separate writes | 1,000 | 0.05 | 0.04 | 0.07 | 0.09 | 14.1 |
| N/10 separate writes | 10,000 | 0.36 | 0.66 | 0.94 | 1.96 | 6,065 |
| All N in one batch | 1,000 | 0.26 | 0.35 | 0.46 | 1.72 | 0.17 |
| All N in one batch | 10,000 | 3.20 | 6.11 | 14.3 | 49.8 | 2.30 |
| 1 → N computed, 10 writes | 1,000 | 0.93 | 3.19 | 3.57 | 4.34 | 1.63 |
| 1 → N computed, 10 writes | 10,000 | 11.7 | 37.5 | 60.8 | 114 | 29.6 |
| 1 → N → sum, 10 writes | 1,000 | 1.10 | 1.64 | 3.47 | 7.81 | 1.94 |
| 1 → N → sum, 10 writes | 10,000 | 10.7 | 16.1 | 53.3 | 195 | 52.2 |
| Chain of depth N, 10 writes | 100 | 0.16 | 0.24 | 0.35 | 0.29 | 0.18 |
| Chain of depth N, 10 writes | 500 | 0.66 | 1.28 | 1.93 | 1.21 | 0.98 |
| cellx: build, every node observed | 1,000 | 3.97 | 4.18 | 3.94 | —³ | 3.36 |
| cellx: build, every node observed | 2,500 | 19.5 | 14.7 | 17.1 | —³ | 18.2 |
| cellx: update 4 sources | 1,000 | 0.74 | 2.22 | 3.29 | —³ | 0.63 |
| cellx: update 4 sources | 2,500 | 2.61 | —⁴ | 15.1 | —³ | 2.19 |
| N events × 10 stores | 1,000 | 1.04 | 1.49 | 2.95 | 2.94 | 0.30 |
| N events × 10 stores | 10,000 | 10.3 | 15.5 | 29.4 | 29.1 | 2.08 |

³ Effector without explicit unit names fails to build this graph (`RangeError: Invalid string length`); the suite has an `effector-named` variant for it. ⁴ MobX exceeds the call stack.

Virentia is the fastest in creating graphs, in unsubscribing, in 1 → N and 1 → N → sum, in chains, and in separate writes at 10,000 sources: 1 → N → sum is 1.5 times faster than with MobX, the next fastest, and a chain is 1.1–1.5 times faster than with Redux. In a batch Virentia is 1.4–1.9 times faster than MobX and 1.4–1.5 times slower than Redux; building cellx is 1.2–1.3 times slower than the fastest library and updating it 1.2 times slower than Redux; separate writes at 1,000 sources are on par with MobX (0.05 ms each). Events are 1.4–1.5 times faster than MobX. In events Redux updates one store with one listener instead of 10 stores, so it does not do the same work.

## Reproduction

### Documentation suite

<a :href="withBase('/benchmarks/performance/benchmark-suite.zip')" download>Download the benchmark suite, lockfile, and results</a>

Extract the archive into a separate directory and install the pinned dependencies. The runner accepts a path to a Virentia Git repository and archives the pinned commit, or the one in `VIRENTIA_COMMIT`; its working tree is not changed. `VIRENTIA_SOURCE_LABEL` records a label for sources that are not a published commit.

```sh
git clone https://github.com/virentia-labs/virentia.git virentia-benchmark
# In the extracted benchmark directory:
npm ci --ignore-scripts --no-audit --no-fund
node run.mjs node /absolute/path/to/virentia-benchmark node-results.local.json
node run.mjs ui /absolute/path/to/virentia-benchmark ui-results.local.json
```

For the UI workload, open the address printed by the runner (`http://127.0.0.1:4186/`) and click **Run benchmark**. Keep the tab visible and wait for completion; the JSON report is saved at the supplied path. Stop the server with Ctrl+C. Run the two workloads separately. The series above clicked the same button four times in headless Chromium through Playwright and pooled the reports.

<a :href="withBase('/benchmarks/performance/run.mjs')">Runner</a> · <a :href="withBase('/benchmarks/performance/node.harness.ts')">Node harness</a> · <a :href="withBase('/benchmarks/performance/ui.harness.ts')">UI harness</a> · <a :href="withBase('/benchmarks/performance/package-lock.json')">Lockfile</a>

### Comparison suite

<a :href="withBase('/benchmarks/comparison/comparison-suite.zip')" download>Download the comparison suite with its lockfile</a>

```sh
# In the extracted directory:
npm ci
npx playwright install chromium            # or set CHROME_PATH to an installed Chrome or Chromium
export VIRENTIA_PACKAGES=/absolute/path/to/virentia/packages
mkdir -p results
VIRENTIA_TEMPLATES=1 node ui/build.mjs     # Virentia JSX compiled into templates, as @virentia/ui/vite does
for i in 1 2 3; do                         # three runs; append=1 pools them in one file
  node ui/run.mjs fw=virentia,react,vue,vue-vapor,solid,mol,vanilla scenario=A,B,C n=1000,10000 out=results/ui.json append=1
  node ui/run.mjs fw=virentia,react,vue,vue-vapor,solid,mol,vanilla scenario=A,B,C n=1000,10000 nogc=1 out=results/ui-nogc.json append=1
done
node core/build.mjs
BENCH_NOGC=1 node core/run.mjs p=3 out=results/core.jsonl
```

A complete core run takes several hours: the slowest libraries need minutes per cell at 10,000 todos. `only=` and `libs=` select scenarios and libraries, and `exclude=lib@scenario:n` skips single cells.
