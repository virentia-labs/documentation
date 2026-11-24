import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const commit = 'e5743a89e4cb8b9cdad41f2d7bc1f78714fc8c81';
if (!process.argv[2]) throw Error('Usage: node benchmarks/run-virentia-query-search.mjs /path/to/virentia [output.json] [--pilot]');
const repo = path.resolve(process.argv[2]);
const pilot = process.argv.includes('--pilot');
const requireRepo = createRequire(path.join(repo, 'package.json'));
const esbuild = requireRepo(requireRepo.resolve('esbuild', { paths: [requireRepo.resolve('vitest/package.json')] }));
const buildDir = mkdtempSync(path.join(os.tmpdir(), 'virentia-query-search-'));
const archive = spawnSync('git', ['archive', commit, 'packages/core/lib'], { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
if (archive.status !== 0) throw Error(archive.stderr.toString());
const unpack = spawnSync('tar', ['-x', '-C', buildDir], { input: archive.stdout });
if (unpack.status !== 0) throw Error(unpack.stderr.toString());
const outfile = path.join(buildDir, 'query-harness.mjs');
const harnessPath = fileURLToPath(new URL('./virentia-query-search.harness.ts', import.meta.url));
esbuild.buildSync({
  entryPoints: [harnessPath], outfile, bundle: true, platform: 'node', format: 'esm', target: 'node22',
  nodePaths: [path.join(repo, 'packages/core/node_modules'), path.join(repo, 'node_modules')],
  alias: {
    '@virentia/core': path.join(buildDir, 'packages/core/lib/index.ts'),
    '@virentia/core/models': path.join(buildDir, 'packages/core/lib/models.ts'),
  },
});
const samples = [];
for (let round = 0; round < (pilot ? 1 : 5); round++) {
  const child = spawnSync(process.execPath, ['--expose-gc', outfile, '10000', String(pilot ? 100 : 1000), String(round)], { encoding: 'utf8' });
  if (child.status !== 0) throw Error(child.stderr + child.stdout);
  const sample = JSON.parse(child.stdout.trim());
  samples.push(sample);
  console.log(JSON.stringify(sample));
}
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const linearMs = median(samples.map(sample => sample.timings.linear));
const queryMs = median(samples.map(sample => sample.timings.query));
const report = {
  measuredAt: new Date().toISOString(), commit, source: 'git archive; working-tree changes are excluded', pilot,
  environment: {
    node: process.version, v8: process.versions.v8, platform: process.platform, arch: process.arch,
    os: os.release(), cpu: os.cpus()[0].model, cpuCount: os.cpus().length,
    esbuild: esbuild.version,
    typebox: JSON.parse(readFileSync(path.join(repo, 'packages/core/node_modules/@sinclair/typebox/package.json'), 'utf8')).version,
  },
  workload: {
    n: 10000, searches: samples[0].searches, processes: samples.length,
    model: 'staticModel Point: one x field with an eq index',
    query: 'collection(Point).where(Point.x.eq(x)).first',
    linear: 'for (const row of rows) if (row.x.value === x) return row; return null',
    data: 'unique x values 0..9999; insertion order is a deterministic shuffle',
    targets: 'deterministic shuffled unique values; every timed search changes x; all searches have one match',
    excluded: 'declaration, creation, index maintenance during insertion, validation and warmup',
    included: 'building the descriptor chain, resolving the query and consuming the returned instance',
    caveat: 'The eq implementation still filters state.order by its hash bucket; no O(1) guarantee for the full search. No writes or UI subscribers in the timed loops.',
  },
  provenance: {
    archiveSha256: createHash('sha256').update(archive.stdout).digest('hex'),
    harnessSha256: createHash('sha256').update(readFileSync(harnessPath)).digest('hex'),
    bundleSha256: createHash('sha256').update(readFileSync(outfile)).digest('hex'),
  },
  medians: { linearMs, queryMs, speedup: linearMs / queryMs }, samples,
};
const outputArg = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'virentia-query-search-results.json';
const output = path.resolve(outputArg);
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, medians: report.medians }));
