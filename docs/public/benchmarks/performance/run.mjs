import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// The Virentia sources come from a commit of the repository (git archive). VIRENTIA_COMMIT replaces the
// pinned commit (any ref, e.g. HEAD); VIRENTIA_SOURCE_LABEL names a snapshot that is not a published commit.
const commit = process.env.VIRENTIA_COMMIT ?? 'fc3378e8313df7feea0bde2cd93fdbc2ceb92ae2';
const [mode, repoArg, outputArg] = process.argv.slice(2);
if (!['node', 'ui'].includes(mode) || !repoArg) throw Error('node run.mjs node|ui /path/to/virentia [report.json]');
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(repoArg);
const temp = mkdtempSync(path.join(os.tmpdir(), 'virentia-performance-'));
const source = path.join(temp, 'source'); mkdirSync(source);
const archive = spawnSync('git', ['archive', commit], { cwd: repo, maxBuffer: 64 * 1024 ** 2 });
if (archive.status !== 0) throw Error(archive.stderr.toString());
const unpack = spawnSync('tar', ['-x', '-C', source], { input: archive.stdout });
if (unpack.status !== 0) throw Error(unpack.stderr.toString());
const sha = data => createHash('sha256').update(data).digest('hex');
const dependencies = JSON.parse(readFileSync(path.join(root, 'package.json'))).dependencies;
const resolved = spawnSync('git', ['rev-parse', `${commit}^{commit}`], { cwd: repo, encoding: 'utf8' }).stdout.trim();
const metadata = {
  commit: resolved || commit, ...(process.env.VIRENTIA_SOURCE_LABEL ? { sourceLabel: process.env.VIRENTIA_SOURCE_LABEL } : {}),
  sourceArchiveSha256: sha(archive.stdout), dependencies,
  harnessSha256: sha(readFileSync(path.join(root, `${mode}.harness.ts`))),
  runnerSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
  environment: { node: process.version, v8: process.versions.v8, platform: process.platform,
    arch: process.arch, os: os.release(), cpu: os.cpus()[0].model, cpuCount: os.cpus().length,
    totalMemory: os.totalmem() },
};
const outfile = path.join(temp, mode === 'node' ? 'node-harness.mjs' : 'ui.js');
// The UI variants are built with their compilers, as their production setups do: Vue SFCs (3.5, and 3.6
// Vapor under the `vue-vapor` alias), Solid's JSX through babel-preset-solid, Virentia's JSX through its
// template compiler (oxc's parser from rolldown, as Vite 8 provides it).
const plugins = [];
if (mode === 'ui') {
  const { parse: sfcParse, compileScript } = await import('vue/compiler-sfc');
  const { parse: vaporParse, compileScript: vaporCompileScript } = await import('vue-vapor/compiler-sfc');
  const { transformAsync } = await import('@babel/core');
  const { parseSync } = await import('rolldown/utils');
  const compilerEntry = path.join(temp, 'templates-entry.mjs'), compilerOut = path.join(temp, 'templates.mjs');
  writeFileSync(compilerEntry, `export { addTemplateEdits } from ${JSON.stringify(path.join(source, 'packages/ui/compiler/templates.ts'))};\nexport { SourceEdits } from ${JSON.stringify(path.join(source, 'packages/core/compiler/edits.ts'))};\n`);
  await build({ entryPoints: [compilerEntry], outfile: compilerOut, bundle: true, format: 'esm', platform: 'node', logLevel: 'warning' });
  const { addTemplateEdits, SourceEdits } = await import(compilerOut);
  const vaporDir = /[/\\]ui[/\\]vue-vapor/;
  plugins.push({ name: 'vue-sfc', setup(b) {
    b.onLoad({ filter: /\.vue$/ }, async args => {
      const vapor = vaporDir.test(args.path);
      const { descriptor, errors } = (vapor ? vaporParse : sfcParse)(readFileSync(args.path, 'utf8'), { filename: args.path });
      if (errors.length) throw errors[0];
      const script = (vapor ? vaporCompileScript : compileScript)(descriptor, { id: path.basename(args.path).replace(/\W/g, ''),
        inlineTemplate: true, isProd: true, templateOptions: { compilerOptions: { hoistStatic: true, cacheHandlers: true } } });
      return { contents: script.content, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    // The Vapor variant runs on its own Vue 3.6 runtime.
    b.onResolve({ filter: /^vue$/ }, args => vaporDir.test(args.importer)
      ? { path: path.join(root, 'node_modules/vue-vapor/dist/vue.runtime.esm-bundler.js') } : undefined);
  } });
  plugins.push({ name: 'solid-jsx', setup(b) {
    b.onLoad({ filter: /[/\\]ui[/\\]solid\.tsx$/ }, async args => {
      const result = await transformAsync(readFileSync(args.path, 'utf8'), { filename: args.path,
        presets: [['babel-preset-solid', { generate: 'dom' }], ['@babel/preset-typescript', { isTSX: true, allExtensions: true }]] });
      return { contents: result.code, loader: 'js', resolveDir: path.dirname(args.path) };
    });
  } });
  plugins.push({ name: 'virentia-templates', setup(b) {
    b.onLoad({ filter: /[/\\]ui[/\\]virentia\.tsx$/ }, async args => {
      const text = readFileSync(args.path, 'utf8');
      const { program, errors } = parseSync(args.path, text, { lang: 'tsx', sourceType: 'module' });
      if (errors.length) throw Error(errors[0].message);
      const edits = new SourceEdits(text);
      addTemplateEdits(program, text, edits);
      return { contents: edits.apply(args.path).code, loader: 'tsx', resolveDir: path.dirname(args.path) };
    });
  } });
}
await build({ entryPoints: [path.join(root, `${mode}.harness.ts`)], outfile, bundle: true, plugins, jsx: 'automatic',
  platform: mode === 'node' ? 'node' : 'browser', format: 'esm', target: mode === 'node' ? 'node22' : 'es2022',
  minify: true, define: { 'process.env.NODE_ENV': '"production"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' },
  nodePaths: [path.join(root, 'node_modules')],
  alias: { '@virentia/core': path.join(source, 'packages/core/lib/index.ts'),
    '@virentia/core/models': path.join(source, 'packages/core/lib/models.ts'),
    '@virentia/core/internal': path.join(source, 'packages/core/lib/internal.ts'),
    '@virentia/ui/jsx-runtime': path.join(source, 'packages/ui/lib/jsx-runtime.ts'),
    '@virentia/ui': path.join(source, 'packages/ui/lib/index.ts'),
    '@virentia/benchmark/draft': path.join(source, 'packages/mutable/lib/draft.ts') },
});
metadata.bundleSha256 = sha(readFileSync(outfile));
const output = path.resolve(outputArg || (mode === 'ui' ? 'ui-results.json' : 'node-results.json'));
if (mode === 'node') {
  const samples = [];
  const cases = [ ['models', 'creation', ['virentia', 'mobx', 'reatom', 'effector-factory', 'virentia-records', 'effector', 'redux']],
    ['core', 'dispatch', ['virentia', 'effector', 'mobx', 'reatom', 'redux']],
    ...['1000', '5000', '50000'].map(touch => ['mutable', touch, ['virentia', 'immer', 'mutative']]) ];
  for (const [area, scenario, variants] of cases) {
    for (let round = 0; round < 5; round++) {
      const order = variants.map((_, index) => variants[(index + round) % variants.length]);
      for (const variant of order) {
        const processResult = spawnSync(process.execPath, ['--expose-gc', outfile, area, variant, scenario], { encoding: 'utf8', timeout: 120000 });
        if (processResult.status !== 0) throw Error(processResult.stderr + processResult.stdout);
        const sample = { round, ...JSON.parse(processResult.stdout.trim()) }; samples.push(sample);
        console.log(JSON.stringify(sample));
      }
    }
  }
  const keys = { models: ['createMs', 'createdHeapBytes'], core: ['dispatchMs'], mutable: ['perUpdateMs'] };
  const medians = cases.flatMap(([area, scenario, variants]) => variants.map(variant => {
    const group = samples.filter(sample => sample.area === area && sample.scenario === scenario && sample.variant === variant);
    return { area, scenario, variant, ...Object.fromEntries(keys[area].map(key => [key, group.map(sample => sample[key]).sort((a, b) => a - b)[2]])) };
  }));
  writeFileSync(output, JSON.stringify({ measuredAt: new Date().toISOString(), ...metadata, medians, samples }, null, 2) + '\n');
  console.log(JSON.stringify({ output, medians }, null, 2));
} else {
  const server = createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/results') {
      let body = ''; for await (const chunk of request) { body += chunk; if (body.length > 1024 ** 2) { response.writeHead(413).end(); return; } }
      const report = JSON.parse(body);
      writeFileSync(output, JSON.stringify({ ...metadata, ...report, hostEnvironment: metadata.environment }, null, 2) + '\n');
      response.writeHead(200).end('saved'); console.log(`Saved ${output}`); return;
    }
    if (request.url === '/ui.js') { response.setHeader('content-type', 'text/javascript'); response.end(readFileSync(outfile)); return; }
    if (request.url !== '/') { response.writeHead(404).end(); return; }
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end('<!doctype html><html lang="en"><title>Virentia UI benchmark</title><style>body{font:16px system-ui;margin:24px;background:#fff;color:#222}button{font:inherit;padding:12px}#host{height:400px;overflow:auto;contain:strict}table{border-collapse:collapse}td{width:120px;height:24px}pre{white-space:pre-wrap}</style><h1>Virentia UI / React / Vue / Vue Vapor / Solid / $mol / DOM</h1><p>Production builds with their compilers · 1,000 rows · 100 row-local updates × 25 batches · 14 rounds</p><button>Run benchmark</button><p id="status" role="status">Ready. Keep this tab foreground during the run.</p><div id="host"></div><pre id="results"></pre><script type="module" src="/ui.js"></script></html>');
  });
  server.listen(4186, '127.0.0.1', () => console.log('UI benchmark: http://127.0.0.1:4186/'));
}
