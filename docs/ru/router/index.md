---
title: Роутер
---

# Роутер

Virentia Router — это семейство моделей роутов для приложений на
`@virentia/core` и `@virentia/react`.

Документация сгруппирована по слою, с которым вы работаете:

- **[Core](/ru/router/core/)** — роутинг, не зависящий от фреймворка: шаблоны
  путей, модели роутов, роутер, навигация, отслеживание query и виртуальные
  роуты.
- **[React](/ru/router/react/)** — отрисовка открытых роутов в дереве React DOM.
- **[React Native](/ru/router/react-native/)** — отрисовка открытых роутов через
  React Navigation.

Внутри ядра каждая часть задокументирована отдельно, чтобы настройка, правила
роутинга, обновления URL и отрисовка не схлопывались в один пример: шаблон пути
описывает, как URL парсится и собирается; роут — это модель Virentia для одного
адресуемого состояния; роутер регистрирует роуты, владеет сопоставлением URL и
подключается к history; навигация — это граница-команда, которая открывает роуты
или пишет URL; а отслеживание query превращает состояние query в URL в события
модели. Слои React и React Native только отрисовывают уже открытые модели роутов.

## Пакеты

| Пакет | Назначение |
| --- | --- |
| `@virentia/router-paths` | Типизированные шаблоны путей, парсинг, сборка и конвертация в Express |
| `@virentia/router` | Роуты, роутеры, history-адаптеры, отслеживание query, виртуальные роуты, группы, chain-роуты |
| `@virentia/router-react` | `RouterProvider`, `Link`, представления роутов, ленивые представления, outlet'ы, хуки |
| `@virentia/router-react-native` | Stack- и bottom-tabs-навигаторы, связывающие представления роутов с React Navigation |

## Установка

```sh
pnpm add @virentia/core @virentia/router @virentia/router-paths
pnpm add @virentia/react @virentia/router-react react
pnpm add history
```

Пакет роутера принимает history-адаптеры, но не создает браузерную history или
history в памяти внутри себя. Созданием history владеет приложение.

## Страницы

Core (`@virentia/router` + `@virentia/router-paths`):

- [Обзор](/ru/router/core/)
- [Шаблоны путей](/ru/router/core/paths)
- [Модель роута](/ru/router/core/routes)
- [Роутер и history](/ru/router/core/router)
- [Навигация](/ru/router/core/navigation)
- [Отслеживание query](/ru/router/core/query-tracking)
- [Виртуальные, chain- и сгруппированные роуты](/ru/router/core/virtual-routes)

React (`@virentia/router-react`):

- [Обзор](/ru/router/react/)
- [Провайдер](/ru/router/react/provider)
- [Представления роутов и Outlet](/ru/router/react/views)
- [Ссылки](/ru/router/react/links)
- [Хуки](/ru/router/react/hooks)

React Native (`@virentia/router-react-native`):

- [Обзор](/ru/router/react-native/)
- [Stack-навигатор](/ru/router/react-native/stack-navigator)
- [Bottom tabs-навигатор](/ru/router/react-native/bottom-tabs-navigator)

Прочее:

- [Миграция с argon-router](/ru/router/migration-from-argon-router)
