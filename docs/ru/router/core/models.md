---
title: Роутинг во владении модели
---

# Роутинг во владении модели

Эти модельные API требуют `@virentia/core` версии 0.11.2 или новее.

Объявляйте роуты и роутер в `staticModel.setup`, когда экземплярам экранов или
редакторов нужны независимые route state и history. Возвращайте их нативные API:

<<< @/examples/packages/router.ts#model

`page.params`, `page.open`, `navigation.path` и вложенные handles роутов сохраняют
привязку к экземпляру. React `RouterProvider`/`useLink` принимают
`screen.navigation`/`screen.page` напрямую.

## Подключение history экземпляру

<<< @/examples/packages/router.ts#use

В `knownRoutes` и `activeRoutes` находятся соответствующие привязанные роуты
экземпляра. History callbacks возвращаются в его scope. Disposal экрана
отключает его listener; другие экраны и history продолжают работать.
Подключайте history из привязанного runtime-метода или после `.create()`,
а не в общем setup.

Независимым роутерам нужны независимые memory histories. У браузера одна
адресная строка: выберите роутер, который отвечает за этот URL. Нативные
роутеры уровня приложения остаются доступны; освобождайте их связь с history
через `router.dispose` при завершении lifetime.

## SSR и hydration

На сервере используйте scope запроса и memory history. Сопоставьте запрошенный
URL и завершите нужную работу до рендера. Восстановите DTO и состояние scope
перед клиентской hydration, затем подключите клиентскую history. Объект history
и его listener являются runtime-ресурсами и не передаются через JSON.

Обычным экземплярам нужны `.create()` или `children` родителя. `.static()`
создаёт отдельный модульный граф, когда нужен модульный lifetime.
См. [активацию роутов](./routes), [history](./router) и
[владение полями формы](/ru/forms/models) для редактируемого состояния экрана.
