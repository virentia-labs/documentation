# @virentia/core API

Используйте `@virentia/core`, чтобы строить модели состояния.

## scope

Создает изолированный контейнер значений.

Используйте scope, когда одна и та же модель должна работать без общего состояния: в браузерном приложении, запросе, тесте, смонтированном виджете или кешированном экране.

```ts
import { scope } from "@virentia/core";

const appScope = scope();
```

Обычно один scope соответствует экземпляру приложения, запросу, тесту, предпросмотру или фоновой модели в кеше.

Задавайте значения сторов, обработчики эффектов и зависимости при создании:

```ts
const appScope = scope({
  values: [[count, 10]],
  handlers: [[loadFx, async (id) => localData[id]]],
  deps: [[api, new RealApiClient()]],
});
```

`values` — сериализуемое состояние; `handlers` переопределяют реализации эффектов; `deps` предоставляют per-scope зависимости (см. [`dependency`](#dependency)). `handlers` и `deps` никогда не сериализуются.

## scoped

Запускает функцию в scope. Если функция возвращает promise, тот же scope сохраняется для этой promise-цепочки до ее завершения.

```ts
import { store, scoped } from "@virentia/core";

const count = store(0);

scoped(appScope, () => {
  count.value = 1;
});
```

Используйте `scoped`, чтобы читать и писать сторы напрямую.

```ts
await scoped(appScope, async () => {
  const response = await fetch("/api/count");
  count.value = (await response.json()).count;
});
```

`scoped` также может создать runner для повторного запуска и callback-функций.

```ts
const inAppScope = scoped(appScope);

await inAppScope(() => loadFx());

const onMessage = inAppScope.wrap((message: string) => {
  messages.items = [...messages.items, message];
});
```

Если код уже выполняется внутри scope, его можно не передавать.

```ts
scoped(() => {
  count.value += 1;
});
```

## dependency

Объявляет per-scope инъекцию — API-клиент, часы, логгер. Это обвязка, а не состояние: каждый scope предоставляет свой экземпляр, и в отличие от стора она никогда не сериализуется и не гидрируется.

```ts
import { dependency, effect, provideDependency, scope } from "@virentia/core";

const api = dependency<ApiClient>("api");

const loadFx = effect(async (id: string) => api.value.get(id));

// Предоставьте при создании или императивно.
const appScope = scope({ deps: [[api, new RealApiClient()]] });
provideDependency(appScope, api, new RealApiClient());
```

Читайте `dep.value` под активным scope (обработчик эффекта, тело реакции, `scoped`). Чтение зависимости — не реактивная зависимость. Чтение той, что активный scope не предоставил, бросает понятную ошибку. `provideDependency(scope, dep, value)` задаёт её императивно.

Полное руководство — [Зависимости](/ru/core/dependencies).

## store

Создает записываемый стор, значение которого хранится в scope.

Используйте стор для состояния, которым владеет модель. Одно определение стора может иметь разные значения в разных scopes.

```ts
const count = store(0);
const profile = store({ name: "Ada", age: 36 });

scoped(appScope, () => {
  count.value += 1;
  profile.value = { ...profile.value, age: 37 };
});
```

Производные сторы:

```ts
const doubled = count.map((value) => value * 2);
const positive = count.filter((value) => value > 0);
const label = count.filterMap((value) => (value > 0 ? `#${value}` : "skip"), "skip");
```

`map`, `filter` и `filterMap` создают ленивые read-only сторы. Без подписки они пересчитываются только при чтении. Если на них подписана реакция или UI, они пересчитываются при изменении зависимостей.

Подписка на обновления в scope:

```ts
const unsubscribe = count.subscribe((value, scope) => {
  console.log(value, scope);
});

unsubscribe();
```

## computed

Создает read-only стор с ленивым вычислением.

```ts
const visibleUsers = computed(() => {
  const text = query.value.toLowerCase();

  return users.items.filter((user) => user.name.toLowerCase().includes(text));
});
```

`computed` запоминает результат отдельно в каждом scope. Зависимости определяются автоматически по сторам, прочитанным внутри функции. Без активных подписок вычисление не запускается после изменения зависимостей, пока значение не прочитают.

## lazyModel

Создает ленивую оболочку модели.

Используйте `lazyModel`, когда модель вынесена в отдельный модуль и должна импортироваться только при запуске или вызове одного из ее юнитов.

```ts
const chat = lazyModel(() =>
  import("./chat.model").then(({ createChatModel }) => createChatModel()),
);

await scoped(appScope, () => chat.opened("chat:1"));
```

Реакции могут подписываться на ленивые события и lifecycle-юниты эффектов до загрузки модуля. Чтение сторов остается синхронным, поэтому читайте сторы ленивой модели после того, как модель уже загрузилась.

У каждой ленивой модели есть два флага, работающих по scope:

- `pending: Store<boolean>` — идёт импорт. Равен `false` и до, и после, поэтому гейтом для чтения не годится.
- `loaded: Store<boolean>` — загрузчик выдал модель. Именно на нём стройте защитное чтение.

```ts
const unreadCount = computed(() => (chat.loaded.value ? chat.unread.value : 0));
```

## event

Создает вызываемое событие.

Используйте событие, когда модель должна узнать, что что-то произошло. События несут payload и запускают связанные реакции.

```ts
const submitted = event<{ text: string }>();
```

Обрабатывайте событие через реакции:

```ts
reaction({
  on: submitted,
  run({ text }) {
    query.value = text;
  },
});
```

Производные события:

```ts
const textOnly = submitted.map(({ text }) => text);
const nonEmpty = textOnly.filter((text) => text.length > 0);
const normalized = nonEmpty.filterMap((text) => text.trim() || undefined);
```

## effect

Создает вызываемый юнит для работы с внешним миром.

Используйте эффект для асинхронной работы. Эффекты раскрывают события и сторы жизненного цикла, чтобы остальная модель могла реагировать на загрузку, успех, ошибку и отмену.

```ts
const loadUserFx = effect(async (id: string, { signal }) => {
  const response = await fetch(`/api/users/${id}`, { signal });
  return (await response.json()) as { id: string; name: string };
});
```

Юниты эффекта:

```ts
loadUserFx.started;
loadUserFx.done;
loadUserFx.failed;
loadUserFx.fail;
loadUserFx.doneData;
loadUserFx.failData;
loadUserFx.finally;
loadUserFx.settled;
loadUserFx.abort;
loadUserFx.aborted;
```

Сторы эффекта:

```ts
loadUserFx.pending;
loadUserFx.inFlight;
```

Вызов внутри scope:

```ts
const user = await scoped(appScope, () => loadUserFx("user:1"));
```

Отмена выполняющихся вызовов:

```ts
await scoped(appScope, () => loadUserFx.abort(new Error("cancelled")));
```

Отмена завершает in-flight вызовы в текущем scope на уровне рантайма Virentia, поэтому handler не обязан читать `signal` или вручную делать reject. Вызовы того же эффекта в других scope не затрагиваются. Роспуск отменяет вызовы с обеих сторон: dispose владельца эффекта отменяет все его in-flight вызовы (`Effect owner disposed`), а dispose владельца, **сделавшего** вызов, отменяет этот вызов (`Effect caller disposed`) — именно это отменяет запросы при разборе модели экрана, хотя сам эффект обычно живёт на уровне модуля. Эффекты, запущенные активным эффектом, автоматически наследуют отмену родителя и отменяются с той же причиной.

Вариант — отдельно наблюдаемая точка входа в тот же эффект:

```ts
const profileLoadUserFx = loadUserFx.variant("profileLoadUserFx");
const authorizedRequestFx = requestFx.variant("authorizedRequestFx", (id: number) => ({
  id,
  token: token.value,
}));
```

У варианта свои unit'ы жизненного цикла и свой `abort`, а необязательный mapper меняет тип его params. Вызов варианта вызывает базовый эффект, поэтому жизненный цикл базы срабатывает тоже, а `requestFx.pending`/`inFlight` учитывают вызовы, сделанные через любой из ее вариантов. Отмена варианта отменяет сделанный им вызов базы, и оба эффекта эмитят `aborted`. Scoped handler override на базе действует для всех вариантов; override на самом варианте заменяет делегирование, поэтому база не вызывается.

Используйте `EffectParams<typeof fx>`, `EffectDoneValue<typeof fx>` и `EffectFailValue<typeof fx>`, когда фабрике нужно сослаться на форму эффекта без отдельно именованных типов params, результата или ошибки.

## reaction

Создает правило модели.

По умолчанию начинайте с автовычисления зависимостей: передайте функцию, прочитайте внутри нужные сторы, и Virentia сама поймет, от каких значений зависит реакция. Такая реакция пересобирает зависимости при каждом запуске.

Автоматическая реакция:

```ts
reaction(() => {
  fullName.value = `${firstName.value} ${lastName.value}`;
});
```

Это не единственный режим. Если причина запуска сама важна — конкретное событие, эффект или юнит жизненного цикла — используйте явный `on`. В таком варианте payload остается видимым, а реакция запускается только от указанного юнита.

Явный `on`:

```ts
reaction({
  on: submitted,
  run(payload) {
    console.log(payload);
  },
});
```

Несколько источников:

```ts
reaction({
  on: [firstChanged, secondChanged],
  run(payload) {
    console.log(payload);
  },
});
```

Опции scope и инспектора:

```ts
reaction({
  on: ticked,
  scope: appScope, // Scope | readonly Scope[] — выполнять только в этих scopes
  name: "tick", // подпись в инспекторе
  key: true, // пометить как keyed-узел в инспекторе
  run() {},
});
```

Остановить реакцию:

```ts
const subscription = reaction({
  on: submitted,
  run() {},
});

subscription.stop();
```

## owner

Создает границу жизненного цикла.

Используйте `owner` для моделей, которые создаются во время работы приложения. Все очистки, зарегистрированные внутри, можно выполнить вместе через `dispose`.

Колбэк получает `(dispose, owner)`: используйте `dispose()`, чтобы свернуть границу изнутри, и `owner`, чтобы передать границу во вложенные фабрики.

```ts
const model = owner(() => {
  const incremented = event<void>();
  const count = store(0);

  reaction({
    on: incremented,
    run() {
      count.value += 1;
    },
  });

  return { count, incremented };
});

model.dispose();
```

Корневой объект модели также получает `[Symbol.dispose]`, поэтому в средах с поддержкой Explicit Resource Management можно использовать `using`.

```ts
{
  using model = owner(() => {
    return { count: store(0) };
  });
}
```

## onCleanup, getOwner, withOwner

Используйте cleanup-утилиты, когда вспомогательная функция создает таймеры, подписки, browser listeners или другой ресурс, который нужно отвязать вместе с моделью.

```ts
owner((dispose) => {
  const timer = setInterval(() => {}, 1000);

  onCleanup(() => {
    clearInterval(timer);
  });

  return { dispose };
});
```

Подключить очистку к уже известному владельцу. `withOwner(owner, fn)` делает переданного владельца текущим только на время выполнения `fn`:

```ts
const model = owner((dispose, currentOwner) => {
  return { dispose, owner: currentOwner };
});

withOwner(model.owner, () => {
  onCleanup(() => {
    console.log("cleanup");
  });
});
```

Прочитать текущего владельца внутри вспомогательной функции:

```ts
const current = getOwner();
```

## node и run

Низкоуровневый API графа для интеграций, экспортируется из **`@virentia/core/internal`** (не из основного входа — см. [Низкоуровневое ядро](/ru/core/kernel)).

Используйте его только для новых примитивов или адаптеров. В прикладных моделях обычно нужны сторы, события, эффекты и реакции.

```ts
import { node, run } from "@virentia/core/internal";

const reader = node((ctx) => {
  console.log(ctx.value);
});

await run({
  unit: reader,
  payload: "hello",
  scope: appScope,
});
```

Внутри ноды `ctx.stop()` останавливает текущую ветку, `ctx.fail(error)` останавливает ее как ошибочную, а `ctx.launch(unit, value)` добавляет другую ноду или юнит в очередь в том же scope и контексте выполнения.

`@virentia/core/internal` также экспортит примитивы трекинга (`trackNode`, `collectNodes`, `isTracking`), доступ к активному scope (`getActiveScope`, `requireActiveScope`, `setActiveScope`) и жизненный цикл транзакций (`writeTransactionStore`, `readTransactionStore`, …) для написания собственных сторов. См. [Низкоуровневое ядро](/ru/core/kernel).

## context и withContexts

Передают метаданные через одну цепочку выполнения kernel. Экспортируются из **`@virentia/core/internal`**.

Используйте contexts для данных, которые относятся к одному запуску: request id, tracing, служебные флаги адаптеров. Для состояния приложения используйте сторы.

```ts
import { context, withContexts } from "@virentia/core/internal";

const requestId = context<string>();

withContexts([requestId.setup("request-1")], () => {
  console.log(requestId.get());
});
```

Внутри ноды:

```ts
const reader = node((ctx) => {
  console.log(ctx.getContext(requestId));
});
```

## setErrorReporter

Меняет адресата, которому уходят сдержанные отказы. По умолчанию читаемый отчёт пишется в консоль; `null` возвращает поведение по умолчанию.

```ts
import { setErrorReporter } from "@virentia/core";

setErrorReporter((failure) => {
  Sentry.captureException(failure.error, {
    tags: { unit: failure.unit, kind: failure.kind },
    extra: { path: failure.path, declaredAt: failure.declaredAt, scope: failure.scope },
  });
});
```

Репортер получает `VirentiaFailureReport`:

| поле | значение |
| --- | --- |
| `kind` | `reaction`, `async reaction` или `store subscriber` |
| `unit` | упавший юнит, например `reaction "connectSocket"` |
| `declaredAt` | место объявления юнита, если его удалось снять |
| `scope` | идентификатор scope, в котором шло обновление |
| `path` | юниты, через которые прошло обновление, от источника |
| `error` | брошенное значение, без изменений |
| `message` | готовый читаемый отчёт |

Репортер, который сам бросил, не роняет обновление — используется запасной консольный вывод, поэтому отказ остаётся виден.

Правила сдерживания, которые описывает отчёт, — в разделе [Когда реакция бросает исключение](/ru/core/reactions#когда-реакция-бросает-исключение).

## @virentia/core/utils

Стандартная библиотека операторов поставляется с ядром как сабпас. Это справочник; гайд с семантикой и рецептами — [Утилиты](/ru/utils/).

```ts
import {
  debounce, throttle, delay, interval,
  once, previous, reset, status,
} from "@virentia/core/utils";
```

Каждый оператор per-scope и знает о владельце: таймеры и флаги не протекают между скоупами, а dispose владельца, под которым оператор создан, отменяет его незавершённую работу.

### debounce, throttle

```ts
debounce(source: Store<T>, ms: number | DebounceOptions): Store<T>
debounce(source: Event<T>, ms: number | DebounceOptions): Event<T>
// DebounceOptions: { ms: number; leading?: boolean } — у throttle та же форма
```

Операторы времени сохраняют породу источника: событие на входе — событие на выходе; стор на входе — стор с последним устоявшимся значением (его initial — декларационный initial источника). `debounce` стреляет последним payload после `ms` тишины; `leading: true` пропускает первое срабатывание сразу и молчит до полной паузы. `throttle` эмитит не чаще раза в `ms` — последнее значение окна в его конце; `leading: true` дополнительно стреляет при открытии окна.

`await` источника не включает отложенную эмиссию: это новый корневой апдейт, и сбой ниже по его течению репортится через канал ошибок, а не становится unhandled rejection.

### delay

```ts
delay(source: Store<T> | Event<T>, ms: number): Store<T> | Event<T>
```

Сдвигает каждое срабатывание на `ms` независимо — без схлопывания, порядок сохраняется.

### interval

```ts
interval(options: { ms: number; start: Event<any>; stop?: Event<any>; leading?: boolean }):
  { tick: Event<void>; active: Store<boolean> }
```

`tick` стреляет каждые `ms` между `start` и `stop` в том скоупе, где их вызвали; `active` — per-scope флаг работы. `start` во время работы — no-op; `leading: true` тикает сразу при старте. Dispose владельца останавливает все скоупы и гасит `active`.

### once

```ts
once(source: Event<T> | Store<T>, options?: { reset?: Event<unknown> | Store<unknown> }): Event<T>
```

Пропускает первое срабатывание в скоупе и глотает остальные; `reset` перевзводит. Флаг «уже стрелял» — стор, поэтому SSR-снапшот его переносит: баннер, показанный на сервере, не покажется второй раз после гидрации.

### previous

```ts
previous(source: Store<T>): Store<T | undefined>
previous(source: Store<T>, seed: Seed): Store<T | Seed>
```

Отстаёт от источника на одно изменение, per scope. При первом изменении «предыдущим» становится декларационный initial источника; до этого производный стор читает seed (по умолчанию `undefined`).

### reset

```ts
reset(options: {
  clock: Event<unknown> | Store<unknown> | readonly (Event<unknown> | Store<unknown>)[];
  target: StoreWritable<any> | readonly StoreWritable<any>[];
}): Reaction
```

Возвращает каждую цель к её декларационному initial по срабатыванию clock — все цели одной транзакцией, в скоупе срабатывания; остальные скоупы сохраняют значения. Цель-computed бросает в момент reset (у неё нет сохранённого initial). Сам initial читается через `initialValueOf`/`hasInitialValue` из `@virentia/core/internal`.

### status

```ts
status(fx: Effect<P, D, F>, options?: { reset?: Event<unknown> | Store<unknown> }):
  Store<"initial" | "pending" | "done" | "fail">
```

Консолидированная машина состояний эффекта: `"initial"` до первого вызова в скоупе, дальше побеждает последнее событие жизненного цикла. `reset` возвращает в `"initial"`. При пересекающихся вызовах ранний успех читается как `"done"`, пока поздний вызов ещё бежит — где это важно, комбинируйте со `pending`.

