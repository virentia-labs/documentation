---
title: Инспектор
---

# Инспектор

`@virentia/inspector` — отдельный devtools-интерфейс для моделей Virentia. Он
показывает runtime-граф, scopes, payload, результат, длительность вызова,
ошибки, остановленные цепочки и breakpoints без привязки модели к React или к
браузерному расширению.

Используйте его во время разработки фич, отладки потока модели или объяснения
того, как модель реагирует на события. В production bootstrap инспектор лучше не
подключать.

![virentia инспектор](/inspector.png)

## Установка

Установите UI-пакет в workspace приложения:

```sh
pnpm add -D @virentia/inspector
```

Запустите инспектор:

```sh
pnpm exec virentia-inspector
```

По умолчанию UI будет доступен на `http://127.0.0.1:5174/`. CLI также принимает
опции:

```sh
pnpm exec virentia-inspector --open
pnpm exec virentia-inspector --port 5300
pnpm exec virentia-inspector --host 0.0.0.0 --port 5300
```

## Подключение приложения

Подключайте приложение из клиентского dev-кода:

```ts
import { installVirentiaDevtools } from "@virentia/core/devtools";

if (import.meta.env.DEV) {
  installVirentiaDevtools({
    appName: "Checkout",
    autoOpen: true,
  });
}
```

`autoOpen` открывает окно инспектора и передает channel в URL. Если открываете
страницу вручную, используйте `http://127.0.0.1:5174/`.

Если инспектор запущен на другом порту, укажите `inspectorUrl`:

```ts
installVirentiaDevtools({
  appName: "Checkout",
  inspectorUrl: "http://127.0.0.1:5300",
});
```

`channel` нужен, чтобы развести несколько приложений или браузерных сессий:

```ts
installVirentiaDevtools({
  appName: "Checkout",
  channel: "checkout-local",
});
```

Если вы задали свой channel и открываете инспектор вручную, добавьте его в URL:

```text
http://127.0.0.1:5174/?channel=checkout-local
```

Приложение и инспектор общаются через `postMessage`, `BroadcastChannel` и
WebSocket-relay CLI на `/__virentia_devtools`. Благодаря relay приложение может
подключиться к инспектору, даже если UI открыт отдельной вкладкой с
`127.0.0.1`.

## Подключение из React Native или не-браузерной среды

Мост не зависит от `window` или `BroadcastChannel`, поэтому работает везде, где
есть WHATWG `WebSocket` — React Native, web worker, Node, Deno или Bun. Укажите
в `inspectorUrl` машину, на которой запущен relay CLI, и запустите CLI с
`--host 0.0.0.0`, чтобы устройство могло до него достучаться по сети:

```ts
import { installVirentiaDevtools } from "@virentia/core/devtools";

if (__DEV__) {
  installVirentiaDevtools({
    appName: "Checkout",
    inspectorUrl: "http://192.168.1.10:5174", // хост CLI, доступный с устройства
  });
}
```

```sh
pnpm exec virentia-inspector --host 0.0.0.0 --port 5174
```

Если в среде нет глобального `WebSocket` или нужен свой транспорт — соберите его
явно и передайте как `transport`:

```ts
import {
  createWebSocketTransport,
  installVirentiaDevtools,
} from "@virentia/core/devtools";

installVirentiaDevtools({
  appName: "Checkout",
  transport: createWebSocketTransport(
    "ws://192.168.1.10:5174/__virentia_devtools",
    { webSocket: MyWebSocket }, // подставьте конструктор WebSocket, если глобального нет
  ),
});
```

`createWebSocketTransport(url, options?)` — готовый транспорт, не зависящий от
среды, с авто-переподключением и буферизацией отправки. `url` — полный
WebSocket-URL relay (CLI слушает путь `/__virentia_devtools`). `options` принимает
`webSocket` (конструктор `WebSocket`, например пакет `ws`), `reconnectDelay` и
`maxQueue`. `createRelayTransport(inspectorUrl)` собирает транспорт relay по
умолчанию из HTTP-URL и используется мостом под капотом. Передайте
`transport: null`, чтобы полностью отключить relay и полагаться только на
внутристраничные транспорты.

## Инспекция Effector-приложения

Тот же инспектор работает с приложениями на настоящем [effector](https://effector.dev).
Подключайтесь через отдельную точку входа вместо моста Virentia — без аргументов:

```ts
import { connectEffector } from "@virentia/inspector/effector";

if (import.meta.env.DEV) {
  connectEffector({ appName: "Checkout" });
}
```

`connectEffector` читает собственную интроспекцию effector (`effector/inspect`) и
говорит ровно по тому же протоколу, что и `installVirentiaDevtools`, поэтому UI и
CLI инспектора одинаковы. Функция принимает те же опции `appName`, `channel`,
`inspectorUrl` и `autoOpen`, возвращает мост с `appId`, `channel`, `open()`,
`sendGraph()`, `addUnits()`, `addScope()`, `snapshot()` и `dispose()`, а `openEffectorInspector` открывает окно
как `openVirentiaDevtools`.

Граф и timeline сами обнаруживают юниты через `inspectGraph` (созданные после
подключения) и `inspect` (которые посчитались). Давайте юнитам имена
(`createStore(0, { name })`, `createEvent("name")` или через babel/swc-плагин
effector), чтобы граф читался.

Две опции раскрывают остальное — их нельзя получить из публичного API effector: у
него нет глобального реестра, `inspectGraph` работает только вперёд и не отдаёт
живую ноду, а форкнутые scope нельзя перечислить.

```ts
import { connectEffector } from "@virentia/inspector/effector";
import { fork } from "effector";
import * as model from "./model";

const appScope = fork();

connectEffector({
  appName: "Checkout",
  units: [model.itemAdded, model.itemCount, model.loadPriceFx],
  scopes: [{ scope: appScope, name: "checkout tab" }],
});
```

- `units` — передайте юниты вашей модели (или значения из namespace модуля), чтобы
  сразу получить полный граф **с рёбрами** (обход живых связей, включая юниты,
  созданные до подключения) и возможность **триггерить** их из инспектора. Без
  `units` граф всё равно перечисляет обнаруженные юниты, но как изолированные
  вершины, а для триггера нужна живая ссылка на юнит.
- `scopes` — scope из [`fork`](https://effector.dev/en/api/effector/fork/) для
  наблюдения в timeline и вызова юнитов в scope. Активность без scope наблюдается
  автоматически; форкнутые scope нужно передать (`Scope` напрямую или
  `{ scope, name }`, или позже через `addScope`).

Две возможности инспектора, специфичные для Virentia, в effector не имеют аналога и
деградируют мягко, а не ломаются:

- **Брейкпоинты** принимаются и отображаются, но не останавливают выполнение — у
  effector нет механизма остановки цепочки.
- **Длительность** показывается как `0` мс — поток inspect у effector не несёт
  времени по шагам.

Всё остальное — реактивный граф, timeline вызовов (одна строка на пользовательский
юнит, ошибки помечаются) и запуск событий и эффектов с JSON-payload — работает так
же, как во Virentia.

## Имена для графа

Читаемые имена превращают граф из набора безымянных узлов в полезную карту
модели. Лучше задавать имена там, где создаются юниты:

```ts
import {
  computed,
  effect,
  event,
  reaction,
  scope,
  store,
} from "@virentia/core";
import { nameScope, nameUnit } from "@virentia/core/devtools";

const appScope = scope();
nameScope(appScope, "checkout tab");

const itemAdded = event<{ id: string }>("cart.itemAdded");
const itemCount = store(0, undefined, { name: "cart.itemCount" });
const hasItems = computed(() => itemCount.value > 0, undefined, {
  name: "cart.hasItems",
});
const loadPriceFx = effect(
  async (id: string) => fetchPrice(id),
  "cart.loadPriceFx",
);

reaction({
  name: "cart.applyAddedItem",
  on: itemAdded,
  run(item) {
    itemCount.value += 1;
    void loadPriceFx(item.id);
  },
});

nameUnit(hasItems, "cart.hasItems");
```

`event(name)`, `effect(handler, name)`, `{ name }` у store/computed, `name` у
reaction, `nameUnit` и `nameScope` пишут метаданные для одного и того же
инспектора. Подъюниты эффектов вроде `started`, `done` и `pending`
группируются под родительским effect. Внутренние implementation nodes скрыты из
графа.

Если нужны более богатые метаданные, используйте `describeUnit`:

```ts
import { describeUnit } from "@virentia/core/devtools";

describeUnit(loadPriceFx, {
  name: "cart.loadPriceFx",
  description:
    "Loads the current price for an item in the active checkout scope.",
});
```

## Работа с интерфейсом

Основной canvas показывает видимые юниты и связи:

- сплошные линии — reactive edges, то есть один юнит может запустить следующий;
- пунктирные линии — ownership edges, например lifecycle-юниты эффекта под
  родительским effect;
- переключатель `Show isolated` показывает именованные юниты, которые сейчас не
  связаны с видимой цепочкой;
- `Refresh` запрашивает свежий snapshot графа из приложения.

Клик по node подсвечивает связанную reactive chain. Если граф выглядит шумным,
добавьте имена на границах модели и выключите isolated units, пока разбираете
один поток.

## Timeline

Правая панель записывает вызовы, пока включен `Record`. Каждая строка показывает
имя юнита, тип, scope, длительность, preview payload и preview результата.
Ошибки и остановленные цепочки отмечаются отдельно, поэтому видно, обработчик
упал, фильтр остановил цепочку или сработал breakpoint.

![virentia таймлайн инспектора](/inspector-timeline.png)

`Clear` очищает видимую историю. Переключатель записи влияет только на UI; он не
меняет выполнение модели приложения.

## Вызов юнитов

Кликните правой кнопкой по callable node и выберите `Инициировать вызов`, чтобы
запустить юнит из инспектора. Callable nodes есть у событий, сторов и эффектов.
Редактор payload принимает JSON; пустой payload отправляется как `undefined`.

![virentia диалог триггера юнита](/inspector-trigger-modal.png)

Перед вызовом можно выбрать breakpoints из выбранной цепочки. Цепочка остановится
после выбранного breakpoint node, а предыдущий набор breakpoints затем
восстановится. Triggered calls выполняют настоящий код модели и настоящие
эффекты, поэтому используйте безопасные payloads в development.

Текущая версия инспектора вызывает юнит в первом известном scope подключенного
приложения. Называйте scopes через `nameScope`, чтобы в timeline было понятно,
где прошел вызов.

## Программное управление

`installVirentiaDevtools` возвращает bridge:

```ts
const devtools = installVirentiaDevtools({
  appName: "Checkout",
});

devtools.sendGraph();
devtools.setBreakpoints([]);
const snapshot = devtools.snapshot();

devtools.dispose();
```

`dispose` полезен в тестах, при teardown hot reload или когда development-only
bootstrap размонтирован. Также у bridge есть `open()`, чтобы открыть UI позже.

Для тестов и низкоуровневой отладки `@virentia/core/devtools` экспортирует
`getVirentiaDevtoolsSnapshot`, `setVirentiaDevtoolsBreakpoints`,
`getDevtoolsNodeId` и `getDevtoolsScopeId`.

## Troubleshooting

Если инспектор показывает `0 units`, проверьте, что приложение вызвало
`installVirentiaDevtools` в браузере и что `inspectorUrl` совпадает с портом
CLI.

Если приложение использует свой `channel`, страница инспектора должна быть
открыта с тем же query-параметром. `autoOpen: true` делает это автоматически.

Если trigger падает с `Unknown scope`, обновите граф после создания scope или
прогоните пользовательский сценарий, который регистрирует этот scope.

Если имена пропадают после hot reload, задавайте стабильные имена при создании
юнитов. Инспектор дедуплицирует устаревшие именованные юниты и оставляет самый
новый юнит с тем же type и name.
