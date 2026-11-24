# API reference

Public input, return-value and behavior contracts for @virentia/ui. Start with the [learning chapters](../learn/) if you are new to the library.

| Import | Exports | Reference |
| --- | --- | --- |
| `@virentia/ui` | `render`, `hydrate`, `createElement`, `h`, `Fragment`, `mergeProps`, `RenderOptions` | [Rendering](./rendering) |
| `@virentia/ui` | `component`, `withRoot`, `ComponentConfig`, `ComponentOptions`, `ComponentInput`, `ModelProps`, `DefinedComponent`, `Component`, `ComponentSelf`, `ComponentProps`, `View` | [Components](./components) |
| `@virentia/ui` | `ui`, `ref`, `action`, `LifecycleEvent`, `Ref`, `RefUnit`, `NativeEvent`, `DOMEventUnit`, `EventHandler`, `EventHandlers` | [Refs/events](./refs-events) |
| `@virentia/ui` | `For`, `Portal`, `createContext`, `ForProps`, `ModelForProps`, `Context` | [Containers/context](./collections-context) |
| `@virentia/ui` | `store`, `reactive`, `computed`, `event`, `effect`, `reaction`, `scope`, `scoped` | [Core](./core) |
| `@virentia/ui` | `Readable`, `Binding`, `Child`, `ElementDescriptor`, `ForeignHostTag`, `CSSProperties`, `ClassList`, `DOMAttributes`, `HTMLAttributes`, `SVGAttributes`, `IntrinsicElements`, `JSX` | [Types](./types) |
| `@virentia/ui/server` | `renderToString`, `renderToStringAsync`, `renderToStaticMarkup`, `renderToStaticMarkupAsync`, `serializeState` | [Server/Start](./server-start) |
| `@virentia/ui/start` | `renderPage`, `renderPageAsync`, `hydratePage`, `renderDocument`, `PagePayload`, `RenderedPage`, `HydratedPage`, `DocumentOptions` | [Server/Start](./server-start) |
| `@virentia/ui/start/vite` | `default`, `StartOptions` | [Server/Start](./server-start) |
| `@virentia/ui/start/node` | `buildStart`, `createStartServer`, `serveStart`, `StartBuildOptions`, `StartServeOptions` | [Server/Start](./server-start) |
| `@virentia/ui/vite` | `default`, `ViteOptions` | [JSX/SID](./compiler) |
| `@virentia/ui/jsx-runtime` | `jsx`, `jsxs`, `Fragment`, `JSX`, `jsxFromTemplate`, `jsxMember`, `jsxTemplate` | [JSX/SID](./compiler) |
| `@virentia/ui/jsx-dev-runtime` | `jsxDEV`, `Fragment`, `JSX` | [JSX/SID](./compiler) |
| `@virentia/ui/react`, `@virentia/ui/react/server` | `asReact` | [Embedded](./interop) |
| `@virentia/ui/vue`, `@virentia/ui/vue/server` | `asVue` | [Embedded](./interop) |

`jsxFromTemplate`, `jsxMember` and `jsxTemplate` are internal targets emitted by the existing Vite integration. Application code uses JSX or `h`; these exports are listed to match the runtime entrypoint.

Import models and containers from `@virentia/core/models`, and mutableStore from `@virentia/mutable`.

Start with the [tutorial](../learn/) to learn the library. Find task-specific material in the [guides](../guides/).
