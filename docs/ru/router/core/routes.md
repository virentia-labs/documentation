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
import { route } from "@virentia/router";

export const homeRoute = route({ path: "/" });

export const profileRoute = route({
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

Алиасов с dollar-prefix для `params`, `isOpened` и `isPending` нет.

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
текущая query живет в `appRouter.query`.

## `beforeOpen`

`beforeOpen` выполняется перед открытием роута. Он подходит для работы,
которая должна завершиться до показа экрана:

- проверить доступ;
- загрузить данные экрана;
- сделать перенаправление;
- прогреть ленивый код.

```ts
import { effect } from "@virentia/core";
import { route } from "@virentia/router";

const loadProfileFx = effect(async (id: number) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

export const profileRoute = route({
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
};
```

Когда `route.open` пишет history, последующая активация из history
распознаётся как собственное эхо роутера (origin `programmatic`) и пропускает
`beforeOpen`, поэтому тот же guard не запускается второй раз для этой активации.

## События жизненного цикла

Роут предоставляет события для каждой стадии активации, чтобы другие модели
могли реагировать без опроса сторов:

| Юнит | Срабатывает, когда |
| --- | --- |
| `opened` | Роут становится активным, после того как `beforeOpen` завершился. Несет нормализованный payload. |
| `openedOnClient` | То же, что `opened`, но только в браузере. |
| `openedOnServer` | То же, что `opened`, но только при SSR. |
| `closed` | Роут перестает быть активным. |
| `isPending` | `Store<boolean>`, который равен `true`, пока выполняется работа `beforeOpen`. |

```ts
import { reaction } from "@virentia/core";

reaction({
  on: profileRoute.opened,
  run({ params }) {
    analytics.track("profile_viewed", { id: params?.id });
  },
});
```

`openedOnClient` и `openedOnServer` разделяют эффекты только для клиента и только
для сервера в SSR-приложениях — например, открыть websocket только на клиенте
или префетчить только на сервере. `isPending` удобен для UI загрузки на уровне
роута.

## Родительские роуты

Родительский роут нужен, когда общий лейаут или состояние должны быть открыты
вместе с дочерним роутом:

```ts
export const settingsRoute = route({ path: "/settings" });

export const securityRoute = route({
  path: "/security",
  parent: settingsRoute,
});
```

Открытие `/settings/security` откроет и `settingsRoute`, и `securityRoute`.
Где именно показать дочерний интерфейс, решает React `Outlet`; модель роута
только хранит факт открытия.

## Роуты без пути

`route()` без `path` создает роут без собственного URL. Его все равно можно
открывать, наблюдать, группировать и отрисовывать, но роутер не сможет построить
для него URL, пока тот не зарегистрирован с явным путем (см.
[Роутер и history](/ru/router/core/router#создание-роутера)).

```ts
const modalRoute = route<{ id: string }>();
```

Для состояния, которое ведет себя как роут, но не участвует в сопоставлении
URL, — модалки, производное состояние «раздел открыт» или экраны за асинхронными
проверками — используйте виртуальные, сгруппированные и chain-роуты. Им посвящена
отдельная страница:
[Виртуальные, chain- и сгруппированные роуты](/ru/router/core/virtual-routes).
