# Низкоуровневое ядро

Большинство прикладного кода должно использовать сторы, события, эффекты, реакции и owners — основной вход `@virentia/core`.

Низкоуровневые строительные блоки ядра лежат в отдельном подпути **`@virentia/core/internal`**: прямые узлы графа, контексты выполнения, трекинг зависимостей, доступ к scope и жизненный цикл транзакций. Он нужен, чтобы писать интеграцию с сырыми узлами или собственный юнит/стор — [`@virentia/mutable`](/ru/mutable/) целиком построен на нём.

::: warning Продвинутая поверхность
`@virentia/core/internal` — намеренно отдельный вход: прикладному коду он не нужен. Он реэкспортит **те же singleton-модули**, что и основной вход (бандлер выносит их в общий чанк), поэтому пакет, построенный на нём, разделяет scope, транзакции и граф ядра, а не получает свою копию. Считайте его продвинутым и менее стабильным, чем основной API. Из основного входа публичны только **типы** ядра (например `Node`, который есть на каждом юните как `.node`).
:::

## node и run

```ts
import { node, run } from "@virentia/core/internal";
import { scope } from "@virentia/core";

const appScope = scope();

const logNode = node((ctx) => {
  console.log(ctx.value);
});

await run({
  unit: logNode,
  payload: "hello",
  scope: appScope,
});
```

Ноды могут передавать значения нижележащим нодам.

```ts
const second = node((ctx) => {
  console.log(ctx.value); // "next"
});

const first = node({
  run: () => "next",
  next: [second],
});

await run({ unit: first, scope: appScope });
```

Нода может явно поставить в очередь другую ветку. `ctx.launch` сохраняет текущий scope, contexts, metadata и batch key, но даёт ноде выбрать, какой юнит получит следующее значение.

```ts
const gate = node((ctx) => {
  ctx.stop();
  ctx.launch(second, "next");
});
```

`ctx.stop()` останавливает текущую ветку; `ctx.fail(error)` останавливает её как ошибочную.

## Трекинг зависимостей

Собственный стор делает свои чтения реактивными, репортя их окружающему `computed` или реакции. Вызовите `trackNode(node)` из чтения: внутри окна трекинга это регистрирует `node` как зависимость, поэтому последующий запуск этой ноды перезапустит читателя.

```ts
import { node, run, trackNode } from "@virentia/core/internal";

const storeNode = node({ run: (ctx) => ctx.value });

function read(scope: Scope): Value {
  trackNode(storeNode); // это чтение теперь зависит от `storeNode`
  return currentValue(scope);
}

function commit(scope: Scope, next: Value): void {
  void run({ unit: storeNode, payload: next, scope }); // перезапустит читателей `storeNode`
}
```

`isTracking()` возвращает, зарегистрируется ли чтение прямо сейчас — используйте, чтобы не строить мелкогранулярные ключи зависимостей на чтениях, которые никто не трекает (обычная мутация), сохраняя путь записи дешёвым. `collectNodes(fn)` выполняет `fn` и возвращает `{ result, nodes }` — набор нод, которые он затрекал; тем же механизмом `computed` собирает свои зависимости.

Про трекинг по keypath — подписку читателя только на прочитанные им части значения — смотрите, как [`@virentia/mutable`](/ru/mutable/#трекинг-по-keypath) мапит keypath'ы на лениво созданные ноды.

## Активный scope

Значения сторов живут в scope, поэтому собственный стор резолвит активный на каждом чтении или записи.

```ts
import { getActiveScope, requireActiveScope, setActiveScope } from "@virentia/core/internal";

const scope = requireActiveScope(() => "read a counter store");
```

`requireActiveScope(describe)` возвращает активный scope или бросает внятную ошибку «Scope is required», используя `describe()` и путь юнитов, чтобы сказать, что именно требовало scope. `getActiveScope()` возвращает его или `null`. `setActiveScope(scope)` меняет ambient-scope и возвращает предыдущий — низкоуровневый примитив под `scoped`.

## Интеграция с транзакциями

Записи в сторы батчатся и применяются на границе транзакции (см. [Транзакции](/ru/core/transactions)). Собственный стор подключается к этой границе через `writeTransactionStore`:

```ts
import { writeTransactionStore } from "@virentia/core/internal";
import type { StoreCommitResult, StoreTransactionTarget } from "@virentia/core/internal";

const id = Symbol("my-store");

const target: StoreTransactionTarget = {
  id, // дедупит повторные записи в этот стор в одной транзакции
  scope,
  commit(): StoreCommitResult {
    const changed = applyStagedValueToScope();
    return {
      changed,
      notify: () => notifySubscribersAndFireNodes(),
    };
  },
};

writeTransactionStore(target, stagedValue);
```

На границе ядро вызывает `commit()` каждого target ровно один раз (повторные записи с тем же `id` + `scope` дедупятся), применяет изменения, затем прогоняет все `notify` — так подписчики видят финальное закоммиченное значение. `readTransactionStore(target)` читает застейдженное значение обратно внутри той же транзакции. Транзакции никогда не откатываются.

Именно так [`@virentia/mutable`](/ru/mutable/) откладывает целую глубокую правку до одного атомарного коммита — полный рабочий пример есть в его исходниках.

## Контексты ядра

Контексты ядра прокидывают метаданные выполнения через цепочку run.

```ts
import { context, node, run } from "@virentia/core/internal";

const requestId = context<string>();

const reader = node((ctx) => {
  console.log(ctx.getContext(requestId));
});

await run({
  unit: reader,
  scope: appScope,
  contexts: [requestId.setup("request-42")],
});
```

Используйте сторы для прикладного состояния. Используйте контексты ядра для метаданных, принадлежащих одному выполнению. `withContexts([...], fn)` задаёт контексты вокруг синхронного вызова вне ноды.

## Механика

Пользовательская модель транзакций описана в [Транзакциях](/ru/core/transactions). Механика исполнения и обоснование дизайна — в [Deep Knowledge](/ru/guide/deep-knowledge).
