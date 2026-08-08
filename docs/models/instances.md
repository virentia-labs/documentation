---
title: Collections And Instances
---

# Collections And Instances

A collection is where a model's instances live: the only way to create them,
the place queries run, and the owner of their lifecycle. Use it as the single
source of truth for "which entities exist right now" - components, effects,
and tests all read the same collection through a scope.

## Creating A Collection

`collection(Model)` is get-or-create per scope:

```ts
import { scope, scoped } from "@virentia/core";
import { collection } from "@virentia/core/models";

const appScope = scope();

scoped(appScope, () => {
  const todos = collection(Todo);

  collection(Todo) === todos; // true - same scope, same collection
});
```

Different scopes hold fully independent populations - SSR requests and tests
never see each other's entities. The rest of the examples assume an active
scope.

## Adding And Merging

`add` takes JSON. A new id creates, a known id merges - present keys win,
absent keys stay:

```ts
const todos = collection(Todo);

todos.add({ id: "1", title: "write docs" });        // create
todos.add({ id: "1", done: true });                 // merge - title untouched
todos.get("1")!.title.value;                        // "write docs"

todos.add({ id: "1", title: "rewrite" }, { replace: true });
// replace - absent optional keys reset to defaults
```

An array is one batch - validated up front, rolled back if an element fails:

```ts
todos.add([{ title: "a" }, { title: "b" }]); // both or neither
```

What happens:

- merging is how server refreshes work: re-`add` the fetched list, existing
  instances update in place, references to them stay valid;
- a partial input with an unknown id is an error naming the missing keys -
  there are no half-created entities;
- `Model.create(props)` is a shortcut for `collection(Model).add(props)` in
  the active scope.

## Reading And Writing

Fields are stores; members returned from `setup` are callable on the instance:

```ts
const t = todos.add({ title: "x" });

t.title.value;          // "x"
t.done.value = true;    // a regular store write - queries update immediately
```

The reserved surface of every instance:

```ts
t.id;            // the entity id: taken from the input, or generated (temporary)
t.key;           // stable UI key - survives rebind, unique across reuse
t.alive;         // is the instance still there; reactive, safe to read after dispose
t.json();        // serialize back to JSON
t.dispose();     // destroy the instance: cascade children, drop from indexes
t.rebind(newId); // change the id, keep the instance
t.onCleanup(fn); // tie an external resource to the instance's lifetime
```

## Behavior Per Instance

`setup` wires events and reactions. In a `staticModel` it runs once - the
units are shared - but every reaction still behaves per instance:

```ts
const Todo = staticModel({
  data: { done: f.boolean(false) },
  setup(self) {
    const toggled = event<void>();

    reaction({
      on: toggled,
      run: () => {
        self.done.value = !self.done.value;
      },
    });

    return { toggled };
  },
});

const a = todos.add({});
const b = todos.add({});

await a.toggled();

a.done.value; // true
b.done.value; // false - untouched
```

Because a static model's `setup` runs without a concrete instance, the
instance API on `self` (`self.id`, `self.json()`, ...) is available only
inside unit bodies - reactions and effects - where an instance exists.

## Reacting To App State

A reaction on an external store runs for every live instance, each run seeing
its own fields:

```ts
const filter = store("");

const Todo = staticModel({
  data: { title: f.string(), visible: f.boolean(true) },
  setup(self) {
    reaction({
      on: filter,
      run: (value) => {
        self.visible.value = self.title.value.includes(value);
      },
    });
  },
});
```

Change `filter.value` once - every todo recomputes its own `visible`. No
instances, no runs; other scopes are not touched.

## Disposal

`dispose()` (or `collection.remove(id)`) cascades children, applies
[delete policies](./relations#delete-policies), and drops the instance from
indexes and queries. After that:

- reads of fields throw `entity was disposed`, and the error names where the
  dispose happened;
- `alive` turns `false` - reactively, so views can degrade without `try`:

```ts
const label = computed(() => (t.alive ? t.title.value : "deleted"));

todos.remove(t.id);
label.value; // "deleted"
```

Static instances are cheap to churn: a disposed instance's scope returns to a
pool and is reused for the next `add`. Stale references stay safe - `t.key`
never repeats, and old handles throw instead of reading the new occupant.

## External Resources: `onCleanup`

When an instance holds something outside the model - a socket topic, a map
marker, a DOM listener - `onCleanup` ties its release to the instance's
lifetime. No store to keep the unsubscribe in, no per-instance units:

```ts
const Ticker = staticModel({
  data: { symbol: f.string("") },
  setup(self) {
    const connect = event<void>();

    reaction({
      on: connect,
      run: () => {
        // the ambient instance owns this subscription now
        self.onCleanup(feed.subscribeTopic(self.symbol.value, onMessage));
      },
    });

    return { connect };
  },
});
```

What happens:

- cleanups run at dispose, after the `restrict` gate, while fields are still
  readable;
- each instance keeps only its own cleanups - disposing one ticker
  unsubscribes one topic;
- `onCleanup` returns an unregister function; a throwing cleanup is reported
  and does not abort disposal;
- it also works from outside (`t.onCleanup(fn)`) - integrations attach
  resources to entities they render;
- in a static model's `setup`, call it from unit bodies - that is where the
  ambient instance exists; in a dynamic `model` it works right in the setup
  body, and unit subscriptions made there are cleaned automatically anyway.

### Attaching From Outside

An integration owns a resource per entity - a map pin, a chart series, a DOM
node. Tie it to the entity from the outside:

```ts
for (const city of cities.items) {
  const marker = map.addMarker(city.lat.value, city.lng.value);

  city.onCleanup(() => marker.remove()); // the entity leaves - the pin leaves
}
```

The returned function unregisters without waiting for dispose - for resources
you take back manually:

```ts
const release = row.onCleanup(() => highlight.remove());

// later, when the row loses selection but stays alive:
release();
highlight.remove();
```

### Aborting In-Flight Work

A dynamic model creates its controller in the setup body; disposing the
instance cancels whatever is still running:

```ts
const ReportJob = model({
  data: { query: f.string("") },
  setup(self) {
    const controller = new AbortController();

    self.onCleanup(() => controller.abort()); // dispose cancels the request

    const start = event<void>();

    reaction({
      on: start,
      run: async () => {
        const rows = await api.report(self.query.value, {
          signal: controller.signal,
        });

        // ...
      },
    });

    return { start };
  },
});
```

In a static model there are no per-instance closures - a **local field** is
the sanctioned per-instance slot for a resource handle. Superseding aborts
the previous request, dispose aborts the current one, and `release()` in
`finally` keeps registrations from piling up run after run:

```ts
const Search = staticModel({
  data: (p: Props<{ query: string }>) => ({
    query: f.string(p.query),
    results: f.array(f.string(), []).local(),
    inFlight: f.any(null).local(), // the per-instance slot
  }),
  setup(self) {
    const search = event<void>();

    reaction({
      on: search,
      run: async () => {
        self.inFlight.value?.abort(); // latest wins; abort() is idempotent

        const controller = new AbortController();
        const release = self.onCleanup(() => controller.abort());

        self.inFlight.value = controller;

        try {
          self.results.value = await api.search(self.query.value, {
            signal: controller.signal,
          });
        } catch (error) {
          if (!controller.signal.aborted) throw error; // superseded/disposed - not a failure
        } finally {
          release(); // the request ended - drop its registration
        }
      },
    });

    return { search };
  },
});
```

Writes to `self` after the `await` still land on the right instance - the
scope survives suspension, per instance.

### Re-Subscribing When Data Changes

In a dynamic model, per-instance closures are legal - keep the current
unsubscribe in one and rotate it; `onCleanup` releases whichever is last:

```ts
const Chart = model({
  data: { symbol: f.string("") },
  setup(self) {
    let drop: (() => void) | undefined;

    reaction(() => {
      // re-runs whenever symbol changes
      drop?.();
      drop = feed.subscribeTopic(self.symbol.value, draw);
    });

    self.onCleanup(() => drop?.());
  },
});
```

### A WebSocket Per Instance

The same two tools carry a live connection in a static model: a local field
holds the socket, `onCleanup` closes it. Socket callbacks fire outside any
model context, so they go through a captured facade - never through `self`:

```ts
const Room = staticModel({
  data: (p: Props<{ channel: string }>) => ({
    channel: f.string(p.channel),
    messages: f.array(f.string(), []).local(),
    socket: f.any(null).local(),
  }),
  setup(self) {
    const joined = event<void>();
    const send = event<string>();

    reaction({
      on: joined,
      run: () => {
        const me = collection(Room).get(self.id)!; // callbacks run outside model context

        const socket = new WebSocket(`wss://chat.example/${self.channel.value}`);

        socket.onmessage = (event) => {
          me.messages.value = [...me.messages.value, event.data]; // routes to THIS room
        };

        self.socket.value = socket;
        self.onCleanup(() => socket.close()); // leaving the room closes the connection
      },
    });

    reaction({
      on: send,
      run: (text) => self.socket.value?.send(text),
    });

    return { joined, send };
  },
});
```

Why the facade: inside `onmessage` there is no ambient instance, and `self`
would resolve against nothing - the captured `me` routes to its instance from
anywhere, like in the timers example below.

### Timers That Outlive The Call Stack

A timer callback fires outside any model context - the ambient instance is
gone by then. Capture the facade first; it routes to its instance from
anywhere:

```ts
const Monitor = staticModel({
  data: { url: f.string("") },
  setup(self) {
    const started = event<void>();
    const check = event<void>();

    reaction({
      on: check,
      run: async () => {
        // ping self.url.value ...
      },
    });

    reaction({
      on: started,
      run: () => {
        const me = collection(Monitor).get(self.id)!; // the facade survives outside unit bodies

        const timer = setInterval(() => void me.check(), 5_000);

        self.onCleanup(() => clearInterval(timer)); // removing the monitor stops its polling
      },
    });

    return { started, check };
  },
});
```

## Contract

```ts
function collection<M>(model: M, scope?: Scope): Collection<M>;

interface Collection<M> extends Query<InstanceOf<M>> {
  add(input: Dto | ({ id: string } & Partial<Dto>), options?: { replace?: boolean }): InstanceOf<M>;
  add(input: readonly Input[], options?: { replace?: boolean }): InstanceOf<M>[];
  get(id: string): InstanceOf<M> | null; // reactive, resolves rebind aliases
  remove(id: string): void;
}

interface InstanceApi {
  readonly id: string;
  readonly key: string;
  readonly alive: boolean;
  json(): Record<string, unknown>;
  dispose(): void;
  rebind(newId: string): void;
  onCleanup(cleanup: () => void): () => void; // returns unregister
}
```

## Common Cases

Use collections for:

- caching server lists - `add` the response, merges keep references valid;
- entity registries shared by many screens - one collection per scope;
- optimistic creation - `add` without an id, [rebind later](./wire#changing-an-id-rebind);
- test setups - a fresh scope gives a fresh, isolated population.

## Related

- [Queries and indexes](./queries) - every collection is also a query.
- [Relations](./relations) - children are created through their parent.
- [Data in and out](./wire) - `json()`, temporary ids, `rebind`.
