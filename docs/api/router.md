---
title: "@virentia/router"
---

# @virentia/router

This is the contract reference for the Virentia Router packages. Conceptual
pages and examples live in [Router](/router/).

## Packages

```ts
import {
  compile,
  convertPath,
  type Builder,
  type ParseUrlParams,
  type Parser,
  type ValidatePath,
} from "@virentia/router-paths";

import {
  chainRoute,
  route,
  router,
  routerControls,
  virtualRoute,
  group,
  historyAdapter,
  is,
  queryAdapter,
  trackQueryFactory,
  type RouteConfig,
  type CreateRouterConfig,
  type HistoryLike,
  type NavigatePayload,
  type PathlessRoute,
  type PathRoute,
  type Query,
  type QueryTracker,
  type QueryTrackerConfig,
  type Route,
  type RouteBeforeOpen,
  type RouteOpenedPayload,
  type Router,
  type RouterAdapter,
  type RouterControls,
  type RouterLocation,
  type VirtualRoute,
} from "@virentia/router";

import {
  lazyRouteView,
  routeView,
  routeViewGroup,
  routesView,
  Link,
  Outlet,
  RouterProvider,
  useIsOpened,
  useLink,
  useOpenedViews,
  useRouter,
  withLayout,
  type CreateLazyRouteViewProps,
  type CreateRouteViewGroupProps,
  type CreateRouteViewProps,
  type CreateRoutesViewProps,
  type LayoutComponent,
  type LinkProps,
  type RouteView,
  type RouteViewGroup,
} from "@virentia/router-react";
```

## Path templates

`@virentia/router-paths` compiles typed path templates into a builder and a
parser.

```ts
function compile<T extends string, Params = ParseUrlParams<T>>(
  path: T,
): {
  build: Builder<Params>;
  parse: Parser<Params>;
};

type Builder<T> = [T] extends [void]
  ? (params?: T) => string
  : (params: T) => string;

type Parser<T> = (path: string) => { path: string; params: T } | null;

type ParseUrlParams<T extends string> = /* derived from template */;
type ValidatePath<Path> = /* compile-time template validation */;
```

Template parameters support required, optional and array values:

```ts
type Params = ParseUrlParams<"/users/:id/posts/:slug?">;
// { id: string; slug?: string }

type NumericParams = ParseUrlParams<"/orders/:id<number>">;
// { id: number }

type UnionParams = ParseUrlParams<"/:tab<overview|settings>">;
// { tab: "overview" | "settings" }
```

`convertPath` converts known external template formats into Virentia path
templates.

```ts
function convertPath(path: string, mode: "express"): string;
```

## Routes

`route` creates either a path route or a pathless route. Path routes infer
their parameter type from the template.

```ts
function route<
  Path extends string,
  Params extends object | void = ParseUrlParams<Path>,
>(config: RouteConfig<Path>): PathRoute<Params>;

function route<Params extends object | void = void>(
  config?: {
    parent?: Route<any>;
    beforeOpen?: RouteBeforeOpen<any>[];
  },
): PathlessRoute<Params>;
```

```ts
type Route<Params extends object | void = void> =
  | PathRoute<Params>
  | PathlessRoute<Params>;

interface PathRoute<Params extends object | void = void>
  extends PathlessRoute<Params> {
  readonly "@@type": "path-route";
  readonly path: string;
}

interface PathlessRoute<Params extends object | void = void> {
  readonly "@@type": "pathless-route";
  readonly params: StoreWritable<Params>;
  readonly isOpened: StoreWritable<boolean>;
  readonly isPending: Store<boolean>;

  readonly open: EventCallable<RouteOpenedPayload<Params>>;
  readonly opened: Event<InternalOpenedPayload<Params>>;
  readonly openedOnServer: Event<InternalOpenedPayload<Params>>;
  readonly openedOnClient: Event<InternalOpenedPayload<Params>>;
  readonly closed: Event<void>;

  readonly parent?: PathRoute<any> | PathlessRoute<any>;
  readonly beforeOpen?: RouteBeforeOpen<any>[];
}
```

`RouteOpenedPayload` is the public payload accepted by `route.open`.

```ts
type Query = Record<string, string | null | Array<string | null>>;

interface OpenPayloadBase {
  query?: Query;
  replace?: boolean;
}

type RouteOpenedPayload<Params> = [Params] extends [void]
  ? void | OpenPayloadBase
  : { params: Params } & OpenPayloadBase;
```

`beforeOpen` handlers receive the normalized opening payload, including route
parameters and query data.

```ts
type RouteBeforeOpen<Params extends object | void = void> =
  | EventCallable<InternalOpenedPayload<Params>>
  | Effect<InternalOpenedPayload<Params>, any, any>
  | ((payload: InternalOpenedPayload<Params>) => unknown | PromiseLike<unknown>);
```

## Router

`router` maps routes to path templates and connects them to router
controls.

```ts
function router(config: CreateRouterConfig): Router;

interface CreateRouterConfig {
  base?: string;
  routes: InputRoute[];
  controls?: RouterControls;
}

type InputRoute =
  | PathRoute<any>
  | { path: string; route: PathlessRoute<any> }
  | Router;
```

```ts
interface Router {
  readonly "@@type": "router";

  readonly query: Store<Query>;
  readonly path: Store<string>;
  readonly history: Store<RouterAdapter | null>;
  readonly activeRoutes: Store<Route<any>[]>;

  readonly back: EventCallable<void>;
  readonly forward: EventCallable<void>;
  readonly navigate: EventCallable<NavigatePayload>;
  readonly setHistory: EventCallable<RouterAdapter>;
  readonly dispose: EventCallable<void>;

  readonly ownRoutes: MappedRoute[];
  readonly knownRoutes: MappedRoute[];

  registerRoute(route: InputRoute): void;
  trackQuery<Parameters>(config: QueryTrackerConfig<Parameters>): QueryTracker<Parameters>;
}
```

Navigation updates the current path and query through the configured history
adapter.

```ts
interface NavigatePayload {
  path?: string;
  query?: Query;
  replace?: boolean;
}
```

## Router controls

`routerControls` exposes the lower-level units used by `router`.
They are useful when one history source is shared by several routers.

```ts
function routerControls(): RouterControls;

interface RouterControls {
  readonly history: Store<RouterAdapter | null>;
  readonly locationState: StoreWritable<LocationState>;
  readonly query: Store<Query>;
  readonly path: Store<string>;

  readonly setHistory: EventCallable<RouterAdapter>;
  readonly navigate: EventCallable<NavigatePayload>;
  readonly back: EventCallable<void>;
  readonly forward: EventCallable<void>;
  readonly dispose: EventCallable<void>;
  readonly locationUpdated: EventCallable<LocationState>;

  trackQuery<Parameters>(
    config: Omit<QueryTrackerConfig<Parameters>, "forRoutes">,
  ): QueryTracker<Parameters>;
}
```

## History adapters

Router does not create history instances. It accepts an object matching
`HistoryLike` and wraps it into `RouterAdapter`.

```ts
function historyAdapter(history: HistoryLike): RouterAdapter;
function queryAdapter(history: HistoryLike): RouterAdapter;

interface HistoryLike {
  readonly location: RouterLocation;
  push(to: To): void;
  replace(to: To): void;
  back(): void;
  forward(): void;
  listen(
    listener: (update: { location: RouterLocation }) => void,
  ): (() => void) | RouterSubscription;
}

interface RouterAdapter {
  readonly location: RouterLocation;
  push(to: To): void;
  replace(to: To): void;
  goBack(): void;
  goForward(): void;
  listen(callback: (location: RouterLocation) => void): RouterSubscription;
}

interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

type To = string | Partial<RouterLocation>;
```

`historyAdapter` keeps the path in `location.pathname`. `queryAdapter` stores
the router path inside the query string and leaves the browser pathname under
the outer application.

## Query tracking

`trackQuery` turns query parameters into an entered/exited flow. The schema only
needs a `safeParse` method.

```ts
interface QuerySchema<Parameters> {
  safeParse(value: Query):
    | { success: true; data: Parameters }
    | { success: false };
}

interface QueryTrackerConfig<Parameters> {
  forRoutes?: Route<any>[];
  check?: EventCallable<void> | Event<void>;
  parameters: QuerySchema<Parameters>;
}

interface QueryTracker<Parameters> {
  readonly entered: Event<Parameters>;
  readonly exited: Event<void>;
  readonly enteredExternally: Event<Parameters>;
  readonly enteredProgrammatically: Event<Parameters>;
  readonly exitedExternally: Event<void>;
  readonly exitedProgrammatically: Event<void>;
  readonly enter: EventCallable<Parameters>;
  readonly exit: EventCallable<{ ignoreParams: string[] } | void>;
}
```

Without `check`, the tracker reacts to query and active route changes. With
`check`, query parsing runs only on that unit and while the tracker is already
entered.

## Virtual and chained routes

Virtual routes model derived route state without a path template.

```ts
function virtualRoute<T = void, TransformerResult = void>(
  options?: {
    isPending?: Store<boolean>;
    transformer?: (payload: T) => TransformerResult;
  },
): VirtualRoute<T, TransformerResult>;

interface VirtualRoute<T, Params> {
  readonly "@@type": "pathless-route";
  readonly params: StoreWritable<Params>;
  readonly isOpened: StoreWritable<boolean>;
  readonly isPending: Store<boolean>;

  readonly open: EventCallable<T>;
  readonly opened: Event<T>;
  readonly openedOnServer: Event<T>;
  readonly openedOnClient: Event<T>;

  readonly close: EventCallable<void>;
  readonly closed: Event<void>;
  readonly cancelled: EventCallable<void>;
}
```

`chainRoute` waits for guards, effects or asynchronous preparation before the
derived route can be opened from `openOn`.

```ts
function chainRoute<Params extends object | void = void>(props: {
  route: Route<Params> | VirtualRoute<RouteOpenedPayload<Params>, Params>;
  beforeOpen:
    | BeforeOpenUnit<Params>
    | BeforeOpenUnit<Params>[];
  openOn?: UnitList<any>;
  cancelOn?: UnitList<any>;
}): VirtualRoute<RouteOpenedPayload<Params>, Params>;
```

`group` creates a virtual route that is opened while at least one input route is
opened and pending while at least one input route is pending.

```ts
function group(routes: Array<Route<any> | VirtualRoute<any, any>>): VirtualRoute<void, void>;
```

Lazy React views register their dynamic import as a route preloader. The route
waits for registered preloaders before `beforeOpen` and activation finish.

```ts
type AsyncBundleImport = () => Promise<{ default: unknown }>;
type RoutePreloader = () => Promise<unknown> | unknown;
```

## Type guards

```ts
const is: {
  route<Params extends object | void = void>(input: unknown): input is Route<Params>;
  pathRoute<Params extends object | void = void>(input: unknown): input is PathRoute<Params>;
  pathlessRoute<Params extends object | void = void>(input: unknown): input is PathlessRoute<Params>;
  router(input: unknown): input is Router;
};
```

## React bindings

`RouterProvider` puts a router into React context and optionally attaches a
history adapter on mount.

```tsx
function RouterProvider(props: {
  router: Router;
  history?: RouterAdapter;
  children?: ReactNode;
}): ReactNode;
```

Views describe which component belongs to which route.

```ts
function routeView<Params extends object | void = void>(
  props: CreateRouteViewProps<Params>,
): RouteView;

function lazyRouteView<Params extends object | void = void>(
  props: CreateLazyRouteViewProps<Params>,
): RouteView;

function routesView(props: CreateRoutesViewProps): ComponentType;

function routeViewGroup(props: CreateRouteViewGroupProps): RouteViewGroup;

interface CreateRouteViewProps<Params extends object | void = void> {
  route: Route<Params> | Router | VirtualRoute<any, any>;
  view: ComponentType;
  layout?: LayoutComponent;
  children?: RouteView[];
}

interface CreateLazyRouteViewProps<Params extends object | void = void>
  extends Omit<CreateRouteViewProps<Params>, "view"> {
  view: () => Promise<{ default: ComponentType }>;
  fallback?: ComponentType;
}

interface CreateRoutesViewProps {
  routes: (RouteView | RouteViewGroup)[];
  otherwise?: ComponentType;
  layout?: LayoutComponent;
}

// A set of route views sharing one layout. routesView keeps the shared layout
// mounted while any member is active and swaps only the inner view.
interface RouteViewGroup {
  route: VirtualRoute<any, any>;
  views: RouteView[];
  layout?: LayoutComponent;
}

interface CreateRouteViewGroupProps {
  views: RouteView[];
  layout?: LayoutComponent;
}
```

`Outlet` renders the deepest opened child view.

```tsx
function Outlet(): ReactNode;
```

Links and hooks expose route state to React components.

```tsx
function Link<Params extends object | void = void>(
  props: LinkProps<Params> & { ref?: ForwardedRef<HTMLAnchorElement> },
): ReactNode;

function useRouter(): Router;

function useIsOpened(
  route: Route<any> | Router | VirtualRoute<any, any>,
): boolean;

function useOpenedViews(routes: RouteView[]): RouteView[];

function useLink<Params extends object | void = void>(
  to: Route<Params>,
  params?: Params,
  query?: Query,
): {
  path: string;
  open: EventCallable<RouteOpenedPayload<Params>>;
};

function withLayout(
  layout: ComponentType<{ children: ReactNode }>,
  views: RouteView[],
): RouteView[];
```

