# Environment setup

Use Node.js 24 to create a Vite project and install Virentia UI from npm.

```sh
mkdir virentia-ui-app
cd virentia-ui-app
npm init -y
npm pkg set type=module scripts.dev=vite 'scripts.build=vite build'
npm install @virentia/ui@0.1 @virentia/core@0.12.0 @sinclair/typebox@0.34.52
npm install -D vite@8 typescript@6
mkdir src
```

The example uses `staticModel` from Core, which needs `@sinclair/typebox`.

## Configure JSX

In `tsconfig.json`, point the JSX transform to Virentia UI.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "@virentia/ui"
  },
  "include": ["src"]
}
```

Create `vite.config.ts` with the Virentia UI plugin.

```ts
import { defineConfig } from "vite";
import virentiaUI from "@virentia/ui/vite";

export default defineConfig({
  plugins: [virentiaUI({ sid: false })],
});
```

This client-side app uses `sid: false`. For server rendering, see how to [configure stable IDs](./api/compiler).

## Mount a counter

Create `index.html` in the project root.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Virentia UI counter</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`.

```tsx
import { f, staticModel } from "@virentia/core/models";
import { action, component, render, scope } from "@virentia/ui";

const CounterModel = staticModel({
  name: "Counter",
  data: { count: f.number(0) },
  setup(self) {
    return {
      increment: action(() => {
        self.count.value += 1;
      }),
    };
  },
});

const Counter = component({
  model: CounterModel,
  view: (_props, self) => (
    <button type="button" onClick={self.model.increment}>
      Count: {self.model.count}
    </button>
  ),
});

const appScope = scope();
render(() => <Counter />, document.getElementById("app")!, { scope: appScope });
```

`component` connects the model to a view, and `render` mounts it in the application scope. Passing the `count` store to JSX keeps the text bound to the store. The `increment` action writes the next value on each click.

Run `npm run dev` and open the address Vite prints. The button starts at `Count: 0` and increments on each click. Run `npm run build` to write the production build to `dist/`.

In plain JavaScript you can use `h(type, props, ...children)` from `@virentia/ui` with the same reactive bindings.

## Tutorial example

To run the finished tutorial from source, place the `documentation` and `virentia` repositories next to each other. In the documentation checkout, with dependencies installed, run the following command.

```sh
node scripts/dev-ui-course.mjs
```

Open the address printed in the terminal to try the last chapter's example with two counters and list controls. Set `VIRENTIA_SOURCE_ROOT` if your source checkout is elsewhere.

To build it step by step, start with [your first component](./learn/first-app).
