---
title: Модель роута
---

# Модель роута

Роут — объект Virentia, который описывает один открываемый экран или состояние
приложения. Он хранит параметры, флаг открытия, признак ожидания и события
жизненного цикла. Сам роут не отрисовывает интерфейс и не работает с браузерной
history напрямую.

Роут нужен, когда состояние должно:

- открываться по URL или из кода;
- иметь типизированные параметры;
- запускать проверки перед открытием;
- быть доступным другим моделям;
- отрисовываться в React через `@virentia/router-react`.

## Создание роута

```ts
import { createRoute } from "@virentia/router";

export const homeRoute = createRoute({ path: "/" });

export const profileRoute = createRoute({
  path: "/users/:id<number>",
});
```

TypeScript выводит параметры из пути:

```ts
profileRoute.open({
  params: { id: 42 },
});
```

Если передать строку вместо числа, TypeScript покажет ошибку.

## Что есть у роута

```ts
interface Route<Params> {
  params: StoreWritable<Params>;
  isOpened: StoreWritable<boolean>;
  isPending: Store<boolean>;

  open: EventCallable<RouteOpenedPayload<Params>>;
  opened: Event<InternalOpenedPayload<Params>>;
  openedOnClient: Event<InternalOpenedPayload<Params>>;
  openedOnServer: Event<InternalOpenedPayload<Params>>;
  closed: Event<void>;

  parent?: Route<any>;
}
```

`params` содержит параметры последнего успешного открытия. `isOpened`
показывает, открыт ли роут сейчас. `isPending` становится `true`, пока
выполняются предзагрузчики и `beforeOpen`.

Алиасов `$params`, `$isOpened` и `$isPending` нет.

## Данные для `open`

Роут без параметров можно открыть без данных:

```ts
homeRoute.open();
```

Роут с параметрами пути требует `params`:

```ts
profileRoute.open({
  params: { id: 42 },
});
```

Дополнительно можно передать query и replace:

```ts
profileRoute.open({
  params: { id: 42 },
  query: { tab: "posts" },
  replace: true,
});
```

`query` используется для навигации. Она не записывается в `route.params`;
текущая query живет в `router.query`.

## `beforeOpen`

`beforeOpen` выполняется перед открытием роута. Он подходит для работы,
которая должна завершиться до показа экрана:

- проверить доступ;
- загрузить данные экрана;
- сделать перенаправление;
- прогреть ленивый код.

```ts
import { effect } from "@virentia/core";
import { createRoute } from "@virentia/router";

const loadProfileFx = effect(async (id: number) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

export const profileRoute = createRoute({
  path: "/users/:id<number>",
  beforeOpen: [
    ({ params }) => {
      if (!params) return;
      return loadProfileFx(params.id);
    },
  ],
});
```

`beforeOpen` получает данные открытия:

```ts
type BeforeOpenPayload<Params> = {
  params?: Params;
  query?: Query;
  replace?: boolean;
  causedBy?: RouteActivationCause;
};
```

`causedBy` показывает, откуда пришло открытие: из `route.open`, из history или
из перенаправления. Когда `route.open` меняет URL, последующее открытие от
history не запускает ту же проверку второй раз.

## Родительские роуты

Родительский роут нужен, когда общий лейаут или состояние должны быть открыты
вместе с дочерним роутом:

```ts
export const settingsRoute = createRoute({ path: "/settings" });

export const securityRoute = createRoute({
  path: "/security",
  parent: settingsRoute,
});
```

Открытие `/settings/security` откроет и `settingsRoute`, и `securityRoute`.
Где именно показать дочерний интерфейс, решает React `Outlet`; модель роута
только хранит факт открытия.

## Роут без пути

`createRoute()` без `path` создает роут без собственного URL:

```ts
const modalRoute = createRoute<{ id: string }>();

modalRoute.open({ params: { id: "invite" } });
```

Такой роут полезен для модальных окон и локальных состояний, которые должны
вести себя как роут, но не обязаны иметь отдельный путь.

Если роут без пути должен открываться из URL, он регистрируется в роутере с явным
путем.

## Виртуальные роуты и `group`

`createVirtualRoute` создает объект, похожий на роут, но без пути. `group` открывается,
когда открыт хотя бы один роут из списка:

```ts
import { createVirtualRoute, group } from "@virentia/router";

const modalRoute = createVirtualRoute<{ id: string }, { id: string }>();
const settingsArea = group([settingsRoute, securityRoute]);
```

Виртуальные роуты подходят для производного состояния: например, подсветить
раздел навигации, пока открыт любой роут внутри раздела.

## Цепочки роутов

`chainRoute` открывает виртуальный роут только после дополнительной проверки.
Это удобно для закрытых экранов:

```ts
import { chainRoute, createRoute } from "@virentia/router";
import { effect, event, reaction } from "@virentia/core";

const profileRoute = createRoute({ path: "/users/:id" });
const authorized = event<void>();
const rejected = event<void>();

const checkAuthorizationFx = effect(async ({ params }) => {
  return params.id !== "0";
});

reaction({
  on: checkAuthorizationFx.doneData,
  run(isAuthorized) {
    void (isAuthorized ? authorized : rejected)();
  },
});

export const authorizedProfileRoute = chainRoute({
  route: profileRoute,
  beforeOpen: checkAuthorizationFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

`authorizedProfileRoute.params` получает параметры исходного роута.
