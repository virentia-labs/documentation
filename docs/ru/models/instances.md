---
title: Экземпляры моделей
---

# Экземпляры моделей

Создавайте и находите экземпляры через саму модель. Её реестр хранится в
scoped-сторе: одно определение работает с независимыми приложениями,
SSR-запросами и параллельными тестами.

## Создание и поиск

`create` использует активный скоуп приложения. `get` только ищет существующий
экземпляр и возвращает `null`, если такого ID нет.

```ts
import { scope, scoped } from "@virentia/core";
import { f, staticModel } from "@virentia/core/models";

const Todo = staticModel({ data: { title: f.string(), done: f.boolean(false) } });
const appScope = scope();

const todo = scoped(appScope, () => Todo.create({ id: "1", title: "Написать доку" }));
scoped(appScope, () => Todo.get("1") === todo); // true
scoped(scope(), () => Todo.get("1"));          // null: другой скоуп
```

Полученный экземпляр привязан к своему скоупу: его поля и юниты доступны и
вне `scoped`. Остальные примеры выполняются в активном скоупе.

## Создание и мерж

`create` принимает JSON. Новый ID создаёт экземпляр, известный ID обновляет
тот же экземпляр. Присутствующие ключи записываются, отсутствующие не меняются.

```ts
Todo.create({ id: "1", title: "Написать доку" });
Todo.create({ id: "1", done: true });
Todo.get("1")!.title.value; // "Написать доку"

Todo.create({ id: "1", title: "Переписать" }, { replace: true });
// Отсутствующие опциональные поля сбрасываются в дефолты; локальные не меняются.

const batch = Todo.create([{ title: "A" }, { title: "B" }]);
```

Частичный вход с неизвестным ID завершится ошибкой, если не хватает обязательных
полей. Массив сначала валидируется; при ошибке создания новые экземпляры этого
батча освобождаются.

## Все экземпляры и LINQ

`Todo.instances` — реактивный запрос без фильтра для текущего скоупа.
Он фиксирует этот скоуп: запрос можно передать рендереру или читать позже.
Отфильтрованная выборка начинается прямо с модели:

```ts
Todo.instances.count;
Todo.instances.items;
Todo.where(Todo.done.eq(false)).take(10).first;
Todo.instances.select(Todo.title);
```

Терминалы полной выборки находятся под `instances`, чтобы поле вроде
`Todo.count` оставалось дескриптором. Сортировка, проекции, массовые изменения
и реактивный поиск описаны в [Запросах и индексах](./queries).

## Синглтон из существующей модели {#model-singleton}

Каждый вызов `Todo.static(input?)` создаёт новую независимую модель с
собственными нативными сторами, событиями и эффектами. Результаты не
кешируются и не входят в `Todo.instances`; обычные экземпляры `Todo.create`
также остаются независимыми.

```ts
const draft = Todo.static({ title: "Черновик" }); // активный scope не нужен
const other = Todo.static({ title: "Черновик" }); // другие нативные юниты
draft === other;                                // false

const first = scope(), second = scope();
scoped(first, () => { draft.title.value = "Изменено"; });
scoped(first, () => other.title.value);         // "Черновик": другая модель
scoped(second, () => draft.title.value);         // "Черновик"
```

У каждого результата значения изолированы скоупом приложения. Читайте и
вызывайте юниты внутри `scoped` или передайте модель через пропс `model`: рендерер привяжет
его к своему скоупу. Нативные юниты работают в `reaction` и `scope({ values,
handlers })`, включая подмену обработчиков эффектов.

Метод есть у `model` и `staticModel`. Вход можно опустить, если у всех полей
есть дефолты; иначе передайте обязательные поля DTO. У каждого вызова свой
начальный вход и новый запуск `setup`. Ресурсы каждого скоупа инициализируйте
в `onCreate`. Для SSR задайте исходной модели стабильный `sid` либо `name` и
сохраняйте одинаковый порядок её вызовов `.static()` на сервере и клиенте:
отдельное пространство SID каждого результата включает номер объявления.

## Чтение и запись

Поля - сторы; члены из `setup` вызываются на экземпляре:

```ts
const t = Todo.create({ title: "x" });

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

const a = Todo.create({});
const b = Todo.create({});

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

`dispose()` (или `Model.instances.remove(id)`) каскадирует детей, применяет
[политики удаления](./relations#политики-удаления) и убирает экземпляр из
индексов и запросов. После этого:

- чтение поля бросает `entity was disposed`, и ошибка называет место, где
  случился dispose;
- `alive` становится `false` - реактивно, так что вью деградируют без `try`:

```ts
const label = computed(() => (t.alive ? t.title.value : "удалено"));

Todo.instances.remove(t.id);
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
        const me = Room.get(self.id)!; // колбэки бегут вне модельного контекста

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
        const me = Monitor.get(self.id)!; // фасад живёт и вне тел юнитов

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
interface ModelAccess<M> {
  static(...args: {} extends Dto<M> ? [input?: Dto<M>] : [input: Dto<M>]): SingletonOf<M>;
  create(input: AddInput<M>, options?: { replace?: boolean }): InstanceOf<M>;
  create(input: readonly AddInput<M>[], options?: { replace?: boolean }): InstanceOf<M>[];
  get(id: string): InstanceOf<M> | null;
  readonly instances: TypedQuery<InstanceOf<M>>;
  where(predicate: Predicate | ((item: InstanceOf<M>) => boolean)): TypedQuery<InstanceOf<M>>;
  sort(by: SortToken): TypedQuery<InstanceOf<M>>;
  take(count: number): TypedQuery<InstanceOf<M>>;
}

interface InstanceApi {
  readonly id: string;
  readonly key: string;
  readonly alive: boolean;
  json(): Record<string, unknown>;
  dispose(): void | Promise<void>;
  rebind(newId: string): void;
  onCleanup(cleanup: () => void): () => void; // возвращает отмену регистрации
}
```

`SingletonOf<M>` содержит поля как полноценные юниты `StoreWritable<T>`,
члены setup, связи и API экземпляра. Он не фиксирует скоуп: новый скоуп
начинается с исходных значений.

## Частые кейсы

Используйте реестр модели для:

- кеша серверных списков - `create` ответа, мерж сохраняет ссылки валидными;
- реестров сущностей на несколько экранов - один реестр модели на скоуп;
- оптимистичного создания - `create` без id, [rebind позже](./wire#смена-id-rebind);
- тестовых сетапов - свежий скоуп даёт свежую изолированную популяцию.

## Связанные разделы

- [Запросы и индексы](./queries) - `Model.instances` — запрос без фильтра.
- [Связи](./relations) - дети создаются через родителя.
- [Загрузка и сериализация](./wire) - `json()`, временные id, `rebind`.
