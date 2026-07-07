---
title: Mutable
---

# Мутабельные сторы

`@virentia/mutable` — стор для `@virentia/core`, чей `.value` это **глубоко мутабельный объект**: мутируешь на месте, без иммутабельных церемоний и без зависимостей.

```sh
pnpm add @virentia/mutable
```

```ts
import { computed, event, reaction } from "@virentia/core";
import { mutableStore } from "@virentia/mutable";

const itemAdded = event<Item>();

const cart = mutableStore({ items: [] as Item[], total: 0 });
const itemCount = computed(() => cart.value.items.length);

reaction({
  on: itemAdded,
  run(item) {
    cart.value.items.push(item); // мутируем на месте — вложенные объекты и массивы
    cart.value.total += item.price;
  },
});
```

Чтение `.value` регистрирует зависимость **по keypath**, поэтому `computed`, авто-реакция или `map` перезапускаются только когда изменена именно та часть, которую они читали — см. [Гранулярная реактивность](#гранулярная-реактивность). Каждый scope хранит своё значение. См. [Правила scope](/ru/core/scopes#правила-scope).

Глубоко трекаются только plain object и array; `Date`, `Map`, `Set` и инстансы классов — **листья**, заменяются целиком.

## Бенчмарки

ops/sec (больше — лучше) против immer `produce` и mutative `create`, на массиве из 50 000 элементов с растущим числом изменённых за обновление. `@virentia/mutable` мутирует принадлежащие scope узлы на месте — без копии дерева, — поэтому впереди обоих.

<div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 28px;">

<svg viewBox="0 0 620 182" width="100%" style="display:block;max-width:620px;margin:0 auto 26px" role="img" aria-label="Массив 50 000, изменить 1000 — ops/sec (больше — лучше)">
  <text x="0" y="22" font-size="16" font-weight="700" fill="currentColor">Массив 50 000, изменить 1000 — ops/sec (больше — лучше)</text>
  <text x="0" y="63" font-size="15" fill="currentColor">@virentia/mutable</text>
  <rect x="150" y="42" width="420" height="30" rx="4" fill="#a855f7"/>
  <text x="560" y="63" font-size="15" font-weight="600" text-anchor="end" fill="#fff">3,033</text>
  <text x="0" y="109" font-size="15" fill="currentColor">mutative</text>
  <rect x="150" y="88" width="179" height="30" rx="4" fill="#60a5fa"/>
  <text x="319" y="109" font-size="15" font-weight="600" text-anchor="end" fill="#fff">1,290</text>
  <text x="0" y="155" font-size="15" fill="currentColor">immer</text>
  <rect x="150" y="134" width="38" height="30" rx="4" fill="#4ade80"/>
  <text x="196" y="155" font-size="15" font-weight="600" fill="currentColor">276</text>
</svg>

<svg viewBox="0 0 620 182" width="100%" style="display:block;max-width:620px;margin:0 auto 26px" role="img" aria-label="Массив 50 000, изменить 5000 — ops/sec (больше — лучше)">
  <text x="0" y="22" font-size="16" font-weight="700" fill="currentColor">Массив 50 000, изменить 5000 — ops/sec (больше — лучше)</text>
  <text x="0" y="63" font-size="15" fill="currentColor">@virentia/mutable</text>
  <rect x="150" y="42" width="420" height="30" rx="4" fill="#a855f7"/>
  <text x="560" y="63" font-size="15" font-weight="600" text-anchor="end" fill="#fff">571</text>
  <text x="0" y="109" font-size="15" fill="currentColor">mutative</text>
  <rect x="150" y="88" width="204" height="30" rx="4" fill="#60a5fa"/>
  <text x="344" y="109" font-size="15" font-weight="600" text-anchor="end" fill="#fff">277</text>
  <text x="0" y="155" font-size="15" fill="currentColor">immer</text>
  <rect x="150" y="134" width="89" height="30" rx="4" fill="#4ade80"/>
  <text x="247" y="155" font-size="15" font-weight="600" fill="currentColor">121</text>
</svg>

<svg viewBox="0 0 620 182" width="100%" style="display:block;max-width:620px;margin:0 auto" role="img" aria-label="Массив 50 000, изменить всё — ops/sec (больше — лучше)">
  <text x="0" y="22" font-size="16" font-weight="700" fill="currentColor">Массив 50 000, изменить всё — ops/sec (больше — лучше)</text>
  <text x="0" y="63" font-size="15" fill="currentColor">@virentia/mutable</text>
  <rect x="150" y="42" width="420" height="30" rx="4" fill="#a855f7"/>
  <text x="560" y="63" font-size="15" font-weight="600" text-anchor="end" fill="#fff">53</text>
  <text x="0" y="109" font-size="15" fill="currentColor">mutative</text>
  <rect x="150" y="88" width="190" height="30" rx="4" fill="#60a5fa"/>
  <text x="330" y="109" font-size="15" font-weight="600" text-anchor="end" fill="#fff">24</text>
  <text x="0" y="155" font-size="15" fill="currentColor">immer</text>
  <rect x="150" y="134" width="135" height="30" rx="4" fill="#4ade80"/>
  <text x="275" y="155" font-size="15" font-weight="600" text-anchor="end" fill="#fff">17</text>
</svg>

</div>

Кейсы описаны в [`tests/cow.bench.ts`](https://github.com/virentia-labs/virentia/blob/main/packages/mutable/tests/cow.bench.ts); воспроизводится через `pnpm bench`. Цифры зависят от нагрузки и машины.

## API

- `mutableStore(initial)` → `MutableStore<T>`: `.value` (get: мутабельный draft; set: замена целиком), `.node`, `.subscribe(fn)`, `.map(fn)`.
- `seedMutableStore(scope, store, value)` — задать значение scope (тесты, SSR).
- `unwrap(value)` — сырой объект за мутабельным прокси.

## Гранулярная реактивность

Draft трекает чтения по **keypath**. `computed`, `map` или авто-реакция подписываются только на пути, которые реально прочитали, поэтому мутация одной ветки перезапускает только читателей этой ветки — та же мелкая гранулярность, что обычный `store` получает из структурного разделения, но с мутацией на месте.

```ts
const cart = mutableStore({ items: [] as Item[], coupon: null as string | null });

const count = computed(() => cart.value.items.length);
const coupon = computed(() => cart.value.coupon);

cart.value.items.push(item);
// Перезапустит только `count` — `coupon` не читал `items`, поэтому не тронут.
```

Правило простое: «на что читал — на то и подписан». Чтение `cart.value.items[3].text` подписывает на `items`, `items[3]` и `items[3].text`: последующее `cart.value.items[3].text = "…"` перезапустит этого читателя, а правка `items[4]` — нет.

`map` и авто-реакции подчиняются тому же правилу — они читают `.value` через тот же draft:

```ts
const total = cart.map((c) => c.items.reduce((sum, item) => sum + item.price, 0));

reaction(() => {
  // Читает только `coupon` → перезапустится только при изменении купона.
  banner.value = cart.value.coupon ? "Скидка применена" : "";
});
```

В компоненте подписывайтесь на срез через `map`/`computed`, чтобы он перерендеривался точечно — см. [React](/ru/react/use-unit#мутабельные-сторы) и [Vue](/ru/vue/use-unit#мутабельные-сторы).

Два чтения намеренно **грубые**, потому что зависят от значения целиком, а не от среза:

- `unwrap(cart.value)` берёт сырой объект, поэтому зависит от _любого_ изменения.
- `store.subscribe(...)` и `useUnit(store)` на весь стор читают всё значение и срабатывают на каждый commit.

## Когда использовать

Берите мутабельный стор для состояния, которое вы **правите на месте, вглубь и часто** — форма, rich-text или canvas-документ, большая таблица, которую вы патчите по ячейкам. Написать

```ts
doc.value.blocks[3].items[7].text = "hello";
```

проще, чем пересобирать этот путь руками, и производные остаются [гранулярными](#гранулярная-реактивность): перезапустятся только читатели `blocks[3].items[7].text`.

Два момента, оба — следствие мутации на месте:

- **Identity нестабилен.** `cart.value` мутируется на месте, поэтому ссылка на объект может не измениться до и после записи. Не сравнивайте снимки через `===`, чтобы поймать изменение — зависьте от того, что читаете, или берите обычный `store`, когда нужна identity значения.
- **Подписчики на весь объект — грубые.** `store.subscribe` и `useUnit(store)` читают всё значение и срабатывают на каждый commit. Подписывайтесь на срез через `map`/`computed`, когда потребителю нужна лишь часть состояния.

Для плоского состояния, которое вы чаще заменяете целиком, чем правите вглубь, обычный [`store`](/ru/core/stores) или [`reactive`](/ru/core/stores#реактивные-сторы) проще и даёт стабильную identity значения.

## Как это устроено

Этот раздел объясняет, как мутабельный стор работает под API. Для использования пакета он не нужен — он здесь для отладки и понимания стоимости.

### Значение — copy-on-write draft

Чтение `.value` возвращает `Proxy` над текущим закоммиченным объектом scope — _draft_. Пока вы только читаете, draft форвардит каждый доступ к нижележащему объекту; ничего не копируется, закоммиченное значение не трогается.

При первой записи в узел draft делает shallow-копию **только этого узла** и протягивает копию вверх по родителям, так что каждый предок начинает ссылаться на новый дочерний. Ветки-соседи, которые вы не трогали, сохраняют исходную ссылку. Никакого `structuredClone` и никакого полного снэпшота — это тот же copy-on-write, что и у immer с mutative.

Поскольку целью записи draft-узла служит реальный массив/объект, `length`, индексы и перечисление работают корректно, а `push`/`splice`/`sort` выполняются как нативные методы массива над копией.

### Владение: мутация на месте после первого расхождения

Стор мутируют снова и снова, поэтому пересоздавать одни и те же узлы на каждое обновление расточительно. Каждый scope помнит узлы, которые уже скопировал (свой набор _owned_). Запись в owned-узел мутирует его **на месте** — без новой копии, — а запись в ещё общий узел (равный дефолту или прошлому закоммиченному значению) копирует его один раз, а затем владеет им.

Это и есть отличие от immer и mutative, которые на каждый вызов производят новое иммутабельное значение. Поэтому бенчмарки в пользу мутабельного стора: после первого изменения пути последующие изменения — обычные присваивания на месте.

Объект, который _вы_ положили в дерево, считается общим, а не owned: при спуске и мутации он сначала копируется, так что переданный вами объект не мутируется.

### Коммит на границе транзакции

Пока вы мутируете, draft не коммитится, и каждая запись фиксирует изменённый keypath. На границе транзакции — сразу для изменения в обычном `scoped(...)` или батчем в конце реакции/эффекта (см. [Транзакции](/ru/core/transactions)) — последнее дерево draft записывается в scope, и оповещаются изменённые пути. Поскольку мутация на месте может не изменить identity объекта, оповещение **принудительное**, а не по `Object.is`: стор дёргает узлы графа для изменённых keypath'ов (плюс один грубый узел для подписчиков на весь объект), так что читатель перезапускается ровно тогда, когда записан прочитанный им путь.

Стор — это настоящий узел графа на `@virentia/core/internal`, поэтому `reaction`, `computed`, `subscribe` и `map` наблюдают его как любой стор, а per-scope значения, seed и очистка работают как обычно.

### Трекинг по keypath

Пока читатель собирает зависимости — вычисляется `computed`, выполняется авто-реакция — каждое чтение прокси репортит тронутый keypath, а стор мапит его на лениво созданный узел графа, на который читатель подписывается. Чтение репортит каждый префикс пути (get идёт родитель→ребёнок), поэтому замена предка инвалидирует глубоких читателей; запись репортит только точный путь, поэтому правка соседа — нет. Вне окна трекинга — при обычной мутации — хуки чтения не делают ничего, поэтому путь записи остаётся таким же быстрым, как мутация обычного объекта.

### Листья

Проксируются только plain object и array. `Date`, `RegExp`, `Map`, `Set` и инстансы классов — листья: чтения возвращают их сырыми, а заменяете вы их целиком (`state.value.when = new Date()`). Мутация _внутрь_ листа (`state.value.when.setHours(0)`) не отслеживается.

### Почему это быстро

Каждый изменённый узел — это один компактный state-объект (класс, ради стабильной формы) плюс один `Proxy` — без замыканий на узел и без сторонних таблиц поиска. Нетронутые узлы бесплатны (прокси создаются лениво, на доступ). Коммит мутирует на месте, и нет прохода финализации/заморозки — immer по умолчанию замораживает результат, что и доминирует в его стоимости.
