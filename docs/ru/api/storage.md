# API @virentia/storage-core

`@virentia/storage-core` сохраняет сторы Virentia в подключаемые хранилища. `@virentia/core` — peer-зависимость.

## persist

```ts
import { persist } from "@virentia/storage-core";

const stop = persist({
  source, // StoreWritable<T> — стор для сохранения
  key, // string — ключ в боксе
  storage, // StorageBox — local() | session() | query() | memory() | custom()
  scope, // Scope — по умолчанию текущий активный scope
  serialize, // (value: T) => unknown — значение → хранимый вид
  deserialize, // (raw: unknown) => T — хранимый вид → значение
});
```

Держит `source` и `storage` синхронными в обе стороны для `scope`: гидратация при старте, запись при изменении и подтягивание внешних изменений, если бокс поддерживает `watch`. Возвращает `stop()`, а внутри `owner` разбирается при dispose. Бросает ошибку, когда активного scope нет и ни один не передан.

## Боксы

### local

```ts
import { local } from "@virentia/storage-core";

const box = local(); // local({ serializer })
```

На `localStorage`. Переживает перезагрузки, общий для вкладок; `watch` срабатывает на записи из других вкладок. Падает в `memory()`, когда Web Storage недоступен или заблокирован.

### session

```ts
import { session } from "@virentia/storage-core";

const box = session(); // session({ serializer })
```

На `sessionStorage`. Ограничен одной вкладкой. Падает в `memory()`, когда недоступен.

### query

```ts
import { query } from "@virentia/storage-core";

const box = query(); // query({ serializer, history: "replace" | "push" })
```

На query-строке URL. Каждый ключ — параметр `?key=value`. `watch` слушает `popstate`. По умолчанию `querySerializer` и `history: "replace"`. Падает в `memory()` вне браузера.

### memory

```ts
import { memory } from "@virentia/storage-core";

const box = memory(); // memory([["key", value]])
```

`Map` в процессе. Хранит ссылки, без сериализации; `watch` срабатывает на записи в том же процессе. Запасной вариант для DOM-боксов.

### custom

```ts
import { custom } from "@virentia/storage-core";

const box = custom({
  get: (key) => /* … */ undefined,
  set: (key, value) => {},
  remove: (key) => {},
  watch: (key, listener) => () => {}, // опционально
});
```

Адаптирует пользовательский бэкенд в `StorageBox`. Точка расширения за встроенными боксами.

## Сериализаторы

### jsonSerializer

```ts
import { jsonSerializer } from "@virentia/storage-core";
```

Строгий JSON в обе стороны. По умолчанию для `local` и `session`.

### querySerializer

```ts
import { querySerializer } from "@virentia/storage-core";
```

Строки проходят как есть; остальное — JSON. При чтении сначала пробуется JSON с откатом на сырую строку. По умолчанию для `query`.

## Типы

```ts
import type {
  StorageBox,
  Serializer,
  StringBoxOptions,
  QueryBoxOptions,
  CustomStorage,
  PersistOptions,
} from "@virentia/storage-core";
```

- `StorageBox` — контракт бокса: `get`, `set`, `remove`, опциональный `watch`.
- `Serializer` — `read(raw: string)` / `write(value: unknown)`.
- `StringBoxOptions` — `{ serializer? }`, общий для `local`/`session`.
- `QueryBoxOptions` — `{ serializer?, history? }` для `query`.
- `CustomStorage` — форма бэкенда, которую принимает `custom`.
- `PersistOptions<T>` — аргумент `persist`.
