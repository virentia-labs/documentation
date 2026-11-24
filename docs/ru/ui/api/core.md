# Переэкспорт Core

UI использует тот же реактивный граф, что и Virentia Core. `store`, `reactive`, `computed`, `event`, `effect`, `reaction`, `scope`, `scoped` переэкспортируются без второго signal API.

Сторы и вычисления интерфейса объявляйте в нативной модели. View читает готовые юниты. Side effects оформляйте через reaction; action — только сокращение event + reaction.

Для типов Scope, Store, StoreWritable, EventCallable, ReactionRun и т. п. импортируйте Core. UI не переэкспортирует все типы Core. Модели и контейнеры импортируются из `@virentia/core/models`, mutableStore — из `@virentia/mutable`.

Прямой await юнита Virentia сохраняет caller scope/model context. Произвольный native await — нет. Конкретный instance facade остаётся привязан к своей модели; это безопасная ссылка для работы после внешнего await. Не пытайтесь читать контекстный self staticModel после fetch без явного входа в scope.
