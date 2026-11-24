import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { scope, scoped } from '@virentia/core';
import { collection, f, staticModel } from '@virentia/core/models';

const n = Number(process.argv[2] || 10000);
const searches = Number(process.argv[3] || 1000);
const round = Number(process.argv[4] || 0);
if (!Number.isInteger(n) || !Number.isInteger(searches) || searches < 1 || searches > n) {
  throw Error('Usage: n searches<=n round');
}
if (!global.gc) throw Error('Run Node with --expose-gc');

function shuffled(length: number, seed: number) {
  const values = Array.from({ length }, (_, i) => i);
  let state = seed >>> 0;
  for (let i = length - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = Math.floor((state / 0x100000000) * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

const Point = staticModel({ data: { x: f.number(0).indexed() } });
const result = scoped(scope(), () => {
  const points = collection(Point);
  const input = shuffled(n, 0x51a7e);
  const rows = points.add(input.map(x => ({ id: `point-${x}`, x })));
  const expected = new Map(rows.map(row => [row.x.value, row]));
  const identity = new Map(rows.map(row => [row, row.x.value]));
  const targets = shuffled(n, 0xc017ec7).slice(0, searches);
  assert.equal(new Set(targets).size, searches);

  const query = (x: number) => collection(Point).where(Point.x.eq(x)).first;
  const linear = (x: number) => {
    for (const row of rows) {
      if (row.x.value === x) return row;
    }
    return null;
  };
  const methods = { query, linear };

  // Verify exact instance identity independently of the timed loops.
  // The query and the loop share the very same model instances.
  for (const x of targets) {
    assert.equal(query(x), expected.get(x));
    assert.equal(linear(x), expected.get(x));
  }
  for (const missing of [-1, n]) {
    assert.equal(query(missing), null);
    assert.equal(linear(missing), null);
  }

  // Warm both functions and the collection's index. The timed target values
  // still change on every call, so the single-slot result memo cannot hit.
  const warmTargets = shuffled(n, 0xa11ce).slice(0, Math.min(200, n));
  for (const x of warmTargets) { query(x); linear(x); }
  const order = round % 2 ? ['query', 'linear'] as const : ['linear', 'query'] as const;
  const timings: Record<string, number> = {};
  const checksumExpected = targets.reduce((sum, x) => sum + x, 0);
  const checksums: Record<string, number> = {};
  for (const method of order) {
    query(-1); // The first timed query cannot reuse the last warmup result.
    for (let i = 0; i < 3; i++) global.gc!();
    let checksum = 0;
    const start = performance.now();
    for (const x of targets) checksum += identity.get(methods[method](x)!)!;
    timings[method] = performance.now() - start;
    checksums[method] = checksum;
    assert.equal(checksum, checksumExpected);
  }
  const position = new Map(input.map((x, i) => [x, i + 1]));
  return {
    n, searches, round, order, timings, checksums, checksumExpected,
    uniqueTargets: new Set(targets).size,
    averageLinearCandidates: targets.reduce((sum, x) => sum + position.get(x)!, 0) / searches,
    verifiedExactInstances: true,
  };
});
console.log(JSON.stringify(result));
