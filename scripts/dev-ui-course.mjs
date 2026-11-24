import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(process.env.VIRENTIA_SOURCE_ROOT ?? path.join(repository, "../virentia"));
if (!fs.existsSync(path.join(source, "packages/ui/lib/index.ts"))) {
  throw new Error("Put the Virentia checkout beside documentation, or set VIRENTIA_SOURCE_ROOT.");
}
const require = createRequire(import.meta.url);
const viteRoot = path.dirname(require.resolve("vite/package.json", {
  paths: [path.dirname(require.resolve("vitepress"))],
}));
const { build, createServer } = await import(pathToFileURL(path.join(viteRoot, "dist/node/index.js")).href);
const alias = {
  "@virentia/core/internal": path.join(source, "packages/core/lib/internal.ts"),
  "@virentia/core/models": path.join(source, "packages/core/lib/models.ts"),
  "@virentia/core": path.join(source, "packages/core/lib/index.ts"),
  "@virentia/ui/jsx-runtime": path.join(source, "packages/ui/lib/jsx-runtime.ts"),
  "@virentia/ui/jsx-dev-runtime": path.join(source, "packages/ui/lib/jsx-dev-runtime.ts"),
  "@virentia/ui": path.join(source, "packages/ui/lib/index.ts"),
};
const options = {
  configFile: false,
  root: path.join(repository, "docs/ui/examples/course"),
  resolve: { alias },
  esbuild: { jsx: "automatic", jsxImportSource: "@virentia/ui" },
  server: {
    host: "127.0.0.1",
    port: 4191,
    strictPort: true,
    fs: { allow: [repository, source] },
  },
  build: {
    outDir: path.join(repository, "docs/.vitepress/cache/ui-course"),
    emptyOutDir: true,
  },
};
if (process.argv.includes("--build")) {
  await build(options);
} else {
  const server = await createServer(options);
  await server.listen();
  server.printUrls();
}
