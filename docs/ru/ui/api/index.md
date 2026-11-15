# Справочник API

Здесь описан публичный API @virentia/ui: входные данные, возвращаемые значения и ответственность каждой части. Если вы знакомитесь с библиотекой, сначала пройдите [учебник](../learn/).

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

`jsxFromTemplate`, `jsxMember` и `jsxTemplate` — внутренние функции, которые вызывает существующая Vite-интеграция. В коде приложения используются JSX или `h`; эти экспорты перечислены для соответствия runtime entrypoint.

Модели и контейнеры импортируются из `@virentia/core/models`, mutableStore — из `@virentia/mutable`.

Для знакомства с библиотекой начните с [учебника](../learn/). Практические задачи разобраны в [руководствах](../guides/).
