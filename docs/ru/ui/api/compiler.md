# JSX и SID-метаданные

Реактивный компилятор отсутствует. Обычный JavaScript с h имеет ту же семантику обновлений. JSX нужен только для синтаксиса описания элементов.

Стандартная настройка TypeScript: jsx: react-jsx, jsxImportSource: @virentia/ui. JSX-runtime предоставляет jsx/jsxs/Fragment и namespace JSX; dev-runtime — jsxDEV/Fragment/JSX. Эти фабрики возвращают ElementDescriptor, не вызывая view.

## Optional SID-плагин

Core имеет отдельные entrypoints `@virentia/core/compiler` и `@virentia/core/compiler/vite`. Первый — Babel-плагин, второй — Vite-адаптер. Они добавляют SID сторам, событиям, определениям моделей и mutableStore; явные SID сохраняются. JSX, if, callbacks и await не преобразуются.

UI Vite helper настраивает стандартный JSX и делегирует SID Core-плагину. ViteOptions включает root/namespace/sid и optional include/exclude как RegExp или (id: string) => boolean. sid: false отключает добавление метаданных; Babel нужен только при включённой инструментации.

Для серверной/клиентской сборок используйте одинаковые root и namespace. SID устойчив относительно одинакового исходника, а не произвольной перестановки деклараций при редактировании файла. Для долговременно сохраняемого внешнего state задайте явные SID.

Ни SID-плагин, ни withRoot не определяют реактивную структуру view. Root-tag текущих embedded-адаптеров объявляется пользователем, не вычисляется компилятором.
