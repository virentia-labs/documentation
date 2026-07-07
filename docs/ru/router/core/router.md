---
title: Роутер и history
---

# Роутер и history

Роутер регистрирует роуты и связывает их с URL. Он читает текущий location,
находит подходящие роуты, запускает их `beforeOpen`, обновляет `appRouter.path`,
`appRouter.query` и `appRouter.activeRoutes`.

Роут может существовать без роутера. Роутер нужен, когда роут должен открываться
из URL, строить ссылки или реагировать на back/forward.

## Создание роутера

```ts
import { router } from "@virentia/router";
import { homeRoute, profileRoute } from "./routes";

export const appRouter = router({
  routes: [homeRoute, profileRoute],
});
```

Публичный API:

```ts
interface Router {
  path: Store<string>;
  query: Store<Query>;
  history: Store<RouterAdapter | null>;
  activeRoutes: Store<Route<any>[]>;

  navigate: EventCallable<NavigatePayload>;
  back: EventCallable<void>;
  forward: EventCallable<void>;
  setHistory: EventCallable<RouterAdapter>;
  dispose: EventCallable<void>;

  ownRoutes: MappedRoute[];
  knownRoutes: MappedRoute[];
  registerRoute(route: InputRoute): void;
}
```

`ownRoutes` — роуты, переданные прямо в этот роутер. `knownRoutes` включает
также роуты из вложенных роутеров.

## Статичный роутер

Обычный роутер приложения создается на уровне модуля:

```ts
export const appRouter = router({ routes });
```

Ему не нужен `owner`: данные живут в Virentia scope, а сам роутер описывает
постоянную структуру приложения.

`owner` нужен только для роутера, который создается и удаляется во время работы:
виджет предпросмотра, встроенное приложение, временный экран или тестовое
мини-приложение. В таком случае `owner` очищает созданный граф, а
`appRouter.dispose` отписывает history-слушатель.

## Подключение history

Роутер не создает history сам. Приложение создает history и передает адаптер:

```ts
import { scoped, scope } from "@virentia/core";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import { appRouter } from "./router";

const appScope = scope();
const browserHistory = createBrowserHistory();

await scoped(appScope, () =>
  appRouter.setHistory(historyAdapter(browserHistory)),
);
```

В React обычно проще передать history в провайдер:

```tsx
<ScopeProvider scope={appScope}>
  <RouterProvider router={appRouter} history={historyAdapter(browserHistory)}>
    <App />
  </RouterProvider>
</ScopeProvider>
```

`setHistory` запоминает текущий scope. Когда `history.listen` позже вызовет
обработчик, роутер вернется в этот scope и обновит сторы там же.

В тестах, серверных загрузчиках и адаптерах фреймворка можно использовать:

```ts
await scoped(appScope, () =>
  appRouter.setHistory(historyAdapter(browserHistory)),
);
```

## RouterAdapter

Роутер работает не с конкретным пакетом history, а с таким адаптером:

```ts
interface RouterAdapter {
  location: {
    pathname: string;
    search: string;
    hash: string;
  };

  push(to: string | Partial<RouterLocation>): void;
  replace(to: string | Partial<RouterLocation>): void;
  goBack(): void;
  goForward(): void;
  listen(callback: (location: RouterLocation) => void): RouterSubscription;
}
```

`historyAdapter` адаптирует пакет `history`. `queryAdapter` нужен для встроенных
виджетов, которые хранят свое состояние роута в строке запроса страницы-хоста.

Пакет `history` должен быть зависимостью приложения, примеров и тестов.
Библиотека роутера не должна создавать history внутри себя.

## Что происходит при смене URL

Когда history сообщает новый location, роутер:

1. парсит pathname по шаблонам зарегистрированных роутов;
2. парсит `search` в `appRouter.query`;
3. запускает предзагрузчики и `beforeOpen` найденных роутов;
4. открывает родительские роуты и самый глубокий совпавший роут;
5. закрывает роуты, которые больше не подходят;
6. записывает список открытых роутов в `appRouter.activeRoutes`.

Каждая активация несёт информацию о том, откуда пришло изменение location:

- `external` — изменение из history: первичная загрузка, `push`/`replace` или
  `pop` (назад/вперёд). Роутер реагирует на него и запускает guard'ы `beforeOpen`.
- `programmatic` — эхо инициированной роутером `navigate`/`route.open`, guard'ы
  которой уже отработали, поэтому активация их пропускает.

Origin определяется структурно — роутер узнаёт эхо URL, который сам только что
записал, — а не передаётся через payload. Это не даёт одному и тому же guard'у
`route.open` сработать дважды после того, как history сообщит о совпадающем
location.

## Контролы роутера

`router` строит свою привязку к history, сторы `path`/`query`, команды
навигации и отслеживание query поверх более низкоуровневого объекта, который
называется *контролы роутера*. `routerControls` отдает этот объект
напрямую:

```ts
import { routerControls } from "@virentia/router";

const controls = routerControls();
```

```ts
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

Контролы полезны, когда несколько роутеров должны делить один источник history:
постройте один объект контролов и вызовите `setHistory` на нем один раз, вместо
того чтобы каждый роутер управлял своей подпиской. У `trackQuery` здесь нет
`forRoutes`, потому что у контролов нет собственной таблицы роутов —
отслеживание, привязанное к роутам, относится к роутеру. Большинство приложений
никогда не создают контролы напрямую; `router` делает это за них.

## Вложенные роутеры

Вложенный роутер нужен, когда раздел приложения владеет своим поддеревом URL:

```ts
const settingsRouter = router({
  base: "/settings",
  routes: [generalRoute, securityRoute],
});

export const appRouter = router({
  routes: [homeRoute, settingsRouter],
});
```

Родительский роутер передает тот же history-адаптер внутрь дочернего роутера.
Дочерний роутер работает с путями относительно своего `base`.
