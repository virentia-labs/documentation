# Список дочерних моделей

Объявите `tasks: children.many(Task)` в Board. Создайте Board из JSON-данных и передайте его экземпляр в Board view. For получает board.tasks, а TaskRow — готовый model автоматически.

Поддерживаемый пример использует `<For each={self.model.tasks} view={TaskRow}/>`. Модель строки содержит state/actions; view не создаёт store или reaction.

Добавление создаёт новую строку. Move переносит прежние DOM-узлы, включая незатронутые inputs и refs. Remove ждёт unmounted и удаляет конкретную модель. Удаление Board каскадно уничтожает детей.

В неизменяемом массиве ключи не имеют работы: он создаётся один раз. В реактивном контейнере идентичность и операции принадлежат источнику, не JSX.

[Типы For](../api/collections-context) и [механика списка](../learn/model-lists).

:::: details Полный код примера
::: code-group
<<< @/ui/examples/tasks/models.ts
<<< @/ui/examples/tasks/App.tsx
<<< @/ui/examples/model-list.tsx
:::
::::
