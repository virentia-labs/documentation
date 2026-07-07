---
title: "@virentia/router"
---

# @virentia/router

Это справочник по контрактам пакетов Virentia Router. Пояснения и примеры
собраны в разделе [Роутер](/ru/router/).

## Пакеты

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
  type CreateRouteViewProps,
  type CreateRoutesViewProps,
  type LinkProps,
  type RouteView,
} from "@virentia/router-react";
```

## Шаблоны путей

`@virentia/router-paths` превращает типизированный шаблон пути в сборщик и
разборщик.

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

type ParseUrlParams<T extends string> = /* выводится из шаблона */;
type ValidatePath<Path> = /* проверка шаблона на этапе типов */;
```

Параметры шаблона поддерживают обязательные, необязательные и массивные
значения:

```ts
type Params = ParseUrlParams<"/users/:id/posts/:slug?">;
// { id: string; slug?: string }

type NumericParams = ParseUrlParams<"/orders/:id<number>">;
// { id: number }

type UnionParams = ParseUrlParams<"/:tab<overview|settings>">;
// { tab: "overview" | "settings" }
```

`convertPath` переводит известные внешние форматы шаблонов в формат Virentia.

```ts
function convertPath(path: string, mode: "express"): string;
```

## Роуты

`route` создаёт роут с путём или роут без пути. Роуты с путём выводят
тип параметров из шаблона.

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

`RouteOpenedPayload` — публичная нагрузка, которую принимает `route.open`.

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

Обработчики `beforeOpen` получают нормализованную нагрузку открытия: параметры
роута и query-данные.

```ts
type RouteBeforeOpen<Params extends object | void = void> =
  | EventCallable<InternalOpenedPayload<Params>>
  | Effect<InternalOpenedPayload<Params>, any, any>
  | ((payload: InternalOpenedPayload<Params>) => unknown | PromiseLike<unknown>);
```

## Роутер

`router` связывает роуты с шаблонами путей и подключает их к контролам
роутера.

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

Навигация меняет текущий путь и query через подключённый адаптер history.

```ts
interface NavigatePayload {
  path?: string;
  query?: Query;
  replace?: boolean;
}
```

## Контролы роутера

`routerControls` отдаёт низкоуровневые юниты, на которых строится
`router`. Они полезны, когда один источник history нужен нескольким
роутерам.

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

## History-адаптеры

Роутер не создаёт экземпляры history. Он принимает объект, который совпадает с
`HistoryLike`, и оборачивает его в `RouterAdapter`.

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

`historyAdapter` хранит путь в `location.pathname`. `queryAdapter` хранит путь
роутера в query-строке и оставляет pathname браузера внешнему приложению.

## Отслеживание query

`trackQuery` превращает query-параметры в поток входа и выхода. Схеме нужен
только метод `safeParse`.

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

Без `check` трекер реагирует на изменения query и активных роутов. С `check`
разбор query запускается только от этого юнита и пока трекер уже находится во
входном состоянии.

## Виртуальные и связанные роуты

Виртуальные роуты описывают производное состояние без шаблона пути.

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

`chainRoute` ждёт проверки, эффекты или асинхронную подготовку перед тем, как
производный роут сможет открыться от `openOn`.

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

`group` создаёт виртуальный роут, который открыт, пока открыт хотя бы один
входной роут, и находится в ожидании, пока хотя бы один входной роут находится
в ожидании.

```ts
function group(routes: Array<Route<any> | VirtualRoute<any, any>>): VirtualRoute<void, void>;
```

Ленивые React-представления регистрируют динамический импорт как прелоадер
роута. Роут ждёт зарегистрированные прелоадеры перед завершением `beforeOpen`
и активации.

```ts
type AsyncBundleImport = () => Promise<{ default: unknown }>;
type RoutePreloader = () => Promise<unknown> | unknown;
```

## Проверки типов

```ts
const is: {
  route<Params extends object | void = void>(input: unknown): input is Route<Params>;
  pathRoute<Params extends object | void = void>(input: unknown): input is PathRoute<Params>;
  pathlessRoute<Params extends object | void = void>(input: unknown): input is PathlessRoute<Params>;
  router(input: unknown): input is Router;
};
```

## React-связки

`RouterProvider` кладёт роутер в React-контекст и может подключить адаптер
history при монтировании.

```tsx
function RouterProvider(props: {
  router: Router;
  history?: RouterAdapter;
  children?: ReactNode;
}): ReactNode;
```

Представления описывают, какой компонент относится к какому роуту.

```ts
function routeView<Params extends object | void = void>(
  props: CreateRouteViewProps<Params>,
): RouteView;

function lazyRouteView<Params extends object | void = void>(
  props: CreateLazyRouteViewProps<Params>,
): RouteView;

function routesView(props: CreateRoutesViewProps): ComponentType;

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
  routes: RouteView[];
  otherwise?: ComponentType;
}
```

`Outlet` отрисовывает самое глубокое открытое дочернее представление.

```tsx
function Outlet(): ReactNode;
```

Ссылки и хуки отдают состояние роутов в React-компоненты.

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
