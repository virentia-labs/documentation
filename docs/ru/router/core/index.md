---
title: Core
---

# Core

Ядро Virentia Router — это два пакета, не зависящих от фреймворка:

| Пакет | Назначение |
| --- | --- |
| `@virentia/router-paths` | Типизированные шаблоны путей: парсинг URL в параметры, сборка URL из параметров, валидация шаблонов на уровне типов, конвертация в синтаксис Express |
| `@virentia/router` | Модели роутов, роутеры, history-адаптеры, навигация, отслеживание query, виртуальные, chain- и сгруппированные роуты |

Ни один из пакетов не зависит от React. Они моделируют роутинг как состояние
Virentia, поэтому любой рендерер — `@virentia/router-react`,
`@virentia/router-react-native` или ваш собственный — читает одни и те же модели.

## Ментальные паттерны

Ядро задокументировано по одному ментальному паттерну на страницу. Каждая
страница объясняет задачу, форму API и где проходит граница ответственности.

- [Шаблоны путей](/ru/router/core/paths) — как строка URL парсится в
  типизированные параметры и собирается обратно, независимо от роутов.
- [Модель роута](/ru/router/core/routes) — что хранит роут (`isOpened`,
  `params`, события жизненного цикла) и как работают `beforeOpen` и родительские
  роуты.
- [Роутер и history](/ru/router/core/router) — регистрация роутов, подключение
  history-адаптера, поток активации, вложенные роутеры и контролы роутера.
- [Навигация](/ru/router/core/navigation) — `route.open`, `appRouter.navigate`,
  `back`/`forward` и где их вызывать.
- [Отслеживание query](/ru/router/core/query-tracking) — превращение состояния
  query в URL в события `entered`/`exited` модели для диалогов, фильтров и
  вкладок.
- [Виртуальные, chain- и сгруппированные роуты](/ru/router/core/virtual-routes) —
  состояние, похожее на роут, но не участвующее в сопоставлении URL.

## Установка

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
```

`@virentia/router-paths` — зависимость `@virentia/router`, поэтому устанавливать
его явно нужно только тогда, когда вы используете утилиты для путей напрямую.

Роутер принимает history-адаптеры, но никогда сам не создает браузерную history
или history в памяти — созданием history владеет приложение и передает ее внутрь
(см. [Роутер и history](/ru/router/core/router)).

## Что экспортирует ядро

```ts
import {
  // routes
  route,
  virtualRoute,
  chainRoute,
  group,
  // router
  router,
  routerControls,
  // history adapters
  historyAdapter,
  queryAdapter,
  // query tracking
  trackQueryFactory,
  // type guards
  is,
} from "@virentia/router";

import {
  compile,
  convertPath,
  type ParseUrlParams,
} from "@virentia/router-paths";
```

Полный контракт на уровне типов для каждого экспорта находится в
[справочнике API `@virentia/router`](/ru/api/router).

## Type guards

`is` сужает неизвестные значения до типов роутера. Это полезно в общем коде
отрисовки и в адаптерах, которые принимают либо роут, либо роутер:

```ts
import { is } from "@virentia/router";

is.route(value); // value is Route<any>
is.pathRoute(value); // value is PathRoute<any>
is.pathlessRoute(value); // value is PathlessRoute<any>
is.router(value); // value is Router
```

`@virentia/router-react-native`, например, использует эти guard'ы, чтобы
отличать роуты, которые можно открыть, от обычных представлений.
