---
title: Queries And Indexes
---

# Queries And Indexes

Queries filter, sort, and slice a collection. Use them instead of `.items`
plus array methods: they ride the declared indexes, update reactively, and
keep result identity stable - which is exactly what list UIs need.

Field descriptors live on the model (`Todo.done`), so building a query needs
no instance in hand.

Examples on this page run inside an active scope - see
[Collections and instances](./instances).

## Filtering

```ts
const Todo = staticModel({
  data: {
    title: f.string(),
    done: f.boolean(false).indexed(),
    priority: f.number(0).indexed("ord"),
  },
});

const todos = collection(Todo);

todos.add([
  { title: "a", priority: 1 },
  { title: "b", priority: 5, done: true },
  { title: "c", priority: 9 },
]);

todos.where(Todo.done.eq(false)).count;          // 2
todos.where(Todo.priority.between(2, 9)).ids;    // ids of "b" and "c"
todos.where(Todo.title.startsWith("a")).first;   // instance "a"
```

Chains narrow further; a plain function is an escape hatch that scans:

```ts
todos
  .where(Todo.done.eq(false))
  .where((t) => t.title.value.length > 1);
```

## Sorting And Slicing

```ts
todos.sort(Todo.priority.desc).take(2).items; // top-2 by priority
```

## Projections And Mass Operations

```ts
const done = todos.where(Todo.done.eq(true));

done.select(Todo.title); // ["b"] - field values, not instances
done.set(Todo.done, false); // write to every match
todos.where(Todo.priority.lt(2)).remove(); // dispose every match
```

## One Instance By Id

`get(id)` is a reactive view of a single instance:

```ts
const view = computed(() => todos.get("42"));

view.value;              // null - not loaded yet
todos.add({ id: "42", title: "x" });
view.value;              // the instance
todos.remove("42");
view.value;              // null again - no throw mid-read
```

It also resolves old ids after [`rebind`](./wire#changing-an-id-rebind), so a
component holding an id from a route keeps working.

## Making It Fast

Without indexes queries scan. Declaring them changes the plan, not the code:

- `.indexed()` - `eq` predicates read a hash bucket;
- `.indexed("ord")` - ranges and `sort` by the field use a sorted view.

Indexes are maintained on write, so results are never stale; the sorted view
rebuilds lazily on the first query after a change - a thousand writes in one
frame cost one rebuild.

## Reactivity

Query terminals are reactive reads. A computed or reaction over them re-runs
when the result can change:

```ts
const activeCount = computed(() => todos.where(Todo.done.eq(false)).count);

activeCount.value;      // 2
todos.first!.done.value = true;
activeCount.value;      // 1 - recomputed
```

## Stable Results

Plans are interned by shape; values are bind parameters. A chain rebuilt from
scratch returns the same arrays while the result is unchanged:

```ts
const a = todos.where(Todo.priority.gte(2)).items;
const b = todos.where(Todo.priority.gte(2)).items;

a === b; // true

todos.first!.title.value = "renamed"; // does not affect this result
todos.where(Todo.priority.gte(2)).items === a; // still true
```

Rebuilding a query every render is therefore free, and UI bindings re-render
only when the set actually changes.

## Contract

```ts
interface Query<T> extends Iterable<T> {
  readonly items: T[];
  readonly ids: string[];
  readonly count: number;
  readonly first: T | null;

  where(predicate: Predicate | ((item: T) => boolean)): Query<T>;
  sort(by: SortToken): Query<T>;
  take(count: number): Query<T>;

  select(field: Descriptor): unknown[];
  set(field: Descriptor, value: unknown): void;
  remove(): void;       // mass dispose
  toArray(): T[];
}

// descriptor operators
Todo.field.eq(v)  .neq(v)  .gt(v)  .gte(v)  .lt(v)  .lte(v)
Todo.field.between(from, to)  .startsWith(prefix)  .includes(part)
Todo.field.asc  Todo.field.desc
```

Descriptors are bound to their model - passing another model's descriptor is
an error, not an empty result.

## Common Cases

Use queries for:

- list screens - filter + sort + `take`, rebuilt inline every render;
- badges and counters - a computed over `count`;
- lookups by a secondary key - `.indexed().unique()` field plus `eq`;
- bulk actions - `set` and `remove()` on a filtered query.

## Related

- [Fields and data](./fields) - declaring `.indexed()` fields.
- [UI bindings](./bindings) - rendering queries in React and Vue.
- [Unions](./unions) - querying mixed collections.
