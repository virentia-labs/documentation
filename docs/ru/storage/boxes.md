# Боксы хранилищ

**Бокс** — это бэкенд, из которого `persist` читает и в который пишет. Все боксы реализуют один небольшой контракт, поэтому стор переводится на другой бэкенд заменой одного вызова фабрики.

```ts
interface StorageBox {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  watch?(key: string, listener: (value: unknown) => void): () => void;
}
```

Значения на границе этого интерфейса уже **десериализованы** — бокс на строках (Web Storage, URL) сам занимается сериализацией, бокс на ссылках (память) не сериализует вовсе. `get` возвращает `undefined` для отсутствующего ключа. `watch` опционален: бокс реализует его, только если умеет замечать **внешние** изменения.

## local

На `localStorage`. Переживает перезагрузки и перезапуски, общий для вкладок одного origin; записи из других вкладок приходят через `watch`.

```ts
import { local } from "@virentia/storage-core";

const box = local();
box.set("user", { name: "Ada" }); // сохранено как '{"name":"Ada"}'
box.get("user"); // { name: "Ada" }
```

## session

На `sessionStorage`. Ограничен одной вкладкой, очищается при её закрытии. Тот же API, что у `local`, без синхронизации между вкладками.

```ts
import { session } from "@virentia/storage-core";

const box = session();
```

## query

На query-строке URL — каждый ключ это параметр `?key=value`. Чтение и запись идут через `history.replaceState` (или `pushState`), которые не вызывают `popstate`, поэтому запись не возвращается эхом в стор; `watch` слушает `popstate`, то есть навигацию назад/вперёд.

```ts
import { query } from "@virentia/storage-core";

const box = query();
box.set("q", "docs"); // → ?q=docs
box.set("page", 2); // → ?q=docs&page=2
```

`query` по умолчанию использует `querySerializer`: строки проходят как есть ради читаемых URL, остальное — JSON; при чтении сначала пробуется JSON с откатом на сырую строку. Добавлять запись в историю на каждое изменение — через `history: "push"`:

```ts
const box = query({ history: "push" });
```

## memory

`Map` в процессе. Хранит ссылки (без сериализации), не трогает DOM и служит запасным вариантом, в который падают DOM-боксы. `watch` срабатывает на записи в том же процессе, поэтому несколько привязок на одном memory-боксе остаются синхронными. Используйте для тестов, небраузерных runtime или явного in-memory-слоя.

```ts
import { memory } from "@virentia/storage-core";

const box = memory([["theme", "dark"]]); // необязательный сид
```

## custom

Точка расширения за встроенными боксами — они заранее собранные реализации `custom`. Дайте бэкенд, получите `StorageBox`. Оборачивание (а не передача объекта напрямую) фиксирует публичную поверхность, поэтому бэкенд может нести лишние методы, не протекая наружу.

```ts
import { custom } from "@virentia/storage-core";

const cookies = custom({
  get: (key) => readCookie(key),
  set: (key, value) => writeCookie(key, value),
  remove: (key) => deleteCookie(key),
  // опционально: watch(key, listener) => () => void
});
```

`get`/`set`/`remove` обязательны; `watch` — только когда бэкенд умеет сообщать о внешних изменениях.

## Сериализация

Боксы на строках (`local`, `session`, `query`) принимают `serializer` — он превращает значение в хранимую строку и обратно:

```ts
interface Serializer {
  read(raw: string): unknown;
  write(value: unknown): string;
}
```

`local` и `session` по умолчанию используют `jsonSerializer` (строгий JSON), `query` — `querySerializer` (читаемые URL). Передайте свой для другой кодировки:

```ts
import { local, type Serializer } from "@virentia/storage-core";

const base64: Serializer = {
  write: (value) => btoa(JSON.stringify(value)),
  read: (raw) => JSON.parse(atob(raw)),
};

const box = local({ serializer: base64 });
```

Бокс, не сумевший разобрать хранимую строку (испорченные данные, внешняя запись в другом формате), возвращает из `get` `undefined`, а не бросает ошибку.

## SSR и недоступные окружения

`local`, `session` и `query` проверяют окружение при создании. Когда Web Storage отсутствует (сервер, воркер) или заблокирован (приватный режим, изолированный iframe), они падают в `memory()`. Тот же код модели работает на сервере без проверок; там ничего не сохраняется — и это правильно для запуска на один запрос.
