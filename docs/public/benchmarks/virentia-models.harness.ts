import { performance } from 'node:perf_hooks';
import { computed, event, reaction, scope, scoped } from '@virentia/core';
import { collection, f, model, staticModel } from '@virentia/core/models';
import { onInspectorEvent } from '@virentia/research/inspector';

const kind = process.argv[2];
const n = Number(process.argv[3]);
const mode = process.argv[4] || 'perf';
if (!['model', 'staticModel'].includes(kind) || !Number.isInteger(n) || n < 1) throw Error('kind n [perf|counts]');
if (!global.gc) throw Error('Run Node with --expose-gc');
const gc = () => { for (let i = 0; i < 5; i++) global.gc!(); };
const yieldTurn = () => new Promise<void>(resolve => setImmediate(resolve));
function declare() {
  const factory = kind === 'model' ? model : staticModel;
  return factory({
    name: 'BenchRow',
    data: { count: f.number(0), title: f.string('row'), active: f.boolean(false) },
    setup(self: any) {
      const incremented = event<void>();
      const doubled = computed(() => self.count.value * 2);
      reaction({ on: incremented, run() { self.count.value++; } });
      return { incremented, doubled };
    },
  } as any);
}
async function warmup() {
  const definition = declare();
  const app = scope();
  const rows: any[] = [];
  const c = scoped(app, () => collection(definition));
  scoped(app, () => { for (let i = 0; i < 100; i++) rows.push(c.add({ id: `warm${i}`, count: i })); });
  for (const row of rows) await scoped(app, () => row.incremented());
  scoped(app, () => { for (const row of rows) { if (row.doubled.value < 2) throw Error('warmup'); row.dispose(); } });
  rows.length = 0;
  await yieldTurn();
}
if (mode !== 'counts') await warmup();
gc();
const baselineHeap = process.memoryUsage().heapUsed;
const counts: Record<string, number> = {};
let stage = 'definition';
let off: (() => void) | undefined;
if (mode === 'counts') off = onInspectorEvent(e => { if (e.type === 'node-created') counts[stage] = (counts[stage] || 0) + 1; });
let start = performance.now();
const definition = declare();
const defineMs = performance.now() - start;
stage = 'collection';
const app = scope();
const c = scoped(app, () => collection(definition));
let rows: any[] = [];
stage = 'create';
start = performance.now();
scoped(app, () => { for (let i = 0; i < n; i++) rows.push(c.add({ id: String(i), count: i })); });
const createMs = performance.now() - start;
gc();
const createdHeap = process.memoryUsage().heapUsed;
stage = 'update';
start = performance.now();
for (const row of rows) await scoped(app, () => row.incremented());
const updateMs = performance.now() - start;
stage = 'read';
const checksum = scoped(app, () => rows.reduce((sum, row) => sum + row.doubled.value, 0));
if (checksum !== n * (n + 1)) throw Error(`checksum ${checksum}`);
await yieldTurn();
gc();
const activeHeap = process.memoryUsage().heapUsed;
stage = 'dispose';
start = performance.now();
scoped(app, () => { for (const row of rows) row.dispose(); });
const disposeMs = performance.now() - start;
rows = [];
await yieldTurn();
gc();
const disposedHeap = process.memoryUsage().heapUsed;
const liveCount = scoped(app, () => c.count);
if (liveCount !== 0) throw Error('dispose did not empty collection');
off?.();
// Keep the definition, app and empty collection alive through the heap sample;
// disposal retention therefore includes legitimate collection scope pooling.
console.log(JSON.stringify({ kind, n, mode, defineMs, createMs, updateMs, disposeMs, baselineHeap, createdHeap, activeHeap, disposedHeap, createdDelta: createdHeap - baselineHeap, activeDelta: activeHeap - baselineHeap, disposedDelta: disposedHeap - baselineHeap, checksum, liveCount, counts, retainedRoots: [definition.kind, app.values.size, c.count] }));
