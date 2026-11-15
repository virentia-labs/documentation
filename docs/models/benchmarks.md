---
title: Model Benchmarks
description: Reproducible measurements of model creation, active heap, and indexed lookups on a pinned Virentia commit.
prev: false
next: false
---

<script setup>
import { withBase } from "vitepress";
</script>


# Model Benchmarks

These are the saved measurements used in the Virentia presentation. All tests use Core commit [`e5743a8`](https://github.com/virentia-labs/virentia/tree/e5743a89e4cb8b9cdad41f2d7bc1f78714fc8c81). The creation and memory series was recorded on September 14, 2026; the separate lookup series was recorded on October 20, 2026 (UTC). Each comparison uses the same environment for both alternatives.

## What `staticModel` shares

`staticModel` builds units and connections once at declaration. Every instance keeps independent field values in its scope, and calling an instance's event operates on that instance's data. This avoids rebuilding an identical graph for every row, list item, or node. Use `model` when an instance needs its own closures or dynamically created units. The [model kinds guide](./kinds) covers the API and tradeoffs.

## Creating and keeping 10,000 instances

The original series ran on an **Apple M3 Pro, 36 GiB RAM, Node 22.15.0, V8 12.4.254.21-node.24, macOS/Darwin 25.6.0, arm64**. This environment is documented in the presentation's benchmark methodology.

Both variants declare three fields (`count`, `title`, `active`), one event, a reaction that increments `count`, and a `doubled` computed. Each instance receives one awaited event, then its computed is read. There are no indexes, UI subscribers, or network operations in this workload.

| Metric | `model` | `staticModel` |
| --- | ---: | ---: |
| Definition, measured separately | 0.0378 ms | 0.2485 ms |
| Create 10,000 instances | 345.03 ms | 57.49 ms |
| One event per instance | 61.29 ms | 48.03 ms |
| Dispose 10,000 instances | 268.88 ms | 251.24 ms |
| Additional heap with active instances | 199.57 MiB | 46.96 MiB |

Values are medians of **five fresh Node processes per variant**. Each process warms up on 100 instances of the same kind, and the order of the variants alternates. `createMs` times only the `collection.add` loop; declaration is timed separately. The creation ratio from the unrounded medians is approximately **6.00×**.

The heap column is the increase in `process.memoryUsage().heapUsed` over the baseline after updates, first computed reads, a completed microtask turn, and five calls to `global.gc()`. One MiB is 1,048,576 bytes. The approximately **76.5%** reduction includes the definitions, collection, instance data, runtime objects, and caches retained by this snapshot; it is not a per-instance payload estimate or an RSS measurement.

Node counting uses separate instrumented processes excluded from the timing and heap medians. For 10,000 instances, the original count is **70,000 model nodes with `model` and 7 shared definition nodes with `staticModel`**, plus one collection node in either case. The harness verifies the computed checksum and an empty collection after disposal.

This commit keeps strong node/scope registries, and its static scope pool retains up to 1,024 entries. These costs are included in the saved measurements. Disposal timings do not measure subsequent garbage collection, and disposal does not imply that all heap is released.

<a :href="withBase('/benchmarks/virentia-models-e5743a8.raw.json')">Download the original raw samples used for the homepage</a>.

A <a :href="withBase('/benchmarks/virentia-models-e5743a8.reproduction.json')">separate reproduction report</a> is also available. Its results are kept separate from the original series; they are not pooled into the homepage medians.

## Looking up an instance by a field

This is a separate comparison of **two lookup methods over the same indexed `staticModel` instances**. It does not compare `model` with `staticModel`.

The lookup series ran on an **Apple M1 Max, Node 24.14.0, V8 13.6.233.17-node.41, macOS/Darwin 25.5.0, arm64**, with esbuild 0.21.5 and TypeBox 0.34.52. The runner extracts Core from `git archive` at the pinned commit, excluding working-tree changes.

There are 10,000 Point instances with unique `x` values in a deterministic shuffled insertion order. Each process performs 1,000 successful searches with a different `x` every time:

```ts
// The query uses the existing eq index.
collection(Point).where(Point.x.eq(x)).first;

// The scan reads the same instance facades and stops at the first match.
for (const row of rows) {
  if (row.x.value === x) return row;
}
```

| Method | Median for all 1,000 lookups |
| --- | ---: |
| Linear scan | 2,135.86 ms |
| Indexed eq query | 182.42 ms |

Both methods are warmed up, and their order alternates across five independent processes. The ratio of medians is approximately **11.71×**. The query descriptor chain is rebuilt for every lookup, and changing criteria prevent hits in the single-slot result cache. Exact returned instance identity and misses are verified outside the timed loops.

The timer includes descriptor construction, query resolution, and result consumption. Declaration, instance creation, index population, validation, and warmup are excluded. The collection is not written to during the timed loops, so index maintenance on writes is not measured. This implementation still filters `state.order` by its hash bucket; the result is not a guarantee of O(1) query complexity or whole-application performance.

<a :href="withBase('/benchmarks/virentia-query-search-e5743a8.json')">Download lookup samples, checksums, environment, and source hashes</a>.

## Reproducing the measurements

Save each runner next to its corresponding harness:

- <a :href="withBase('/benchmarks/run-virentia-models.mjs')">Model runner</a> and <a :href="withBase('/benchmarks/virentia-models.harness.ts')">model harness</a>.
- <a :href="withBase('/benchmarks/run-virentia-query-search.mjs')">Lookup runner</a> and <a :href="withBase('/benchmarks/virentia-query-search.harness.ts')">lookup harness</a>.

Use a separate checkout with the pinned source and its locked dependencies:

```sh
git clone https://github.com/virentia-labs/virentia.git virentia-benchmark
git -C virentia-benchmark checkout e5743a89e4cb8b9cdad41f2d7bc1f78714fc8c81
pnpm --dir virentia-benchmark install --filter @virentia/mutable... --ignore-scripts --frozen-lockfile
```

With Node 22.15.0, run the model runner from the directory containing the downloaded files:

```sh
node run-virentia-models.mjs /absolute/path/to/virentia-benchmark models-results.json
```

For the lookup workload, use Node 24.14.0:

```sh
node run-virentia-query-search.mjs /absolute/path/to/virentia-benchmark lookup-results.json
```

The model runner measures the checkout's current HEAD, so verify that it is the pinned commit and has no tracked changes before running it. The lookup runner extracts its pinned Core source automatically. Match the recorded runtime and hardware when interpreting a new run, and compare alternatives within each workload rather than combining timings from different machines.
