# Подготовка окружения

Учебник использует TypeScript и JSX. Для JSX настройте `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@virentia/ui"
  }
}
```

`@virentia/ui` пока private-пакет рабочего монорепозитория. Пример ниже использует локальный исходный код Virentia, а не установку из npm.

## Пример учебника

Репозитории `documentation` и `virentia` должны лежать рядом. В каталоге документации с установленными зависимостями запустите:

```sh
node scripts/dev-ui-course.mjs
```

Откройте адрес, напечатанный в терминале. Это готовый результат седьмой главы: два счётчика и управление списком. При другом расположении исходников задайте `VIRENTIA_SOURCE_ROOT`.

Учебник показывает, как собрать этот результат постепенно. Начните с [первого компонента](./learn/first-app).

## Свой проект

В Vite 8 используйте `virentiaUI` из `@virentia/ui/vite`:

```ts
export default defineConfig({
  plugins: [virentiaUI({ sid: false })],
});
```

`defineConfig` импортируется из `vite`. Здесь включается стандартное преобразование JSX. SID-плагин для SSR настраивается [отдельно](./api/compiler).

В обычном JavaScript вместо JSX можно использовать `h(type, props, ...children)`. Реактивные привязки работают одинаково.
