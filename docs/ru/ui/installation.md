# Подготовка окружения

Возьмите Node.js 24, чтобы создать проект на Vite и установить Virentia UI из npm.

```sh
mkdir virentia-ui-app
cd virentia-ui-app
npm init -y
npm pkg set type=module scripts.dev=vite 'scripts.build=vite build'
npm install @virentia/ui@0.1.0 @virentia/core@0.12.0 @sinclair/typebox@0.34.52
npm install -D vite@8 typescript@6
mkdir src
```

В примере используется `staticModel` из Core, которому нужен `@sinclair/typebox`.

## Настройка JSX

В `tsconfig.json` укажите, что JSX использует Virentia UI.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "@virentia/ui"
  },
  "include": ["src"]
}
```

Создайте `vite.config.ts` с плагином Virentia UI.

```ts
import { defineConfig } from "vite";
import virentiaUI from "@virentia/ui/vite";

export default defineConfig({
  plugins: [virentiaUI({ sid: false })],
});
```

В этом клиентском приложении используется `sid: false`. Для серверного рендеринга см. [настройку стабильных идентификаторов](./api/compiler).

## Счётчик на странице

Создайте `index.html` в корне проекта.

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Счётчик на Virentia UI</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Создайте `src/main.tsx`.

```tsx
import { f, staticModel } from "@virentia/core/models";
import { action, component, render, scope } from "@virentia/ui";

const CounterModel = staticModel({
  name: "Counter",
  data: { count: f.number(0) },
  setup(self) {
    return {
      increment: action(() => {
        self.count.value += 1;
      }),
    };
  },
});

const Counter = component({
  model: CounterModel,
  view: (_props, self) => (
    <button type="button" onClick={self.model.increment}>
      Count: {self.model.count}
    </button>
  ),
});

const appScope = scope();
render(() => <Counter />, document.getElementById("app")!, { scope: appScope });
```

`component` связывает модель с представлением, а `render` монтирует компонент в скоупе приложения. JSX привязывает текст кнопки к стору `count`. Действие `increment` записывает в стор новое значение при каждом клике.

Запустите `npm run dev` и откройте адрес, напечатанный Vite. На кнопке появится `Count: 0`, значение будет расти при каждом клике. Команда `npm run build` соберёт приложение в `dist/`.

В обычном JavaScript можно использовать `h(type, props, ...children)` из `@virentia/ui` с теми же реактивными привязками.

## Пример учебника

Чтобы запустить готовый пример учебника из исходников, положите репозитории `documentation` и `virentia` рядом. В каталоге документации с установленными зависимостями выполните команду.

```sh
node scripts/dev-ui-course.mjs
```

Откройте адрес из терминала, чтобы попробовать пример последней главы с двумя счётчиками и управлением списком. При другом расположении исходников задайте `VIRENTIA_SOURCE_ROOT`.

Чтобы собрать пример по шагам, начните с [первого компонента](./learn/first-app).
