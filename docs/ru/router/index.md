---
title: Роутер
---

# Роутер

Virentia Router связывает URL с моделями Virentia. Роут описывает экран или
состояние, которое можно открыть по адресу. Роутер читает текущий URL, находит
подходящие роуты, запускает проверки перед открытием и сообщает React-слою, что
надо отрисовать.

## Разделы

- [Шаблоны путей](/ru/router/paths) — как описывать `/users/:id<number>` и получать типы параметров.
- [Модель роута](/ru/router/routes) — что хранит роут, как работает `open`, `beforeOpen`, родительские и виртуальные роуты.
- [Роутер и history](/ru/router/router) — как зарегистрировать роуты, подключить history и обработать смену URL.
- [Навигация](/ru/router/navigation) — когда вызывать `route.open`, когда `router.navigate`, как работают ссылки.
- [Отслеживание query](/ru/router/query-tracking) — как привязать диалоги, фильтры и вкладки к строке запроса.
- [Отрисовка в React](/ru/router/react) — как показать открытые роуты в React.
- [Миграция с argon-router](/ru/router/migration-from-argon-router) — какие имена и подходы меняются при переносе.

## Пакеты

| Пакет | Что внутри |
| --- | --- |
| `@virentia/router-paths` | `compile`, `convertPath`, типы параметров из шаблона пути |
| `@virentia/router` | `createRoute`, `createRouter`, history-адаптеры, query tracking, виртуальные роуты |
| `@virentia/router-react` | `RouterProvider`, `Link`, представления роутов, `Outlet`, хуки |

React Native пакет должен называться `@virentia/router-react-native`, но он не
описан как готовый API, пока в репозитории нет реализации и тестов с React
Navigation.

## Установка

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

`history` ставится в приложение. Роутер принимает history-адаптер, но сам не
создает браузерную history или history в памяти.
