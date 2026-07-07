---
title: Bottom tabs-навигатор
---

# Bottom tabs-навигатор

`bottomTabsNavigator` строит навигатор
`@react-navigation/bottom-tabs` и возвращает компонент `{ Navigator }`. Он
следует за открытием роутов так же, как
[stack-навигатор](/ru/router/react-native/stack-navigator), и добавляет одну
вещь: нажатие на вкладку открывает роут этой вкладки внутри скоупа Virentia.

Настройка — провайдеры, history и представления роутов — общая и описана в
[обзоре React Native](/ru/router/react-native/).

```tsx
import { bottomTabsNavigator } from "@virentia/router-react-native";
import { appRouter, homeRoute, searchRoute } from "./router";
import { HomeScreen, SearchScreen } from "./screens";

const { Navigator } = bottomTabsNavigator({
  router: appRouter,
  routes: [
    { route: homeRoute, view: HomeScreen },
    { route: searchRoute, view: SearchScreen },
  ],
  initialRouteName: "home",
});
```

## Нажатие на вкладку проходит через route.open

Так как нажатие на вкладку вызывает `route.open`, проверки роута, `beforeOpen` и
отслеживание query — все отрабатывают тем же путем, что и при открытии роута
откуда угодно. Вкладка не просто меняет видимый экран; она меняет состояние
роутера, поэтому остальная часть приложения остается согласованной.

Роуты без события `open` (обычное представление, которое не является
открываемым роутом) откатываются к поведению вкладок React Navigation по
умолчанию.

## Открытие вкладок с параметрами

Вкладка-роут, которой нужны параметры или query, несет `openPayload`,
передаваемый в `route.open` при нажатии на вкладку. Используйте значение для
статичного payload или функцию для payload, вычисляемого в момент нажатия:

```tsx
const { Navigator } = bottomTabsNavigator({
  router: appRouter,
  routes: [
    { route: homeRoute, view: HomeScreen },
    {
      route: profileRoute,
      view: ProfileScreen,
      openPayload: {
        params: { id: "42" },
        query: { source: "tab" },
      },
    },
    {
      route: detailsRoute,
      view: DetailsScreen,
      openPayload: () => ({ id: currentUserId() }),
    },
  ],
  initialRouteName: "home",
});
```

`openPayload` — единственное дополнение к обычному представлению роута; все
остальное совпадает с `routeView`.

```ts
interface BottomTabsRouteView extends RouteView {
  openPayload?: unknown | (() => unknown);
}
```

## Конфигурация

```ts
interface BottomTabsNavigatorConfig {
  router: Router;
  routes: BottomTabsRouteView[];
  initialRouteName?: string;
  screenOptions?: BottomTabNavigationOptions;
}
```

| Опция | Тип | Описание |
| --- | --- | --- |
| `router` | `Router` | Роутер, которому принадлежат эти вкладки |
| `routes` | `BottomTabsRouteView[]` | Представления роутов, опционально с `openPayload` |
| `initialRouteName` | `string` | Необязательное имя первой вкладки (см. [Имена экранов](/ru/router/react-native/#имена-экранов)) |
| `screenOptions` | `BottomTabNavigationOptions` | Необязательные опции, применяемые к каждой вкладке |

## Следование за внешними открытиями

Навигатор также следует за открытиями роутов, которые приходят извне панели
вкладок — deep link, обработчик push-уведомления или вызов `route.open` в
бизнес-логике. Когда такой роут открывается, его вкладка становится активной, а
экран читает свежие параметры из модели роута, поэтому внешний
`profileRoute.open({ params: { id: "99" } })` выбирает вкладку профиля и
показывает id `99`.
