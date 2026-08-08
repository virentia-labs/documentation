---
title: Ядро
---

# Ядро

Ядро Virentia Net — один framework-agnostic пакет:

| Пакет | Назначение |
| --- | --- |
| `@virentia/net-core` | Query, mutation, триггеры, операторы concurrency/retry, executor-адаптеры, дефолты по скоупам |

Он не зависит ни от React, ни от Vue. Удалённые данные моделируются как
состояние Virentia — query это настоящий эффект `@virentia/core` со сторами
`data`/`error`/`stale` сверху, — поэтому любой рендерер читает одни и те же
модели через свой тонкий биндинг ([React](/ru/net/react/), [Vue](/ru/net/vue/))
или обычный `scoped`.

## Страницы

- [Query](/ru/net/core/query) — fetch-эффект: конфиг, юниты, чтение и запуск
  по скоупам.
- [Mutation](/ru/net/core/mutation) — сторона записи: `optimistic`-обновления и
  `invalidates`.
- [Триггеры](/ru/net/core/triggers) — запуск query/mutation, когда срабатывает
  любой юнит Virentia.
- [Операторы](/ru/net/core/operators) — `concurrency` и `retry` как
  упорядоченный middleware в `use: []`.
- [Адаптеры](/ru/net/core/adapters) — executor'ы TanStack Query и Apollo за той
  же поверхностью query.
- [Дефолты](/ru/net/core/defaults) — `overrideDefaults` для общего executor'а
  или операторов, глобально или per-scope.
