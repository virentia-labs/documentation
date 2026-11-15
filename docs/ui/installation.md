# Environment setup

The tutorial uses TypeScript and JSX. Configure JSX in tsconfig.json:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@virentia/ui"
  }
}
```

UI is currently a private monorepo package. The example below uses the local Virentia checkout, not an npm installation.

## Tutorial example

Put the documentation and virentia repositories next to each other. From the documentation checkout, with dependencies installed, run:

```sh
node scripts/dev-ui-course.mjs
```

Open the address printed in the terminal. This is the finished seventh-chapter example: two counters and list controls. Set VIRENTIA_SOURCE_ROOT if your source checkout is elsewhere.

The tutorial builds that result gradually. Start with [your first component](./learn/first-app).

## Your own project

With Vite 8, use virentiaUI from @virentia/ui/vite:

```ts
export default defineConfig({
  plugins: [virentiaUI({ sid: false })],
});
```

Import defineConfig from vite. This enables the standard JSX transform. Configure the SSR [SID plugin separately](./api/compiler).

In plain JavaScript, use h(type, props, ...children) instead of JSX. Reactive bindings work the same way.
