---
title: Коллекции и экземпляры
---

# Коллекции и экземпляры

Коллекция - это место, где живут экземпляры модели: единственный способ их
создать, место выполнения запросов и владелец их жизненного цикла.
Используйте её как единственный источник истины «какие сущности сейчас
существуют» - компоненты, эффекты и тесты читают одну и ту же коллекцию через
скоуп.

## Создание коллекции

`collection(Model)` - get-or-create на скоуп:

```ts
import { scope, scoped } from "@virentia/core";
import { collection } from "@virentia/core/models";

const appScope = scope();

scoped(appScope, () => {
  const todos = collection(Todo);

  collection(Todo) === todos; // true - тот же скоуп, та же коллекция
});
```

Разные скоупы держат полностью независимые популяции - SSR-запросы и тесты не
видят сущностей друг друга. Остальные примеры предполагают активный скоуп.

## Добавление и мерж

`add` принимает JSON. Новый id создаёт, известный - мержит: присутствующие
ключи побеждают, отсутствующие остаются:

```ts
const todos = collection(Todo);

todos.add({ id: "1", title: "написать доку" });     // создание
todos.add({ id: "1", done: true });                 // мерж - title не тронут
todos.get("1")!.title.value;                        // "написать доку"

todos.add({ id: "1", title: "переписать" }, { replace: true });
// replace - отсутствующие опциональные ключи сбрасываются в дефолты
```

Массив - один батч: валидируется заранее, а при падении элемента созданное
откатывается:

```ts
todos.add([{ title: "a" }, { title: "b" }]); // оба или ни одного
```

Что происходит:

- мерж - это то, как работают обновления с сервера: пере-`add` загруженного
  списка обновляет существующие экземпляры на месте, ссылки на них остаются
  валидными;
- частичный вход с неизвестным id - ошибка с перечислением недостающих
  ключей: полусозданных сущностей не бывает;
- `Model.create(props)` - сокращение для `collection(Model).add(props)` в
  активном скоупе.

## Чтение и запись

Поля - сторы; члены из `setup` вызываются на экземпляре:

```ts
const t = todos.add({ title: "x" });

t.title.value;          // "x"
t.done.value = true;    // обычная запись в стор - запросы обновляются сразу
```

Зарезервированная поверхность каждого экземпляра:

```ts
t.id;            // id сущности: пришёл с данными или сгенерирован (временный)
t.key;           // стабильный UI-ключ - переживает rebind, уникален при переиспользовании
t.alive;         // существует ли экземпляр; реактивно, безопасно читать и после dispose
t.json();        // сериализация обратно в JSON
t.dispose();     // уничтожает экземпляр: каскад детей, снятие из индексов
t.rebind(newId); // смена id с сохранением экземпляра
t.onCleanup(fn); // привязывает внешний ресурс к жизни экземпляра
```

## Поведение на каждый экземпляр

`setup` связывает события и реакции. В `staticModel` он выполняется один раз -
юниты общие, - но каждая реакция всё равно ведёт себя по-экземплярно:

```ts
const Todo = staticModel({
  data: { done: f.boolean(false) },
  setup(self) {
    const toggled = event<void>();

    reaction({
      on: toggled,
      run: () => {
        self.done.value = !self.done.value;
      },
    });

    return { toggled };
  },
});

const a = todos.add({});
const b = todos.add({});

await a.toggled();

a.done.value; // true
b.done.value; // false - не тронут
```

Поскольку `setup` статической модели выполняется без конкретного экземпляра,
API экземпляра на `self` (`self.id`, `self.json()`, ...) доступен только в
телах юнитов - реакциях и эффектах, - где экземпляр существует.

## Реакция на состояние приложения

Реакция на внешний стор выполняется для каждого живого экземпляра, и каждый
запуск видит свои поля:

```ts
const filter = store("");

const Todo = staticModel({
  data: { title: f.string(), visible: f.boolean(true) },
  setup(self) {
    reaction({
      on: filter,
      run: (value) => {
        self.visible.value = self.title.value.includes(value);
      },
    });
  },
});
```

Одно изменение `filter.value` - и каждая задача пересчитывает свой `visible`.
Нет экземпляров - нет запусков; чужие скоупы не затрагиваются.

## Уничтожение

`dispose()` (или `collection.remove(id)`) каскадирует детей, применяет
[политики удаления](./relations#политики-удаления) и убирает экземпляр из
индексов и запросов. После этого:

- чтение поля бросает `entity was disposed`, и ошибка называет место, где
  случился dispose;
- `alive` становится `false` - реактивно, так что вью деградируют без `try`:

```ts
const label = computed(() => (t.alive ? t.title.value : "удалено"));

todos.remove(t.id);
label.value; // "удалено"
```

Текучка статических экземпляров дешева: скоуп уничтоженного возвращается в пул и
переиспользуется следующим `add`. Устаревшие ссылки безопасны - `t.key` не
повторяется, а старый хендл бросает ошибку, вместо того чтобы читать нового
жильца.

## Внешние ресурсы: `onCleanup`

Когда экземпляр держит что-то вне модели - топик сокета, маркер на карте,
DOM-слушатель, - `onCleanup` привязывает освобождение к жизни экземпляра. Ни
стора под функцию отписки, ни отдельных юнитов на каждый экземпляр:

```ts
const Ticker = staticModel({
  data: { symbol: f.string("") },
  setup(self) {
    const connect = event<void>();

    reaction({
      on: connect,
      run: () => {
        // подписка теперь принадлежит амбиентному экземпляру
        self.onCleanup(feed.subscribeTopic(self.symbol.value, onMessage));
      },
    });

    return { connect };
  },
});
```

Что происходит:

- клинапы выполняются при dispose, после гейта `restrict`, пока поля ещё
  читаемы;
- каждый экземпляр хранит только свои клинапы - уничтожение одного тикера
  отписывает один топик;
- `onCleanup` возвращает функцию отмены регистрации; упавшая очистка
  попадает в отчёт об ошибке и не прерывает уничтожение;
- работает и снаружи (`t.onCleanup(fn)`) - интеграции привязывают ресурсы к
  сущностям, которые рендерят;
- в `setup` статической модели зовите его из тел юнитов - там существует
  амбиентный экземпляр; в динамической `model` он работает прямо в теле
  setup, а подписки юнитов, созданные там, и так чистятся автоматически.

### Привязка снаружи

Интеграция владеет ресурсом на сущность - пином на карте, серией графика,
DOM-узлом. Привяжите его к сущности снаружи:

```ts
for (const city of cities.items) {
  const marker = map.addMarker(city.lat.value, city.lng.value);

  city.onCleanup(() => marker.remove()); // сущность уходит - пин уходит
}
```

Возвращённая функция снимает регистрацию, не дожидаясь dispose, - для
ресурсов, которые вы забираете обратно вручную:

```ts
const release = row.onCleanup(() => highlight.remove());

// позже, когда строка теряет выделение, но остаётся жива:
release();
highlight.remove();
```

### Отмена незавершённой работы

Динамическая модель создаёт контроллер прямо в теле setup; уничтожение
экземпляра отменяет всё, что ещё выполняется:

```ts
const ReportJob = model({
  data: { query: f.string("") },
  setup(self) {
    const controller = new AbortController();

    self.onCleanup(() => controller.abort()); // dispose отменяет запрос

    const start = event<void>();

    reaction({
      on: start,
      run: async () => {
        const rows = await api.report(self.query.value, {
          signal: controller.signal,
        });

        // ...
      },
    });

    return { start };
  },
});
```

В статической модели замыканий на экземпляр нет - узаконенное место под
хэндл ресурса - это **локальное поле**, своё у каждого экземпляра. Новый запрос
отменяет предыдущий, dispose отменяет текущий, а `release()` в `finally` не
даёт регистрациям копиться от рана к рану:

```ts
const Search = staticModel({
  data: (p: Props<{ query: string }>) => ({
    query: f.string(p.query),
    results: f.array(f.string(), []).local(),
    inFlight: f.any(null).local(), // слот этого экземпляра
  }),
  setup(self) {
    const search = event<void>();

    reaction({
      on: search,
      run: async () => {
        self.inFlight.value?.abort(); // новый побеждает; abort() идемпотентен

        const controller = new AbortController();
        const release = self.onCleanup(() => controller.abort());

        self.inFlight.value = controller;

        try {
          self.results.value = await api.search(self.query.value, {
            signal: controller.signal,
          });
        } catch (error) {
          if (!controller.signal.aborted) throw error; // отменили - не ошибка
        } finally {
          release(); // запрос закончился - регистрация больше не нужна
        }
      },
    });

    return { search };
  },
});
```

Записи в `self` после `await` попадают в правильный экземпляр: скоуп
переживает приостановку, и у каждого экземпляра он свой.

### Переподписка при смене данных

В динамической модели замыкания на экземпляр легальны - держите текущую
отписку в замыкании и ротируйте её; `onCleanup` освободит последнюю:

```ts
const Chart = model({
  data: { symbol: f.string("") },
  setup(self) {
    let drop: (() => void) | undefined;

    reaction(() => {
      // перезапускается при каждой смене symbol
      drop?.();
      drop = feed.subscribeTopic(self.symbol.value, draw);
    });

    self.onCleanup(() => drop?.());
  },
});
```

### WebSocket на экземпляр

Живое соединение в статической модели держится на тех же двух инструментах:
локальное поле хранит сокет, `onCleanup` его закрывает. Колбэки сокета
срабатывают вне модельного контекста, поэтому идут через захваченный фасад -
никогда через `self`:

```ts
const Room = staticModel({
  data: (p: Props<{ channel: string }>) => ({
    channel: f.string(p.channel),
    messages: f.array(f.string(), []).local(),
    socket: f.any(null).local(),
  }),
  setup(self) {
    const joined = event<void>();
    const send = event<string>();

    reaction({
      on: joined,
      run: () => {
        const me = collection(Room).get(self.id)!; // колбэки бегут вне модельного контекста

        const socket = new WebSocket(`wss://chat.example/${self.channel.value}`);

        socket.onmessage = (event) => {
          me.messages.value = [...me.messages.value, event.data]; // маршрут в ЭТУ комнату
        };

        self.socket.value = socket;
        self.onCleanup(() => socket.close()); // вышли из комнаты - закрыли соединение
      },
    });

    reaction({
      on: send,
      run: (text) => self.socket.value?.send(text),
    });

    return { joined, send };
  },
});
```

Почему фасад: внутри `onmessage` амбиентного экземпляра нет, и `self`
разрешался бы в никуда - захваченный `me` маршрутизирует к своему экземпляру
откуда угодно, как в примере с таймерами ниже.

### Таймеры, переживающие стек вызова

Колбэк таймера срабатывает вне какого-либо модельного контекста - амбиентного
экземпляра там уже нет. Захватите фасад заранее: он маршрутизирует к своему
экземпляру откуда угодно:

```ts
const Monitor = staticModel({
  data: { url: f.string("") },
  setup(self) {
    const started = event<void>();
    const check = event<void>();

    reaction({
      on: check,
      run: async () => {
        // пингуем self.url.value ...
      },
    });

    reaction({
      on: started,
      run: () => {
        const me = collection(Monitor).get(self.id)!; // фасад живёт и вне тел юнитов

        const timer = setInterval(() => void me.check(), 5_000);

        self.onCleanup(() => clearInterval(timer)); // удалили монитор - остановили его опрос
      },
    });

    return { started, check };
  },
});
```

## Контракт

```ts
function collection<M>(model: M, scope?: Scope): Collection<M>;

interface Collection<M> extends Query<InstanceOf<M>> {
  add(input: Dto | ({ id: string } & Partial<Dto>), options?: { replace?: boolean }): InstanceOf<M>;
  add(input: readonly Input[], options?: { replace?: boolean }): InstanceOf<M>[];
  get(id: string): InstanceOf<M> | null; // реактивен, разрешает алиасы rebind
  remove(id: string): void;
}

interface InstanceApi {
  readonly id: string;
  readonly key: string;
  readonly alive: boolean;
  json(): Record<string, unknown>;
  dispose(): void;
  rebind(newId: string): void;
  onCleanup(cleanup: () => void): () => void; // возвращает отмену регистрации
}
```

## Частые кейсы

Используйте коллекции для:

- кеша серверных списков - `add` ответа, мерж сохраняет ссылки валидными;
- реестров сущностей на несколько экранов - одна коллекция на скоуп;
- оптимистичного создания - `add` без id, [rebind позже](./wire#смена-id-rebind);
- тестовых сетапов - свежий скоуп даёт свежую изолированную популяцию.

## Связанные разделы

- [Запросы и индексы](./queries) - каждая коллекция одновременно запрос.
- [Связи](./relations) - дети создаются через родителя.
- [Загрузка и сериализация](./wire) - `json()`, временные id, `rebind`.
