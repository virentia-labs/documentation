---
title: Хуки
---

# Хуки

`@virentia/router-react` предоставляет небольшие хуки для кода, который сам
отрисовывает роуты вместо использования `createRoutesView`. Они в основном нужны
для локальных адаптеров, интеграций с дизайн-системами и кастомных навигаторов.
Большинству приложений достаточно `RouterProvider`, представлений роутов и
`Link`.

Все хуки должны вызываться под [`RouterProvider`](/ru/router/react/provider).

## useRouter

Возвращает роутер из контекста. Полезно для чтения `router.query`, вызова
`router.navigate` или передачи роутера в хелпер:

```tsx
import { useRouter } from "@virentia/router-react";
import { useUnit } from "@virentia/react";

function CurrentQuery() {
  const router = useRouter();
  const query = useUnit(router.query);

  return <pre>{JSON.stringify(query)}</pre>;
}
```

```ts
function useRouter(): Router;
```

## useIsOpened

Подписывается на то, открыт ли сейчас роут, роутер или виртуальный роут, и
перерисовывается при изменении:

```tsx
import { useIsOpened } from "@virentia/router-react";

function ProfileTabBadge() {
  const isOpen = useIsOpened(profileRoute);

  return <Badge active={isOpen} />;
}
```

```ts
function useIsOpened(route: Route<any> | Router | VirtualRoute<any, any>): boolean;
```

Это хук, лежащий в основе подсветки активных ссылок и условного обрамления,
которое зависит от того, активен ли раздел.

## useOpenedViews

По списку представлений роутов возвращает те, чьи роуты сейчас открыты,
упорядоченные от самого внешнего к самому глубокому. Это примитив, на котором
строятся кастомные рендереры — `createRoutesView` и навигаторы React Native
используют его, чтобы решить, что показать:

```ts
function useOpenedViews(routes: RouteView[]): RouteView[];
```

```tsx
import { useOpenedViews } from "@virentia/router-react";

function DebugOpenViews({ routes }: { routes: RouteView[] }) {
  const opened = useOpenedViews(routes);

  return <code>{opened.map((view) => view.route).length} open</code>;
}
```

Обращайтесь к нему, когда вам нужен полный контроль над тем, как открытые роуты
отображаются на UI — цепочка хлебных крошек, нативный стек, аналитический зонд, —
вместо поведения «отрисовать самый глубокий» по умолчанию.

## useLink

`useLink` строит `href` и привязанную команду открытия для роута. Так как он в
основном используется для построения ссылок, он задокументирован вместе со
[Ссылками](/ru/router/react/links).

```ts
function useLink<Params extends object | void = void>(
  to: Route<Params>,
  params?: Params,
  query?: Query,
): { path: string; open: EventCallable<RouteOpenedPayload<Params>> };
```
