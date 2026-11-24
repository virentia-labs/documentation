import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw Error('Usage: node benchmarks/run-virentia-models.mjs /absolute/path/to/virentia [output.json]');
const requireRepo = createRequire(path.join(repo, 'package.json'));
const esbuild = requireRepo(requireRepo.resolve('esbuild', { paths: [requireRepo.resolve('vitest/package.json')] }));
const runGit = (...args) => {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw Error(r.stderr);
  return r.stdout.trim();
};
const buildDir = mkdtempSync(path.join(os.tmpdir(), 'virentia-model-measurement-'));
const outfile = path.join(buildDir, 'model-harness.mjs');
esbuild.buildSync({
  entryPoints: [fileURLToPath(new URL('./virentia-models.harness.ts', import.meta.url))],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  alias: {
    '@virentia/core': path.join(repo, 'packages/core/lib/index.ts'),
    '@virentia/core/models': path.join(repo, 'packages/core/lib/models.ts'),
    '@virentia/research/inspector': path.join(repo, 'packages/core/lib/kernel/inspector.ts'),
  },
});
const samples = [];
const sample = (kind, n, mode, round) => {
  const r = spawnSync(process.execPath, ['--expose-gc', outfile, kind, String(n), mode], { encoding: 'utf8' });
  if (r.status !== 0) throw Error(r.stderr + r.stdout);
  const result = { round, ...JSON.parse(r.stdout.trim()) };
  samples.push(result);
  console.log(JSON.stringify(result));
};
for (const n of [1000, 10000]) {
  for (let round = 0; round < 5; round++) {
    const order = round % 2 ? ['staticModel', 'model'] : ['model', 'staticModel'];
    for (const kind of order) sample(kind, n, 'perf', round);
  }
}
// Instrumented counts are separate processes and never used as perf/heap samples.
for (const n of [1000, 10000]) for (const kind of ['model', 'staticModel']) sample(kind, n, 'counts');
const keys = ['defineMs', 'createMs', 'updateMs', 'disposeMs', 'createdDelta', 'activeDelta', 'disposedDelta'];
const medians = [];
for (const n of [1000, 10000]) for (const kind of ['model', 'staticModel']) {
  const group = samples.filter(s => s.n === n && s.kind === kind && s.mode === 'perf');
  medians.push({ n, kind, ...Object.fromEntries(keys.map(k => [k, group.map(s => s[k]).sort((a, b) => a - b)[2]])) });
}
const report = {
  measuredAt: new Date().toISOString(),
  commit: runGit('rev-parse', 'HEAD'),
  trackedChanges: runGit('diff', '--stat'),
  environment: { node: process.version, v8: process.versions.v8, platform: process.platform, arch: process.arch, os: os.release(), cpu: os.cpus()[0].model, cpuCount: os.cpus().length, totalMemory: os.totalmem() },
  medians,
  samples,
};
const output = path.resolve(process.argv[3] || 'virentia-models-results.json');
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, medians }, null, 2));
