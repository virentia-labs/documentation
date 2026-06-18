---
title: React Native
---

# React Native

`@virentia/router-react-native` связывает роуты Virentia с
[React Navigation](https://reactnavigation.org). Он не объявляет роуты и не
решает, какой экран активен — эта работа остается в моделях роута и роутера из
[ядра](/ru/router/core/), ровно как и в вебе.

Пакет строит навигаторы React Navigation из ваших представлений роутов и держит
их синхронными с роутером в обе стороны:

- когда роут открывается (через `route.open`, ссылку или history), нужный экран
  React Navigation выводится на передний план;
- когда пользователь нажимает нижнюю вкладку, привязанный роут открывается в
  вашем скоупе Virentia, поэтому проверки роута, отслеживание query и
  `beforeOpen` по-прежнему отрабатывают.

Состояние остается в моделях роутов. Навигатор — только рендерер.

## Страницы

- [Stack-навигатор](/ru/router/react-native/stack-navigator) —
  `createVirentiaStackNavigator`.
- [Bottom tabs-навигатор](/ru/router/react-native/bottom-tabs-navigator) —
  `createVirentiaBottomTabsNavigator` и открытие по нажатию на вкладку.

## Установка

Пакет зависит от `@virentia/router`, `@virentia/router-react` и
`@virentia/react` со стороны моделей роутов и от React Navigation со стороны
нативного UI:

```sh
pnpm add @virentia/router-react-native @virentia/router @virentia/router-react @virentia/react react react-native
pnpm add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
pnpm add react-native-gesture-handler react-native-safe-area-context react-native-screens
```

React Navigation, `react-native-screens`, `react-native-safe-area-context` и
`react-native-gesture-handler` — это peer-зависимости. Настройте нативные модули
по гайду React Navigation (импорт gesture handler, включение screens, поды для
iOS).

## Провайдеры

Приложение React Native оборачивается так же, как веб, плюс `NavigationContainer`
от React Navigation. Порядок важен: скоуп Virentia и роутер должны быть доступны
каждому экрану, поэтому они находятся над `NavigationContainer`.

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider } from "@virentia/router-react";
import { NavigationContainer } from "@react-navigation/native";
import { appScope } from "./scope";
import { router } from "./router";
import { Navigator } from "./navigator";

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router}>
        <NavigationContainer>
          <Navigator />
        </NavigationContainer>
      </RouterProvider>
    </ScopeProvider>
  );
}
```

History создает приложение, а не роутер. На нативе нет URL браузера, поэтому
используется history в памяти:

```ts
import { createMemoryHistory } from "history";
import { historyAdapter } from "@virentia/router";
import { allSettled } from "@virentia/core";
import { appScope } from "./scope";
import { router } from "./router";

await allSettled(router.setHistory, {
  scope: appScope,
  payload: historyAdapter(createMemoryHistory({ initialEntries: ["/home"] })),
});
```

`initialEntries` задает первый открытый роут. Если history не подключать
совсем, навигаторы все равно отрисуются и будут реагировать на `route.open`, но
deep link и стек назад отслеживаться не будут.

## Представления роутов

Оба навигатора принимают массив представлений роутов — той же формы
`{ route, view }`, что и в [`@virentia/router-react`](/ru/router/react/views).
Каждое представление связывает одну модель роута с одним компонентом экрана:

```tsx
import { createRouteView } from "@virentia/router-react";
import { homeRoute, profileRoute } from "./router";
import { HomeScreen, ProfileScreen } from "./screens";

const routes = [
  createRouteView({ route: homeRoute, view: HomeScreen }),
  createRouteView({ route: profileRoute, view: ProfileScreen }),
];
```

Экраны читают параметры и query из модели роута, а не из пропсов React
Navigation:

```tsx
import { useUnit } from "@virentia/react";
import { profileRoute } from "./router";

function ProfileScreen() {
  const { id } = useUnit(profileRoute.params);

  return <Text>Profile {id}</Text>;
}
```

## Имена экранов

Имена экранов и вкладок выводятся из пути каждого роута, поэтому
`initialRouteName` предсказуем:

- имя экрана стека — это `path` роута (например, `/profile/:id`) или
  `Route{index}` для роута без пути;
- имя экрана вкладки — путь без слешей (`/search` становится `search`) или
  `Tab{index}` для роута без пути;
- заголовок вкладки — последний статичный сегмент пути (`/profile/:id`
  становится `profile`) или `Tab {n}`, если статичного сегмента нет.

Передавайте эти имена в `initialRouteName`. Видимую подпись вкладки можно
переопределить через `screenOptions`, если выведенный заголовок не подходит.

## Экспорты

```ts
import {
  createVirentiaStackNavigator,
  createVirentiaBottomTabsNavigator,
} from "@virentia/router-react-native";

import type {
  VirentiaStackNavigatorConfig,
  VirentiaStackNavigatorOptions,
  VirentiaBottomTabsNavigatorConfig,
  VirentiaBottomTabsNavigatorOptions,
  VirentiaBottomTabsRouteView,
} from "@virentia/router-react-native";
```

`VirentiaStackNavigatorOptions` и `VirentiaBottomTabsNavigatorOptions` — это
ре-экспорты типов опций React Navigation, поэтому существующий код опций экранов
продолжает работать.

## Что остается в модели роута

Навигаторы не вводят второй источник истины. Держите в моделях роута и роутера
то же, что и в вебе:

- какой роут активен (`route.open`, `route.isOpened`, history);
- параметры и query (`route.params`, `router.query`, отслеживание query);
- проверки доступа и редиректы (`beforeOpen`).

Навигатор читает эти модели, рисует нужный экран и направляет нажатия вкладок
обратно в `route.open`. Семантика навигации описана в
[Навигации](/ru/router/core/navigation), а модель отрисовки, на которой строятся
представления, — в [React](/ru/router/react/).
