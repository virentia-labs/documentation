---
title: Миграция с argon-router
---

# Миграция с argon-router

Эта страница нужна для переноса существующего кода с пакетов
`@argon-router/*` на Virentia Router. Это не слой совместимости: старые импорты
и API в стиле Effector не поддерживаются как алиасы.

## Имена пакетов

Пакеты должны быть отдельными:

| argon-router | Virentia Router |
| --- | --- |
| `@argon-router/paths` | `@virentia/router-paths` |
| `@argon-router/core` | `@virentia/router` |
| `@argon-router/react` | `@virentia/router-react` |

React-привязки не импортируются из путей вроде `@virentia/router/react`.

`@virentia/router-react-native` планируется, но его не стоит использовать, пока
пакет не появился вместе с тестами React Navigation.

## Модель выполнения

Effector wiring заменяется примитивами Virentia:

| Effector / argon-router | Virentia |
| --- | --- |
| `createEvent` | `event` |
| `createStore` | `store` |
| `createEffect` | `effect` |
| `sample`, `createAction` | `reaction` |
| `fork` | `scope` |
| `scopeBind` | `scoped(scope).wrap(fn)` |
| `Provider` | `ScopeProvider` |
| `useUnit` из `effector-react` | `useUnit` из `@virentia/react` |

## Имена сторов

Effector-style `$` поля удалены:

| argon-router | Virentia Router |
| --- | --- |
| `route.$params` | `route.params` |
| `route.$isOpened` | `route.isOpened` |
| `route.$isPending` | `route.isPending` |
| `router.$path` | `router.path` |
| `router.$query` | `router.query` |
| `router.$history` | `router.history` |
| `router.$activeRoutes` | `router.activeRoutes` |

Compatibility aliases не добавляются.

## Открытие роутов

Было:

```ts
route.open({ params: { id: "42" } });
```

Стало:

```ts
import { scoped } from "@virentia/core";

await scoped(appScope, () => route.open({ params: { id: "42" } }));
```

`allSettled(route.open, { scope, payload })` используется в тестах, серверных
загрузчиках, командах и адаптерах, где надо явно указать scope и дождаться
завершения работы графа.

В React `Link` и `useUnit(route.open)` привязывают вызовы к текущему scope.

## beforeOpen

Virentia `beforeOpen` получает данные открытия:

```ts
createRoute({
  path: "/profile/:id",
  beforeOpen: [
    ({ params, query, causedBy }) => {
      console.log(params?.id, query.tab, causedBy?.type);
    },
  ],
});
```

Для `route.open` `beforeOpen` выполняется до навигации. Более позднее открытие
из history помечается через `causedBy` и пропускает ту же проверку, поэтому
проверка срабатывает один раз. Это закрывает старый сценарий, где клик по ссылке
мог запустить `beforeOpen` дважды и временно показать view для not found.

## History

Роутер не создает history. History создается в приложении:

```ts
import { createBrowserHistory } from "history";
import { scoped } from "@virentia/core";
import { historyAdapter } from "@virentia/router";

await scoped(appScope, () =>
  router.setHistory(historyAdapter(createBrowserHistory())),
);
```

Библиотеки должны зависеть от типов history-адаптера Virentia. Приложения и
тесты должны устанавливать `history` сами.

## Query tracking

`trackQuery` больше не завязан на Zod. Подходит любой объект с `safeParse`:

```ts
const dialog = router.trackQuery({
  parameters: {
    safeParse(query) {
      return query.dialog === "profile"
        ? { success: true, data: { dialog: "profile" as const } }
        : { success: false };
    },
  },
});
```

`dialog.enter(payload)` и `dialog.exit()` заменяют ручную навигацию по
строке запроса для частых сценариев диалогов и фильтров.

## React views

`createRouteView`, `createRoutesView`, `Link` и `Outlet` сохраняют ту же идею,
но работают через Virentia scopes.

`withLayout` оборачивает массив представлений роутов:

```tsx
withLayout(Layout, [
  createRouteView({ route: routes.profile, view: ProfilePage }),
  createRouteView({ route: routes.friends, view: FriendsPage }),
]);
```

Ленивые представления роутов регистрируют свой динамический import как
предзагрузчик роута. Для ленивых бизнес-моделей и моделей данных в core уже есть
`lazyModel`. Общий протокол предзагрузки стоит переносить в `@virentia/core`
только после того, как тот же контракт понадобится вне роутинга.

## Интеграция с Effector

Не нужно механически переносить каждый Effector unit в слой роутера. Лучше:

- новое состояние роутинга держать в `@virentia/router`;
- бизнес-состояние держать в моделях Virentia;
- `@virentia/effector` использовать только на временных границах миграции.
