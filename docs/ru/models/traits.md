---
title: Трейты
---

# Трейты

Трейт - переиспользуемый срез модели: поля, поведение и юниты, которые их
связывают. Используйте его, когда несколько моделей делят один и тот же кусок -
таймстампы, выбор, мягкое удаление - а копии декларации в каждой модели со
временем разъехались бы.

Трейт идентифицируется ссылкой на объект. Никаких строковых имён, которые
нужно регистрировать и которые могут столкнуться.

Примеры на этой странице выполняются в активном скоупе - см.
[Экземпляры моделей](./instances).

## Общие поля

Простейший трейт только объявляет данные. Каждая модель, указавшая его в
`with`, получает поля как свои собственные:

```ts
const Timestamped = trait({
  data: { createdAt: f.date().indexed("ord") },
});

const Post = staticModel({
  with: [Timestamped],
  data: { title: f.string() },
});

const post = Post.create({
  title: "привет",
  createdAt: "2026-08-08T10:00:00.000Z",
});

post.createdAt.value; // Date - обычное поле Post
```

## Требования полей и поведения

Трейт может не объявлять, а требовать. `requires` принимает схемы полей
(«модель обязана объявить это поле») и сигнатуры `fn<...>()` («какой-то setup
обязан вернуть эту функцию»). `setup` трейта использует и то и другое через
`self`:

```ts
const Selectable = trait({
  requires: {
    selected: f.boolean(),
    canSelect: fn<() => boolean>(),
  },
  setup(self) {
    const toggle = event<void>();

    reaction({
      on: toggle,
      run: () => {
        if (!self.canSelect()) return;
        self.selected.value = !self.selected.value;
      },
    });

    return { toggle };
  },
});

const Todo = staticModel({
  with: [Selectable],
  data: {
    title: f.string(),
    selected: f.boolean(false),     // закрывает требование поля
  },
  setup() {
    return { canSelect: () => true }; // закрывает требование поведения
  },
});

const t = Todo.create({ title: "x" });

await t.toggle();   // событие трейта, доступно на экземпляре
t.selected.value;   // true
```

Что происходит:

- всё, что трейт объявляет или возвращает, протекает в `self` и на
  экземпляр - отдельного «пространства имён трейта» нет;
- необъявленное требование поля падает при декларации модели;
- нереализованное требование поведения падает после прогона всех setup.

## Правило имён

Требовать имя могут многие; объявлять - ровно один. Два объявления - двумя
трейтами, трейтом и моделью, двумя возвратами setup - падают сразу:

```ts
const A = trait({ data: { count: f.number(0) } });
const B = trait({ data: { count: f.number(0) } });

staticModel({ with: [A, B] });
// Error: declaration collision on "count" - exactly one may declare
```

Композиция остаётся читаемой: у каждого члена ровно одно место, которое его
определяет.

## Обобщённый код над экземплярами

`Impl<typeof Trait>` типизирует «любой экземпляр модели, реализующей трейт»:

```ts
import type { Impl } from "@virentia/core/models";

function selectAll<M extends Impl<typeof Selectable>>(items: readonly M[]) {
  for (const item of items) {
    if (item.canSelect()) item.toggle();
  }
}

selectAll(Todo.instances.items); // ок
selectAll(User.instances.items); // ошибка компиляции - User не реализует
```

## Параметризованные трейты

`f.arg(n)` оставляет в схеме поля дыру; применение трейта её заполняет.
Применённый трейт сохраняет идентичность исходного - обе модели ниже
реализуют `Keyed`:

```ts
const Keyed = trait({
  data: { code: f.arg(0) },
});

const Product = staticModel({ with: [Keyed(f.string())], data: {} });
const Slot = staticModel({ with: [Keyed(f.number(0))], data: {} });
```

## Контракт

```ts
function trait(config: {
  with?: readonly Trait[];
  requires?: Record<string, Field | FnRequirement>;
  data?: DataDeclaration;              // те же формы, что у data модели
  setup?: (self) => members | void;
}): Trait;

type Impl<T extends Trait>; // констрейнт для обобщённого кода
```

Трейт, пришедший несколькими путями (цепочки `with`), применяется один раз.

## Частые кейсы

Используйте трейты для:

- общих серверных полей: таймстампы, авторство, версионирование;
- общего поведения над данными модели: выбор, разворачивание, dirty-трекинг;
- базы [общих членов объединений](./unions#общие-поля) - между вариантами
  делятся только поля из трейтов;
- доменных словарей: трейт на способность, модели компонуют то, что умеют.

## Связанные разделы

- [Поля и данные](./fields) - что принимают `data` и `requires`.
- [Объединения](./unions) - почему общие поля должны идти из одного трейта.
- [Экземпляры моделей](./instances) - как ведут себя `setup` и `self`.
