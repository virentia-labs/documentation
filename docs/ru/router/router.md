---
title: Роутер и history
---

# Роутер и history

Роутер регистрирует роуты и связывает их с URL. Он читает текущий location,
находит подходящие роуты, запускает их `beforeOpen`, обновляет `router.path`,
`router.query` и `router.activeRoutes`.

Роут может существовать без роутера. Роутер нужен, когда роут должен открываться
из URL, строить ссылки или реагировать на back/forward.

## Создание роутера

```ts
import { createRouter } from "@virentia/router";
import { homeRoute, profileRoute } from "./routes";

export const router = createRouter({
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
export const router = createRouter({ routes });
```

Ему не нужен `owner`: данные живут в Virentia scope, а сам роутер описывает
постоянную структуру приложения.

`owner` нужен только для роутера, который создается и удаляется во время работы:
виджет предпросмотра, встроенное приложение, временный экран или тестовое
мини-приложение. В таком случае `owner` очищает созданный граф, а
`router.dispose` отписывает history-слушатель.

## Подключение history

Роутер не создает history сам. Приложение создает history и передает адаптер:

```ts
import { scoped, scope } from "@virentia/core";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import { router } from "./router";

const appScope = scope();
const browserHistory = createBrowserHistory();

await scoped(appScope, () =>
  router.setHistory(historyAdapter(browserHistory)),
);
```

В React обычно проще передать history в провайдер:

```tsx
<ScopeProvider scope={appScope}>
  <RouterProvider router={router} history={historyAdapter(browserHistory)}>
    <App />
  </RouterProvider>
</ScopeProvider>
```

`setHistory` запоминает текущий scope. Когда `history.listen` позже вызовет
обработчик, роутер вернется в этот scope и обновит сторы там же.

В тестах, серверных загрузчиках и адаптерах фреймворка можно использовать:

```ts
await allSettled(router.setHistory, {
  scope: appScope,
  payload: historyAdapter(browserHistory),
});
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
2. парсит `search` в `router.query`;
3. запускает предзагрузчики и `beforeOpen` найденных роутов;
4. открывает родительские роуты и самый глубокий совпавший роут;
5. закрывает роуты, которые больше не подходят;
6. записывает список открытых роутов в `router.activeRoutes`.

Открытие из браузерной history получает:

```ts
{
  causedBy: { type: "history", source: "initial" | "push" | "replace" | "pop" }
}
```

Открытие через `route.open` получает:

```ts
{
  causedBy: { type: "route.open", route, id }
}
```

Это нужно, чтобы `beforeOpen` понимал источник открытия и не выполнялся второй
раз после клика по `Link`.

## Вложенные роутеры

Вложенный роутер нужен, когда раздел приложения владеет своим поддеревом URL:

```ts
const settingsRouter = createRouter({
  base: "/settings",
  routes: [generalRoute, securityRoute],
});

export const appRouter = createRouter({
  routes: [homeRoute, settingsRouter],
});
```

Родительский роутер передает тот же history-адаптер внутрь дочернего роутера.
Дочерний роутер работает с путями относительно своего `base`.
