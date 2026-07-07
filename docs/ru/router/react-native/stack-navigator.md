---
title: Stack-навигатор
---

# Stack-навигатор

`stackNavigator` строит навигатор `@react-navigation/stack` из
ваших представлений роутов и возвращает компонент `{ Navigator }`. Навигатор
следует за роутером: то представление роута, которое является самым глубоким из
сейчас открытых, выводится на передний план стека.

Настройка — провайдеры, history и представления роутов — общая со вторым
навигатором и описана в [обзоре React Native](/ru/router/react-native/).

```tsx
import { stackNavigator } from "@virentia/router-react-native";
import { routeView } from "@virentia/router-react";
import { appRouter, homeRoute, profileRoute } from "./router";
import { HomeScreen, ProfileScreen } from "./screens";

const { Navigator } = stackNavigator({
  router: appRouter,
  routes: [
    routeView({ route: homeRoute, view: HomeScreen }),
    routeView({ route: profileRoute, view: ProfileScreen }),
  ],
  initialRouteName: "/home",
  screenOptions: {
    headerShown: false,
  },
});
```

## Конфигурация

```ts
interface StackNavigatorConfig {
  router: Router;
  routes: RouteView[];
  initialRouteName?: string;
  screenOptions?: StackNavigationOptions;
}
```

| Опция | Тип | Описание |
| --- | --- | --- |
| `router` | `Router` | Роутер, которому принадлежат эти представления |
| `routes` | `RouteView[]` | Представления роутов в порядке регистрации экранов |
| `initialRouteName` | `string` | Необязательное имя первого экрана (см. [Имена экранов](/ru/router/react-native/#имена-экранов)) |
| `screenOptions` | `StackNavigationOptions` | Необязательные опции, применяемые к навигатору и каждому экрану |

## Как он следует за роутером

Навигатор подписывается на открытые представления для своих `routes`. Когда
набор открытых роутов меняется, он вызывает `navigate` на экране для самого
глубокого открытого представления. Так как дочерний роут открывает и своего
[родителя](/ru/router/core/routes#родительские-роуты), вложенный дочерний экран
предпочитается своему открытому родителю — открытие `/profile/friends`
показывает экран друзей, а повторное открытие `/profile` возвращает к экрану
профиля.

Если у открытого роута нет представления в `routes`, текущий экран остается
наверху — навигатор никогда не показывает пустоту. Это позволяет открывать
роуты, которые обрабатываются в другом месте (другой навигатор, модалка), не
нарушая стек.

## Виртуальные роуты как экраны

[Виртуальные роуты](/ru/router/core/virtual-routes), созданные через
`virtualRoute`, поддерживаются как экраны без пути в стиле модалок. Они
получают сгенерированное имя экрана (`Route{index}`), а их преобразованные
параметры читаются из модели роута так же, как у любого другого экрана:

```tsx
const { Navigator } = stackNavigator({
  router: appRouter,
  routes: [
    routeView({ route: homeRoute, view: HomeScreen }),
    routeView({ route: detailsRoute, view: DetailsScreen }), // virtual route
  ],
  initialRouteName: "/home",
});
```

Вызов `detailsRoute.open({ id: "modal-1" })` пушит его экран; экран читает
`useUnit(detailsRoute.params)` для получения преобразованного payload.
