# SSR: граница запроса и клиента

Server entry принимает загруженные JSON-данные и вызывает renderPage. Client entry восстанавливает payload через hydratePage. Оба используют одну page factory, которая создаёт корневую модель из data в scope своего вызова.

<UIFlow kind="ssr" />

У каждого запроса отдельные значения и коллекции. Snapshot захватывается после view; это включает впервые прочитанные writable SID-сторы. На клиенте восстановление выполняется до создания модели, а manifest позволяет повторить её автоматические ID.

Graph bootstrap всё равно нужен. Snapshot сам не создаёт отложенные коллекции и не переносит DOM или callbacks. Для non-JSON unit state требуется отдельная подготовка данных; встроенный snapshot строго проверяет JSON.

Проверяйте гидратацию по идентичности реальных узлов, а не только равенству HTML. Пример проверки DOM выполняется без UI-компилятора.

[SSR API](../api/server-start) и [Start template](../start).

::: details Полный код примера
::: code-group
<<< @/ui/examples/ssr-app.tsx
<<< @/ui/examples/ssr-server.ts
<<< @/ui/examples/ssr-client.ts
:::
:::
