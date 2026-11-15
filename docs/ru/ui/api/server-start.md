# SSR и Start

Нативный SSR вызывает view в явно переданном scope, но не создаёт DOM-refs и не выдаёт mounted/unmounted. Модели остаются доступны для snapshot после рендера.

```ts
renderToString(factory: () => Child, options: RenderOptions): string;
renderToStaticMarkup(factory: () => Child, options: RenderOptions): string;
renderToStringAsync(factory: () => Child, options: RenderOptions): Promise<string>;
renderToStaticMarkupAsync(factory: () => Child, options: RenderOptions): Promise<string>;
serializeState(snapshot: ScopeSnapshot): string;
renderPage<Data>(view: (data: Data) => Child, data: Data,
  options: { identifierPrefix: string }): RenderedPage;
renderPageAsync<Data>(view: (data: Data) => Child, data: Data,
  options: { identifierPrefix: string }): Promise<RenderedPage>;
hydratePage<Data>(view: (data: Data) => Child,
  container: Element | DocumentFragment, payloadText: string): HydratedPage<Data>;
renderDocument(page: RenderedPage, options: DocumentOptions): string;
```

String содержит hydration-маркеры; StaticMarkup — только HTML, не предназначенный для hydrate. Async-варианты возвращают Promise и ждут внутреннюю асинхронную работу рендера. Произвольные async children не принимаются.

SerializeState экранирует JSON для script-тега, сохраняя исходные данные. Сам snapshot создаёт Core serialize(scope). Требуются JSON-значения, стабильные SID/имена моделей и одинаковый identifierPrefix. Manifest восстанавливает identity, но не создаёт весь граф отложенных моделей: он должен быть создан из load-данных.

## Обёртка страницы

RenderedPage содержит html и payload (экранированный JSON). `PagePayload<Data>` содержит data, snapshot и identifierPrefix. `HydratedPage<Data>` содержит data, scope и dispose: () => `Promise<void>`. RenderPage создаёт scope конкретного запроса и захватывает snapshot после render. HydratePage восстанавливает payload до первого чтения модели.

DocumentOptions: clientEntryUrl обязателен; title, stylesheets и modulePreloads необязательны. RenderDocument выдаёт полный HTML-документ с контейнером и payload.

## Vite-конвенция

Default `virentiaStart(options?: StartOptions)` из `@virentia/ui/start/vite` подключает одну страницу app.tsx и необязательный load.server.ts. StartOptions: app, load, title, identifierPrefix, namespace — строки. Loader выполняется на сервере; его модуль не попадает в client entry. Роутера нет: URL передаётся load как вход.

## Node-сборка

BuildStart(StartBuildOptions?) возвращает `Promise<void>`: сначала собирает клиент, затем сервер с тем же root/config. CreateStartServer(StartServeOptions?) и serveStart возвращают `Promise<node:http.Server>`. BuildOptions: root?, configFile?; ServeOptions дополнительно host?, port?. Точный тип port — number. Сначала выполните build; сервер использует output-каталоги, а не dev Vite.

Сервер обслуживает построенные assets и страницу, отклоняя выход за static-каталог и symlink наружу. [Шаблон Start](../start).
