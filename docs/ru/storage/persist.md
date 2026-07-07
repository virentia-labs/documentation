# Сохранение

`persist` привязывает один writable-стор к одному [боксу](/ru/storage/boxes) для одного scope и держит их синхронизированными в обе стороны.

```ts
import { scope, scoped, store } from "@virentia/core";
import { local, persist } from "@virentia/storage-core";

const draft = store("");
const app = scope();

scoped(app, () => {
  persist({ source: draft, key: "draft", storage: local() });
});
```

## Двусторонняя синхронизация

1. **гидратация** — если бокс содержит `key`, стор заполняется из него; иначе бокс заполняется текущим значением стора.
2. **стор → бокс** — каждое зафиксированное изменение в привязанном scope записывается наружу.
3. **бокс → стор** — внешние изменения (другая вкладка, назад/вперёд) подтягиваются обратно, если бокс поддерживает `watch`.

Флаг `busy` рвёт петлю write↔watch: значение из бокса не пишется в него сразу же обратно, а вызванная нами запись не возвращается как внешнее изменение.

## Scope

Сохранение по природе **на scope** — у одного браузера один `localStorage`, поэтому привязка соединяет ровно один scope с боксом. Определение стора общее для всех scope; привязка решает, чьё значение сохраняется.

По умолчанию `persist` берёт активный scope, поэтому вызывайте его внутри `scoped` — или передайте `scope` явно для setup-кода, у которого scope есть, но который не внутри фрейма:

```ts
persist({ source: draft, key: "draft", storage: local(), scope: app });
```

Вызов `persist` без активного scope и без опции `scope` бросает ошибку.

## Своя сериализация

`serialize`/`deserialize` покрывают значения, которые бокс не может пронести сам — например `Date`, который JSON превращает в строку:

```ts
const lastSeen = store(new Date());

persist({
  source: lastSeen,
  key: "lastSeen",
  storage: local(),
  serialize: (date) => date.toISOString(),
  deserialize: (raw) => new Date(raw as string),
});
```

Они работают поверх собственной сериализации бокса: `serialize` формирует значение до бокса, `deserialize` восстанавливает его после `get`.

## Время жизни

`persist` возвращает `stop()`, отсоединяющий обе стороны. Вызванная внутри [`owner`](/ru/core/owners), привязка также сама разбирается при dispose — так что модель для модалки, вкладки или превью перестаёт сохраняться, когда этот кусок UI исчезает:

```ts
import { owner } from "@virentia/core";

const model = owner(() => {
  const draft = store("");
  persist({ source: draft, key: "draft", storage: local(), scope: app });
  return { draft };
});

model.dispose(); // отсоединяет привязку
```

## Query-параметры как состояние

Привяжите стор к URL, чтобы им можно было делиться и он переживал назад/вперёд:

```ts
import { persist, query } from "@virentia/storage-core";

const search = store("");

scoped(app, () => {
  persist({ source: search, key: "q", storage: query() });
});
```

Навигация назад восстанавливает предыдущее значение через `popstate`-watch бокса. Используйте `query({ history: "push" })`, когда каждое изменение должно быть отдельной записью в истории.
