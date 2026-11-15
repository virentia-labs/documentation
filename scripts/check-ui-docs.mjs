/**
 * UI documentation drift checks against a local Virentia source checkout.
 * Default: this repository and ../virentia are siblings.
 * Override with VIRENTIA_SOURCE_ROOT=/absolute/path/to/virentia npm run check:ui.
 * Export coverage means inventory mentions, not proof of prose correctness.
 * Type checking covers docs/ui/examples, not every illustrative Markdown fence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { lightTheme, darkTheme } from "../docs/.vitepress/theme/syntax-themes.mjs";
import { createMarkdownRenderer, disposeMdItInstance } from "vitepress";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(repository, "docs");
const source = path.resolve(
  process.env.VIRENTIA_SOURCE_ROOT ?? path.join(repository, "../virentia"),
);
const failures = new Set();
const fail = (message) => failures.add(message);
const read = (file) => fs.readFileSync(file, "utf8");
const relative = (file) => path.relative(repository, file).split(path.sep).join("/");

function filesIn(directory, accept) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file, accept) : accept(file) ? [file] : [];
  });
}

const enRoot = path.join(docs, "ui");
const ruRoot = path.join(docs, "ru/ui");
const markdownFiles = (root) => filesIn(root, (file) => file.endsWith(".md")).sort();
const english = markdownFiles(enRoot);
const russian = markdownFiles(ruRoot);
const enNames = new Set(english.map((file) => path.relative(enRoot, file)));
const ruNames = new Set(russian.map((file) => path.relative(ruRoot, file)));
if (!english.length || !russian.length) fail("UI pages must exist in both EN and RU.");
for (const name of enNames) if (!ruNames.has(name)) fail(`Missing RU counterpart: ${name}`);
for (const name of ruNames) if (!enNames.has(name)) fail(`Missing EN counterpart: ${name}`);
console.log(`Page parity: ${english.length} EN / ${russian.length} RU Markdown pages`);

// The tutorial is a sequence, not every file whose historical URL starts in learn/.
const lessons = [
  ["first-app", "component"],
  ["state-and-props", "state"],
  ["events", "events"],
  ["derived", "derived"],
  ["props", "props"],
  ["conditions", "condition"],
  ["model-lists", "list"],
];
const walkthroughSource = read(path.join(docs, ".vitepress/theme/ui-walkthroughs.mjs"));
const walkthroughs = JSON.parse(walkthroughSource.slice(walkthroughSource.indexOf("=") + 1).trim().replace(/;$/, ""));
const compiledSteps = JSON.parse(read(path.join(docs, ".vitepress/theme/ui-walkthrough-tokens.json")));
for (const [kind, steps] of Object.entries(walkthroughs)) {
  for (const theme of [lightTheme.name, darkTheme.name]) {
    if (compiledSteps[kind]?.[theme]?.length !== steps.length)
      fail(`Stale Magic Move tokens: ${kind}/${theme}. Run the walkthrough builder.`);
  }
  for (const step of steps) {
    const ids = new Set(step.nodes.map((node) => node.id));
    if (ids.size !== step.nodes.length) fail(`Duplicate graph node in ${kind}`);
    for (const [a, b] of step.edges)
      if (!ids.has(a) || !ids.has(b)) fail(`Unknown graph endpoint in ${kind}: ${a} -> ${b}`);
  }
}
for (const root of [enRoot, ruRoot]) {
  const url = root === ruRoot ? "/ru/ui" : "/ui";
  for (const [index, [slug, kind]] of lessons.entries()) {
    const file = path.join(root, "learn", slug + ".md");
    if (!fs.existsSync(file)) { fail(`Missing lesson: ${relative(file)}`); continue; }
    const source = read(file);
    const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const next = index === lessons.length - 1
      ? url + "/guides/"
      : url + "/learn/" + lessons[index + 1][0];
    if (!front.includes("link: " + next)) fail(`Incorrect tutorial next link: ${relative(file)}`);
    const matches = [...source.matchAll(/<UIWalkthrough kind="([^"]+)"\s*\/>/g)];
    if (matches.length !== 1 || matches[0][1] !== kind)
      fail(`Lesson must have its own walkthrough: ${relative(file)}`);
    const prose = source.replace(/^---[\s\S]*?\n---/, "")
      .replace(/\x60{3}[^\n]*\n[\s\S]*?\x60{3}/g, "")
      .replace(/<UIWalkthrough[^>]*\/>/g, "");
    if (prose.split(/\s+/).filter(Boolean).length > 220)
      fail(`Lesson prose exceeds 220 words: ${relative(file)}`);
  }
}
console.log("Tutorial: 7 linked lessons per language; walkthrough tokens and graph endpoints checked");

// Read the literal tsdown entry map; never execute the source build configuration.
function sourceEntries(configFile) {
  const ast = ts.createSourceFile(configFile, read(configFile), ts.ScriptTarget.Latest, true);
  const entries = new Map();
  const nameOf = (node) =>
    node && (ts.isIdentifier(node) || ts.isStringLiteral(node)) ? node.text : undefined;
  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      nameOf(node.name) === "entry" &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) {
          throw new Error(
            "UI tsdown entry map is no longer a literal map; update the documentation checker.",
          );
        }
        const key = nameOf(property.name);
        if (!key) throw new Error("Cannot read a UI build entry name.");
        entries.set(key, path.resolve(path.dirname(configFile), property.initializer.text));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!entries.size) throw new Error("No UI source entrypoints found in tsdown.config.ts.");
  return entries;
}

function typeTarget(value) {
  if (typeof value === "string") return /\.d\.[cm]?ts$/.test(value) ? value : undefined;
  if (!value || typeof value !== "object") return undefined;
  if (typeof value.types === "string") return value.types;
  for (const condition of Object.values(value)) {
    const target = typeTarget(condition);
    if (target) return target;
  }
}

try {
  const manifestPath = path.join(source, "packages/ui/package.json");
  if (!fs.existsSync(manifestPath))
    throw new Error(
      `No Virentia source checkout at ${source}. Set VIRENTIA_SOURCE_ROOT to its absolute path.`,
    );
  const manifest = JSON.parse(read(manifestPath));
  const entries = sourceEntries(path.join(source, "packages/ui/tsdown.config.ts"));
  const publicEntries = [];
  for (const [subpath, definition] of Object.entries(manifest.exports)) {
    const target = typeTarget(definition);
    if (!target) {
      fail(`No type entry target for ${subpath}; update the source inventory mapping.`);
      continue;
    }
    const buildKey = target.replace(/^\.\/dist\//, "").replace(/\.d\.[cm]?ts$/, "");
    const file = entries.get(buildKey);
    if (!file || !fs.existsSync(file)) {
      fail(`Cannot map public entry ${subpath} (${target}) to its tsdown source.`);
      continue;
    }
    publicEntries.push({
      name: subpath === "." ? manifest.name : manifest.name + subpath.slice(1),
      file,
    });
  }

  const configPath = path.join(source, "tsconfig.json");
  const configuration = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configuration.error)
    throw new Error(ts.flattenDiagnosticMessageText(configuration.error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(configuration.config, ts.sys, source);
  if (parsed.errors.length)
    throw new Error(
      parsed.errors
        .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
        .join("\n"),
    );
  const options = {
    ...parsed.options,
    noEmit: true,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: "@virentia/ui",
    typeRoots: [
      path.join(source, "node_modules/@types"),
      path.join(source, "packages/ui/node_modules/@types"),
    ],
    paths: { ...parsed.options.paths },
  };
  // Includes @virentia/ui/vite, even if the main checkout has not added its alias.
  for (const entry of publicEntries) options.paths[entry.name] = [entry.file];
  const host = ts.createCompilerHost(options);
  const resolutionCache = ts.createModuleResolutionCache(source, (file) => file, options);
  const fallbackFile = path.join(source, "packages/ui/__documentation_examples__.tsx");
  host.resolveModuleNames = (names, containingFile) =>
    names.map((name) => {
      const resolved = ts.resolveModuleName(
        name,
        containingFile,
        options,
        host,
        resolutionCache,
      ).resolvedModule;
      if (resolved || name.startsWith(".") || path.isAbsolute(name)) return resolved;
      // Samples live in the docs checkout; use UI's peer dependencies for bare imports.
      return ts.resolveModuleName(name, fallbackFile, options, host, resolutionCache)
        .resolvedModule;
    });
  const samples = filesIn(path.join(enRoot, "examples"), (file) =>
    /\.[cm]?tsx?$/.test(file),
  ).sort();
  if (!samples.length) fail("No maintained TypeScript samples found in docs/ui/examples.");
  const program = ts.createProgram(
    [...publicEntries.map((entry) => entry.file), ...samples],
    options,
    host,
  );
  const checker = program.getTypeChecker();
  let exportCount = 0;
  for (const entry of publicEntries) {
    const module = program.getSourceFile(entry.file);
    const symbol = module && checker.getSymbolAtLocation(module);
    if (!symbol) {
      fail(`Could not inspect exports of ${entry.name}`);
      continue;
    }
    // TypeScript follows named re-exports AND export type *, including namespaces.
    const exports = checker
      .getExportsOfModule(symbol)
      .map((value) => value.name)
      .sort();
    exportCount += exports.length;
    for (const root of [enRoot, ruRoot]) {
      const inventoryFile = path.join(root, "api/index.md");
      if (!fs.existsSync(inventoryFile)) {
        fail(`Missing API inventory: ${relative(inventoryFile)}`);
        continue;
      }
      const rows = read(inventoryFile)
        .split("\n")
        .filter((line) => line.startsWith("|") && line.includes(`\`${entry.name}\``))
        .join("\n");
      if (!rows) fail(`${relative(inventoryFile)}: no inventory row for ${entry.name}`);
      for (const name of exports) {
        if (!rows.includes(`\`${name}\``))
          fail(
            `${relative(inventoryFile)}: ${entry.name} export ${name} is not listed in its inventory rows`,
          );
      }
    }
  }
  console.log(
    `Export inventory: ${exportCount} exports across ${publicEntries.length} entrypoints (mentions only)`,
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    fail(
      `TypeScript examples/source dependencies have ${diagnostics.length} diagnostics:\n` +
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCurrentDirectory: () => repository,
          getCanonicalFileName: (file) => file,
          getNewLine: () => "\n",
        }),
    );
  }
  console.log(
    `TypeScript: ${samples.length} maintained .ts/.tsx samples checked against source (not Markdown fences)`,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

// Use VitePress' own Markdown parser so anchors match the rendered site, including
// Russian headings, custom IDs, duplicate headings, and relative reference links.
let markdown;
try {
  markdown = await createMarkdownRenderer(docs);
  const parsedPages = new Map();
  function page(file) {
    if (parsedPages.has(file)) return parsedPages.get(file);
    const contents = read(file).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const environment = { path: file, relativePath: path.relative(docs, file) };
    const tokens = markdown.parse(contents, environment);
    const result = { anchors: new Set(), links: [] };
    function visit(tokens) {
      for (const token of tokens) {
        const id = token.attrGet?.("id");
        if (id) result.anchors.add(id);
        if (token.type === "link_open") result.links.push(token.attrGet("href"));
        if (token.type === "html_inline" || token.type === "html_block") {
          for (const match of token.content.matchAll(/\bid=["']([^"']+)["']/g))
            result.anchors.add(match[1]);
        }
        if (token.children) visit(token.children);
      }
    }
    visit(tokens);
    parsedPages.set(file, result);
    return result;
  }
  let linkCount = 0;
  for (const from of [...english, ...russian]) {
    for (const link of page(from).links) {
      if (!link || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(link)) continue;
      const [rawPath, rawHash] = link.split("#", 2);
      const pathname = decodeURIComponent(rawPath.split("?", 1)[0]);
      const anchor = rawHash ? decodeURIComponent(rawHash) : "";
      let destination = !pathname
        ? from
        : pathname.startsWith("/")
          ? path.join(docs, pathname.slice(1))
          : path.resolve(path.dirname(from), pathname);
      destination = destination.replace(/\.html$/, ".md");
      const candidates = [destination, `${destination}.md`, path.join(destination, "index.md")];
      if (pathname.startsWith("/")) candidates.push(path.join(docs, "public", pathname.slice(1)));
      const target = candidates.find(
        (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      linkCount++;
      if (!target) {
        fail(`${relative(from)}: missing link target ${link}`);
        continue;
      }
      if (anchor && target.endsWith(".md") && !page(target).anchors.has(anchor)) {
        fail(`${relative(from)}: missing anchor in ${link}`);
      }
    }
  }
  console.log(`Links: ${linkCount} local links from UI pages checked, including Markdown anchors`);
} catch (error) {
  fail(
    `Markdown/link validation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
} finally {
  disposeMdItInstance();
}

if (failures.size) {
  console.error(
    `\nUI documentation checks failed (${failures.size}):\n` +
      [...failures].map((message) => `- ${message}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nUI documentation checks passed. Prose accuracy and visual layout still require review.",
  );
}
