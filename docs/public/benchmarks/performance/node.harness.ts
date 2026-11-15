import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { computed, event, reaction, scope, scoped, store } from '@virentia/core';
import { f, staticModel } from '@virentia/core/models';
import { createRootDraft } from '@virentia/benchmark/draft';
import { action, computed as mobxComputed, makeObservable, observable } from 'mobx';
import { allSettled, createEvent, createStore, fork } from 'effector';
import { action as reatomAction, atom, batch as reatomBatch, computed as reatomComputed } from '@reatom/core';
import { configureStore, createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { produce, setAutoFreeze } from 'immer';
import { create } from 'mutative';

const [area, variant, scenario = '1000'] = process.argv.slice(2);
const gc = () => { for (let i = 0; i < 5; i++) global.gc!(); };
const turn = () => new Promise<void>(resolve => setImmediate(resolve));
if (!global.gc) throw Error('Use --expose-gc');

// One way to create, read, and change an instance per library. `createAll` runs inside the timer.
interface Models {
  warm(): void;
  createAll(n: number): unknown[];
  doubled(row: any): number;
  count(row: any): number;
  increment(row: any): unknown;
}

function virentiaModels(): Models {
  const Row = staticModel({
    name: 'BenchRow',
    data: { count: f.number(0), title: f.string('row'), active: f.boolean(false) },
    setup(self: any) {
      const increment = event();
      const doubled = computed(() => self.count.value * 2);
      reaction({ on: increment, run() { self.count.value++; } });
      return { increment, doubled };
    },
  } as any);
  const app = scope();
  return {
    warm() { scoped(app, () => { for (let i = 0; i < 200; i++) { const r = Row.create({ id: `warm-${i}`, count: i }); r.dispose(); } }); },
    // One `Model.create(list)`, as Effector and Redux add every record in one call.
    createAll(n) { return scoped(app, () => Row.create(Array.from({ length: n }, (_, i) => ({ id: String(i), count: i })))) as any[]; },
    doubled: row => scoped(app, () => row.doubled.value),
    count: row => scoped(app, () => row.count.value),
    increment: row => row.increment(),
  };
}

function mobxModels(): Models {
  // Class methods and annotations are shared; no per-instance autorun is added.
  class MobxRow {
    count: number;
    title = 'row';
    active = false;
    constructor(count: number) {
      this.count = count;
      makeObservable(this, { count: observable, title: observable, active: observable,
        increment: action, doubled: mobxComputed });
    }
    increment() { this.count++; }
    get doubled() { return this.count * 2; }
  }
  return {
    warm() { for (let i = 0; i < 200; i++) { const r = new MobxRow(i); r.increment(); assert.equal(r.doubled, (i + 1) * 2); } },
    createAll(n) { const rows: MobxRow[] = []; for (let i = 0; i < n; i++) rows.push(new MobxRow(i)); return rows; },
    doubled: row => row.doubled,
    count: row => row.count,
    increment: row => row.increment(),
  };
}

function reatomModels(): Models {
  // Atoms for the fields, a computed, and an action per instance.
  const createRow = (initial: number) => {
    const count = atom(initial), title = atom('row'), active = atom(false);
    const doubled = reatomComputed(() => count() * 2);
    const increment = reatomAction(() => { count.set(count() + 1); });
    return { count, title, active, doubled, increment };
  };
  return {
    warm() { for (let i = 0; i < 200; i++) { const r = createRow(i); reatomBatch(() => r.increment(), true); assert.equal(r.doubled(), (i + 1) * 2); } },
    createAll(n) { const rows = []; for (let i = 0; i < n; i++) rows.push(createRow(i)); return rows; },
    doubled: row => row.doubled(),
    count: row => row.count(),
    increment: row => reatomBatch(() => row.increment(), true),
  };
}

function effectorModels(): Models {
  // Instances are records in one store, as Effector keeps collections: an event adds them,
  // another increments one by id, and the derived value is read from the store state.
  interface Row { count: number; title: string; active: boolean }
  const make = () => {
    const added = createEvent<Record<string, Row>>(), incremented = createEvent<string>();
    const $rows = createStore<Record<string, Row>>({})
      .on(added, (rows, more) => ({ ...rows, ...more }))
      .on(incremented, (rows, id) => ({ ...rows, [id]: { ...rows[id], count: rows[id].count + 1 } }));
    return { $rows, added, incremented };
  };
  let model = make();
  const records = (from: number, n: number, prefix = '') => {
    const rows: Record<string, Row> = {};
    for (let i = from; i < from + n; i++) rows[prefix + i] = { count: i, title: 'row', active: false };
    return rows;
  };
  const doubled = (id: string) => model.$rows.getState()[id].count * 2;
  return {
    warm() {
      model.added(records(0, 200, 'warm-'));
      for (let i = 0; i < 200; i++) { model.incremented(`warm-${i}`); assert.equal(doubled(`warm-${i}`), (i + 1) * 2); }
      model = make();
    },
    createAll(n) { model.added(records(0, n)); return Object.keys(model.$rows.getState()); },
    doubled,
    count: id => model.$rows.getState()[id].count,
    increment: id => model.incremented(id),
  };
}

function effectorFactoryModels(): Models {
  // Effector has no instance models in its core. A factory creates each instance's units, as Effector
  // apps build per-instance models: a store per field, an increment event, and a derived store.
  const createRow = (initial: number) => {
    const $count = createStore(initial), $title = createStore('row'), $active = createStore(false);
    const increment = createEvent();
    $count.on(increment, value => value + 1);
    const $doubled = $count.map(value => value * 2);
    return { $count, $title, $active, $doubled, increment };
  };
  return {
    warm() { for (let i = 0; i < 200; i++) { const r = createRow(i); r.increment(); assert.equal(r.$doubled.getState(), (i + 1) * 2); } },
    createAll(n) { const rows = []; for (let i = 0; i < n; i++) rows.push(createRow(i)); return rows; },
    doubled: row => row.$doubled.getState(),
    count: row => row.$count.getState(),
    increment: row => row.increment(),
  };
}

function virentiaRecordModels(): Models {
  // Virentia the way the Effector and Redux variants keep a collection: records in one store. One event
  // adds them, another increments one by id, and the derived value is read from the store state.
  interface Row { count: number; title: string; active: boolean }
  const make = () => {
    const added = event<Record<string, Row>>(), incremented = event<string>();
    const rows = store<Record<string, Row>>({});
    reaction({ on: added, run(more) { rows.value = { ...rows.value, ...more }; } });
    reaction({ on: incremented, run(id) { const all = rows.value; rows.value = { ...all, [id]: { ...all[id], count: all[id].count + 1 } }; } });
    return { rows, added, incremented };
  };
  const app = scope();
  let model = make();
  const records = (from: number, n: number, prefix = '') => {
    const rows: Record<string, Row> = {};
    for (let i = from; i < from + n; i++) rows[prefix + i] = { count: i, title: 'row', active: false };
    return rows;
  };
  const state = () => scoped(app, () => model.rows.value);
  const doubled = (id: string) => state()[id].count * 2;
  return {
    warm() {
      scoped(app, () => model.added(records(0, 200, 'warm-')));
      for (let i = 0; i < 200; i++) { scoped(app, () => model.incremented(`warm-${i}`)); assert.equal(doubled(`warm-${i}`), (i + 1) * 2); }
      model = make();
    },
    createAll(n) { scoped(app, () => model.added(records(0, n))); return Object.keys(state()); },
    doubled,
    count: id => state()[id].count,
    increment: id => scoped(app, () => model.incremented(id)),
  };
}

function reduxModels(): Models {
  // Redux Toolkit: instances are entity records in one store, the operation is an action,
  // the derived value is a selector. Creation adds all records in one dispatch.
  interface Row { id: string; count: number; title: string; active: boolean }
  const adapter = createEntityAdapter<Row>();
  const slice = createSlice({
    name: 'rows', initialState: adapter.getInitialState(),
    reducers: {
      added: adapter.addMany,
      incremented(state, action: PayloadAction<string>) { state.entities[action.payload].count++; },
    },
  });
  const make = () => configureStore({ reducer: slice.reducer });
  let store = make();
  const selectDoubled = (id: string) => store.getState().entities[id].count * 2;
  return {
    warm() {
      store.dispatch(slice.actions.added(Array.from({ length: 200 }, (_, i) => ({ id: `warm-${i}`, count: i, title: 'row', active: false }))));
      for (let i = 0; i < 200; i++) { store.dispatch(slice.actions.incremented(`warm-${i}`)); assert.equal(selectDoubled(`warm-${i}`), (i + 1) * 2); }
      store = make();
    },
    createAll(n) {
      store.dispatch(slice.actions.added(Array.from({ length: n }, (_, i) => ({ id: String(i), count: i, title: 'row', active: false }))));
      return store.getState().ids.slice();
    },
    doubled: id => selectDoubled(id),
    count: id => store.getState().entities[id].count,
    increment: id => store.dispatch(slice.actions.incremented(id)),
  };
}

async function models() {
  const n = 10000;
  const impl = variant === 'virentia' ? virentiaModels() : variant === 'virentia-records' ? virentiaRecordModels()
    : variant === 'effector-factory' ? effectorFactoryModels() : variant === 'mobx' ? mobxModels()
    : variant === 'reatom' ? reatomModels() : variant === 'effector' ? effectorModels()
    : variant === 'redux' ? reduxModels() : (() => { throw Error('Unknown model variant'); })();
  impl.warm();
  await turn(); gc();
  const baseline = process.memoryUsage().heapUsed;
  const start = performance.now();
  const rows = impl.createAll(n);
  const createMs = performance.now() - start;
  gc();
  const createdHeapBytes = process.memoryUsage().heapUsed - baseline;
  const checksum = rows.reduce((sum: number, row) => sum + impl.doubled(row), 0);
  assert.equal(checksum, n * (n - 1));
  // Behavior is verified after the measured creation and heap samples.
  await impl.increment(rows[0]);
  assert.equal(impl.doubled(rows[0]), 2);
  assert.equal(impl.count(rows[1]), 1);
  assert.equal(rows.length, n);
  return { n, createMs, createdHeapBytes, checksum, liveRows: rows.length };
}

async function core() {
  const events = 10000, width = 10, warmup = 1000;
  let dispatch: () => Promise<unknown>;
  let read: () => number[];
  if (variant === 'virentia') {
    const tick = event<number>();
    const values = Array.from({ length: width }, () => store(0));
    reaction({ on: tick, run(value) { for (const state of values) state.value += value; } });
    const app = scope();
    dispatch = () => scoped(app, () => tick(1));
    read = () => scoped(app, () => values.map(value => value.value));
  } else if (variant === 'effector') {
    const tick = createEvent<number>();
    const values = Array.from({ length: width }, () => createStore(0).on(tick, (value, delta) => value + delta));
    const app = fork();
    dispatch = () => allSettled(tick, { scope: app, params: 1 });
    read = () => values.map(value => app.getState(value));
  } else if (variant === 'mobx') {
    // No scopes in MobX: one action writes 10 observable boxes.
    const values = Array.from({ length: width }, () => observable.box(0));
    const tick = action((delta: number) => { for (const value of values) value.set(value.get() + delta); });
    dispatch = async () => { tick(1); };
    read = () => values.map(value => value.get());
  } else if (variant === 'reatom') {
    // One action writes 10 atoms; batch(fn, true) completes the update synchronously.
    const values = Array.from({ length: width }, () => atom(0));
    const tick = reatomAction((delta: number) => { for (const value of values) value.set(value() + delta); });
    dispatch = async () => { reatomBatch(() => tick(1), true); };
    read = () => values.map(value => value());
  } else if (variant === 'redux') {
    // Redux Toolkit: one store per app, one reducer updates the 10 counters.
    const slice = createSlice({
      name: 'counters', initialState: { values: Array<number>(width).fill(0) },
      reducers: { ticked(state, action: PayloadAction<number>) { for (let i = 0; i < width; i++) state.values[i] += action.payload; } },
    });
    const app = configureStore({ reducer: slice.reducer });
    dispatch = async () => { app.dispatch(slice.actions.ticked(1)); };
    read = () => app.getState().values.slice();
  } else throw Error('Unknown core variant');
  for (let i = 0; i < warmup; i++) await dispatch();
  assert.deepEqual(read(), Array(width).fill(warmup));
  gc();
  const start = performance.now();
  for (let i = 0; i < events; i++) await dispatch();
  const dispatchMs = performance.now() - start;
  assert.deepEqual(read(), Array(width).fill(events + warmup));
  return { events, width, warmup, dispatchMs, checksum: read().reduce((a, b) => a + b, 0) };
}

function mutable() {
  const n = 50000, touch = Number(scenario), iterations = 80, warmup = 20;
  assert.ok([1000, 5000, 50000].includes(touch));
  let value = { items: Array.from({ length: n }, (_, id) => ({ id, v: 0 })) };
  const initial = value;
  const env = { owned: new WeakSet<object>(), onChange() {}, onRead() {}, onReadAll() {}, isTracking: () => false };
  const recipe = (draft: typeof value) => {
    for (let i = 0; i < touch; i++) draft.items[i * (n / touch)].v++;
  };
  // Match production immutable settings: freezing is disabled for both immutable libraries.
  setAutoFreeze(false);
  const step = () => {
    if (variant === 'virentia') { const draft = createRootDraft(value, env); recipe(draft.proxy as typeof value); value = draft.latest() as typeof value; }
    else if (variant === 'immer') value = produce(value, recipe);
    else if (variant === 'mutative') value = create(value, recipe, { enableAutoFreeze: false });
    else throw Error('Unknown mutable variant');
  };
  for (let i = 0; i < warmup; i++) step();
  gc();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) step();
  const totalMs = performance.now() - start;
  const checksum = value.items.reduce((sum, item) => sum + item.v, 0);
  assert.equal(checksum, touch * (warmup + iterations));
  assert.equal(initial.items.reduce((sum, item) => sum + item.v, 0), 0);
  assert.equal(value.items[n / touch].id, n / touch);
  return { n, touch, iterations, warmup, totalMs, perUpdateMs: totalMs / iterations, checksum };
}

const result = area === 'models' ? await models() : area === 'core' ? await core() : area === 'mutable' ? mutable() : (() => { throw Error('Unknown area'); })();
console.log(JSON.stringify({ area, variant, scenario, ...result }));
