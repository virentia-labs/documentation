import { createElement as rh, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mol from 'mol_jsx_lib';
// Frameworks with a compiler are built with it, as their production setups do.
import { mountVirentia } from './ui/virentia';
import { mountVue } from './ui/vue';
import { mountVueVapor } from './ui/vue-vapor';
import { mountSolid } from './ui/solid';

const n = 1000, stride = 10, batches = 25;
type Mounted = { update(value: number): Promise<void>; dispose(): void };
const host = document.getElementById('host')!;
const status = document.getElementById('status')!;
const output = document.getElementById('results')!;
const button = document.querySelector('button')!;
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const assert = (condition: boolean, message: string) => { if (!condition) throw Error(message); };

async function mountReact(container: HTMLElement): Promise<Mounted> {
  const root = createRoot(container);
  const setters: Array<(value: number) => void> = [];
  let commit: (() => void) | undefined;
  let remaining = 0;
  const committed = () => new Promise<void>(resolve => { commit = resolve; });
  function Row({ id }: { id: number }) {
    const [value, set] = useState(0); setters[id] = set;
    useLayoutEffect(() => { if (--remaining === 0) commit?.(); });
    return rh('tr', { 'data-row': id }, rh('td', null, String(id)), rh('td', null, value));
  }
  const mounted = committed(); remaining = n;
  root.render(rh('table', null, rh('tbody', null, Array.from({ length: n }, (_, id) => rh(Row, { id, key: id })))));
  await mounted;
  return {
    async update(value) {
      const updated = committed(); remaining = n / stride;
      for (let i = 0; i < n; i += stride) setters[i](value);
      await updated;
    },
    dispose() { root.unmount(); },
  };
}

// $mol: a $mol_jsx_view per row with a $mol_mem value; $mol_jsx is called directly, as JSX would compile.
const { $mol_jsx, $mol_jsx_attach, $mol_jsx_view, $mol_mem, $mol_wire_fiber } = mol as any;
const memo = (proto: object, name: string) => {
  const descriptor = $mol_mem(proto, name, Object.getOwnPropertyDescriptor(proto, name)!);
  if (descriptor) Object.defineProperty(proto, name, descriptor);
};
class MolRow extends $mol_jsx_view {
  index = 0;
  value(next?: number): number { return next ?? 0; }
  render() { return $mol_jsx('tr', { 'data-row': String(this.index) }, $mol_jsx('td', { id: 'i' }, String(this.index)), $mol_jsx('td', { id: 'v' }, String(this.value()))); }
}
memo(MolRow.prototype, 'value');
class MolTable extends $mol_jsx_view {
  ids: number[] = [];
  render() { return $mol_jsx('table', null, $mol_jsx('tbody', { id: 'body' }, this.ids.map(id => $mol_jsx(MolRow, { id: `r${id}`, index: id })))); }
}
let molRoots = 0;
function mountMol(container: HTMLElement): Mounted {
  const ids = Array.from({ length: n }, (_, id) => id);
  const node = $mol_jsx_attach(document, () => $mol_jsx(MolTable, { id: `table${++molRoots}`, ids }));
  const view = MolTable.of(node);
  container.append(node);
  return {
    async update(value) {
      const body = node.querySelector('tbody')!;
      for (let i = 0; i < n; i += stride) MolRow.of(body.children[i]).value(value);
      view.valueOf(); $mol_wire_fiber.sync();
    },
    dispose() { node.remove(); view.destructor(); $mol_wire_fiber.sync(); },
  };
}

// Hand-written DOM: the floor for the same table.
function mountVanilla(container: HTMLElement): Mounted {
  const table = document.createElement('table'), tbody = document.createElement('tbody');
  const texts: Text[] = new Array(n);
  for (let id = 0; id < n; id++) {
    const row = document.createElement('tr'), first = document.createElement('td'), second = document.createElement('td');
    row.setAttribute('data-row', String(id)); first.textContent = String(id);
    texts[id] = document.createTextNode('0'); second.append(texts[id]); row.append(first, second); tbody.append(row);
  }
  table.append(tbody); container.append(table);
  return {
    async update(value) { for (let i = 0; i < n; i += stride) texts[i].data = String(value); },
    dispose() { table.remove(); },
  };
}

function validate(container: HTMLElement, value: number) {
  const rows = container.querySelectorAll('tr');
  assert(rows.length === n, `Wrong row count: ${rows.length}`);
  rows.forEach((row, id) => {
    assert(row.cells[0].textContent === String(id), `Wrong id at ${id}`);
    assert(row.cells[1].textContent === String(id % stride === 0 ? value : 0), `Wrong value at ${id}`);
  });
}

async function sample(variant: string, round: number) {
  const container = document.createElement('div'); host.append(container);
  await frame();
  const start = performance.now();
  const mounted = variant === 'virentia' ? mountVirentia(container, n, stride)
    : variant === 'react' ? await mountReact(container) : variant === 'vue' ? mountVue(container, n, stride)
    : variant === 'vue-vapor' ? mountVueVapor(container, n, stride)
    : variant === 'solid' ? mountSolid(container, n, stride) : variant === 'mol' ? mountMol(container) : mountVanilla(container);
  const mountMs = performance.now() - start;
  validate(container, 0);
  // A warm update ensures each framework has an established update path.
  await mounted.update(1); validate(container, 1);
  let updateMs = 0;
  const batchMs: number[] = [];
  for (let i = 0; i < batches; i++) {
    await frame();
    const t = performance.now();
    await mounted.update(i + 2);
    const elapsed = performance.now() - t;
    updateMs += elapsed; batchMs.push(elapsed);
    validate(container, i + 2);
  }
  const checksum = Array.from(container.querySelectorAll('tr')).reduce((sum, row) => sum + Number(row.cells[1].textContent), 0);
  assert(checksum === (n / stride) * (batches + 1), 'Checksum mismatch');
  mounted.dispose(); container.remove();
  assert(host.childElementCount === 0, 'Root leaked');
  return { variant, round, n, stride, batches, mountMs, updateMs, batchMs, checksum };
}

button.addEventListener('click', async () => {
  button.disabled = true;
  const samples: Awaited<ReturnType<typeof sample>>[] = [];
  try {
    const variants = ['virentia', 'react', 'vue', 'vue-vapor', 'solid', 'mol', 'vanilla'];
    const rounds = 2 * variants.length;
    for (const variant of variants) { status.textContent = `Warmup: ${variant}`; await sample(variant, -1); }
    // Every variant takes every ordering slot twice.
    for (let round = 0; round < rounds; round++) {
      const order = variants.map((_, index) => variants[(index + round) % variants.length]);
      for (const variant of order) {
        status.textContent = `Round ${round + 1}/${rounds}: ${variant}`;
        samples.push(await sample(variant, round));
      }
    }
    const median = (values: number[]) => { const sorted = values.toSorted((a, b) => a - b), middle = sorted.length >> 1;
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
    const medians = variants.map(variant => ({ variant, ...Object.fromEntries(['mountMs', 'updateMs'].map(key =>
      [key, median(samples.filter(sample => sample.variant === variant).map(sample => sample[key as 'mountMs' | 'updateMs']))])) }));
    const report = { measuredAt: new Date().toISOString(),
      environment: { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
        viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio, visibility: document.visibilityState },
      workload: { n, stride, batches, rowsUpdatedPerBatch: n / stride, rounds: 2 * 7, warmupRounds: 1,
        timing: 'JS until DOM commit; frame waits, validation, layout, paint and teardown are excluded',
        react: 'production createRoot, row-local useState, native scheduling, completion via useLayoutEffect',
        vue: 'Vue 3.5 SFCs, <script setup> compiled with an inline template, row-local shallowRef, completion via nextTick',
        'vue-vapor': 'Vue 3.6.0-rc.13 Vapor mode: the same SFCs with <script setup vapor>, row-local shallowRef, completion via nextTick',
        virentia: 'JSX compiled into templates by the Virentia compiler, row-local store, synchronous DOM binding',
        solid: 'JSX compiled by babel-preset-solid, row-local signal, updates in batch()',
        mol: 'production $mol_jsx_view per row, $mol_mem value, $mol_jsx called directly, synchronous fiber sync',
        vanilla: 'hand-written DOM, the floor' },
      medians, samples };
    output.textContent = JSON.stringify(report, null, 2);
    const response = await fetch('/results', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(report) });
    if (!response.ok) throw Error('Could not save report');
    status.textContent = 'Completed. All DOM assertions passed. ui-results.json saved.';
  } catch (error) { status.textContent = `Failed: ${error}`; console.error(error); }
  finally { button.disabled = false; }
});
