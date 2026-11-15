// Check the EN/RU package guides and execute the exact snippets they include.
// Uses built sibling packages; does not install, publish or run benchmarks.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";
import { createMarkdownRenderer, disposeMdItInstance } from "vitepress";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(repository, "docs");
const source = path.resolve(process.env.VIRENTIA_SOURCE_ROOT ?? path.join(repository, "../virentia"));
const siblings = path.dirname(source);
const samples = path.join(docs, "examples/packages");
const failures = new Set();
const read = file => fs.readFileSync(file, "utf8");
const fail = message => failures.add(message);
const filesIn = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? filesIn(file) : [file];
});
const guides = ["forms/models.md", "storage/models.md", "net/core/models.md", "router/core/models.md"];
const pages = [];
for (const section of ["forms", "storage", "net", "router"]) {
  const english = filesIn(path.join(docs, section)).filter(file => file.endsWith(".md"));
  const russian = filesIn(path.join(docs, "ru", section)).filter(file => file.endsWith(".md"));
  const relative = (files, root) => new Set(files.map(file => path.relative(root, file)));
  const en = relative(english, path.join(docs, section));
  const ru = relative(russian, path.join(docs, "ru", section));
  for (const name of en) if (!ru.has(name)) fail(`Missing RU page: ${section}/${name}`);
  for (const name of ru) if (!en.has(name)) fail(`Missing EN page: ${section}/${name}`);
  pages.push(...english, ...russian);
}

const includes = text => [...text.matchAll(/^<<<\s+@\/examples\/packages\/(\S+)/gm)].map(match => match[1]);
const allIncludes = new Set();
const navigation = read(path.join(docs, ".vitepress/navigation.ts"));
for (const guide of guides) {
  const en = path.join(docs, guide), ru = path.join(docs, "ru", guide);
  if (!fs.existsSync(en) || !fs.existsSync(ru)) { fail(`Missing model guide pair: ${guide}`); continue; }
  const english = includes(read(en)), russian = includes(read(ru));
  if (JSON.stringify(english) !== JSON.stringify(russian)) fail(`Snippet drift between EN/RU: ${guide}`);
  if (!english.length) fail(`No maintained example in ${guide}`);
  for (const url of ["/" + guide.replace(/\.md$/, ""), "/ru/" + guide.replace(/\.md$/, "")])
    if (!navigation.includes(`"${url}"`)) fail(`Missing navigation entry: ${url}`);
  for (const entry of english) {
    allIncludes.add(entry);
    const [file, region] = entry.split("#");
    const target = path.join(samples, file);
    if (!fs.existsSync(target)) { fail(`Missing included sample: ${entry}`); continue; }
    if (region && !read(target).includes(`// #region ${region}\n`)) fail(`Missing snippet region: ${entry}`);
  }
}
for (const file of filesIn(samples).filter(file => file.endsWith(".ts") && !file.endsWith(".test.ts"))) {
  for (const match of read(file).matchAll(/^\/\/ #region (\S+)$/gm))
    if (!allIncludes.has(`${path.basename(file)}#${match[1]}`)) fail(`Unpublished example region: ${path.basename(file)}#${match[1]}`);
}
for (const token of ["fieldModel", "arrayFieldModel", "shapeFieldModel", "children", "refs", ".static()"])
  for (const prefix of ["", "ru/"])
    if (!read(path.join(docs, prefix, "forms/models.md")).includes(token)) fail(`Missing ${token} in ${prefix}forms/models.md`);
console.log(`Package guides: ${pages.length} EN/RU pages; ${guides.length} model guide pairs; shared snippet regions checked`);

let markdown;
try {
  markdown = await createMarkdownRenderer(docs);
  const parsed = new Map();
  function page(file) {
    if (parsed.has(file)) return parsed.get(file);
    const result = { anchors: new Set(), links: [] };
    const contents = read(file).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const tokens = markdown.parse(contents, { path: file, relativePath: path.relative(docs, file) });
    function visit(tokens) {
      for (const token of tokens) {
        const id = token.attrGet?.("id");
        if (id) result.anchors.add(id);
        if (token.type === "link_open") result.links.push(token.attrGet("href"));
        if (token.children) visit(token.children);
      }
    }
    visit(tokens); parsed.set(file, result); return result;
  }
  let count = 0;
  for (const from of pages) for (const link of page(from).links) {
    if (!link || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link)) continue;
    const [rawPath, rawHash] = link.split("#", 2);
    const pathname = decodeURIComponent(rawPath.split("?", 1)[0]);
    const destination = (!pathname ? from : pathname.startsWith("/")
      ? path.join(docs, pathname.slice(1)) : path.resolve(path.dirname(from), pathname)).replace(/\.html$/, ".md");
    const candidates = [destination, `${destination}.md`, path.join(destination, "index.md")];
    if (pathname.startsWith("/")) candidates.push(path.join(docs, "public", pathname.slice(1)));
    const target = candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    count++;
    if (!target) fail(`${path.relative(docs, from)}: missing link ${link}`);
    else if (rawHash && target.endsWith(".md") && !page(target).anchors.has(decodeURIComponent(rawHash)))
      fail(`${path.relative(docs, from)}: missing anchor ${link}`);
  }
  console.log(`Links: ${count} local package-guide links checked, including anchors`);
} catch (error) { fail(String(error.stack ?? error)); }
finally { disposeMdItInstance(); }

// Resolve public subpaths through their manifests, including @virentia/forms/models.
// Emit to ecosystem/node_modules so Node uses the same local linked dependencies
// as the integration suite; every generated file is removed in finally.
let output;
try {
  const paths = {};
  for (const name of ["virentia", "forms", "storage", "net", "router"]) {
    const packages = path.join(name === "virentia" ? source : path.join(siblings, name), "packages");
    for (const entry of fs.readdirSync(packages, { withFileTypes: true })) {
      const root = path.join(packages, entry.name), manifest = path.join(root, "package.json");
      if (!entry.isDirectory() || !fs.existsSync(manifest)) continue;
      const pkg = JSON.parse(read(manifest));
      for (const [subpath, definition] of Object.entries(pkg.exports ?? {})) {
        if (typeof definition?.types !== "string" || subpath.includes("*")) continue;
        paths[pkg.name + (subpath === "." ? "" : subpath.slice(1))] = [path.join(root, definition.types)];
      }
    }
  }
  for (const name of ["@virentia/core", "@virentia/core/models", "@virentia/forms", "@virentia/forms/models", "@virentia/storage-core", "@virentia/net-core", "@virentia/router"])
    if (!paths[name]?.every(file => fs.existsSync(file))) throw Error(`Build sibling packages first; missing public types for ${name}`);
  const cache = path.join(source, "ecosystem/node_modules/.cache");
  fs.mkdirSync(cache, { recursive: true });
  output = fs.mkdtempSync(path.join(cache, "package-docs-"));
  fs.writeFileSync(path.join(output, "package.json"), '{"type":"module"}\n');
  const sourceRequire = createRequire(fs.realpathSync(path.join(source, "node_modules/vitest/package.json")));
  const nodeTypes = path.dirname(sourceRequire.resolve("@types/node/package.json"));
  const options = {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true, noUncheckedIndexedAccess: true, skipLibCheck: true,
    esModuleInterop: true, paths, typeRoots: [path.dirname(nodeTypes)],
    types: ["node"], rootDir: samples, outDir: output, noEmitOnError: true,
  };
  const host = ts.createCompilerHost(options);
  const cacheResolution = ts.createModuleResolutionCache(repository, file => file, options);
  const fallback = path.join(source, "ecosystem/__documentation_examples__.ts");
  host.resolveModuleNames = (names, from) => names.map(name =>
    ts.resolveModuleName(name, from, options, host, cacheResolution).resolvedModule ??
    (!name.startsWith(".") && !path.isAbsolute(name)
      ? ts.resolveModuleName(name, fallback, options, host, cacheResolution).resolvedModule : undefined));
  const sourceFiles = filesIn(samples).filter(file => file.endsWith(".ts"));
  const program = ts.createProgram(sourceFiles, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => repository, getCanonicalFileName: file => file, getNewLine: () => os.EOL,
  }));
  const emitted = program.emit();
  if (emitted.emitSkipped) throw Error("Documentation example emit was skipped");
  console.log(`TypeScript: ${sourceFiles.length} example/test files compiled against built public package exports`);
  const run = spawnSync(process.execPath, ["--test", "--test-concurrency=1", path.join(output, "examples.test.js")], {
    cwd: path.join(source, "ecosystem"), stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "" },
  });
  if (run.error || run.status !== 0) throw run.error ?? Error(`Example tests failed (${run.status ?? run.signal})`);
} catch (error) { fail(String(error.stack ?? error)); }
finally { if (output) fs.rmSync(output, { recursive: true, force: true }); }

if (failures.size) {
  console.error(`\nPackage documentation checks failed (${failures.size}):\n${[...failures].join("\n")}`);
  process.exitCode = 1;
} else console.log("\nPackage documentation checks passed.");
