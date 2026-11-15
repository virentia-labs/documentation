---
title: Связи
---

# Связи

Связи соединяют сущности между коллекциями. Используйте `refs`, когда
сущность указывает на другую, живущую своей жизнью (пост и его автор), и
`children`, когда дочерние сущности существуют только как часть родителя
(доска и её колонки). Хранение всегда по id; навигация выглядит объектной.

Примеры на этой странице выполняются в активном скоупе - см.
[Экземпляры моделей](./instances).

## Ссылки

`refs.one` хранит один id и разрешает его при чтении:

```ts
const Post = staticModel({
  data: { title: f.string(), author: refs.one(() => User) },
});

const User = staticModel({
  data: { login: f.string() },
});

const bob = User.create({ login: "bob" });
const post = Post.create({ title: "привет" });

post.author.value = bob;   // связать (строка-id тоже работает)
post.author.value?.login.value; // "bob"
post.json().author;        // id боба - ссылки сериализуются как id
```

`refs.many` хранит упорядоченный набор id: `add`/`remove`, `ids`, `items`,
`count`.

## Дети

Дети - композиция: создаются через родителя, уничтожаются вместе с ним.

```ts
const Board = staticModel({
  data: {
    title: f.string(),
    columns: children.many(() => Column),
  },
});

const Column = staticModel({
  data: { name: f.string() },
});

const board = Board.create({ title: "Спринт" });

board.columns.add({ name: "В работе" });
board.columns.items;   // [Column]
board.columns.move(board.columns.items[0], 0);

Column.create({ name: "бесхозная" });
// Error: Column is owned as children - create it through the parent

board.dispose();
Column.instances.count; // 0 - каскад
```

В JSON дети встроены: `json()` родителя содержит объекты детей, а загрузка
массива детей - реконсиляция: известные id мержатся, отсутствующие
уничтожаются, порядок берётся из массива.

## Обратная сторона: `inverse`

По умолчанию связь односторонняя. Чтобы видеть её с другой стороны, объявите
`inverse` - вид над владеющим полем, без собственного хранения:

```ts
const User = staticModel({
  data: {
    login: f.string(),
    posts: inverse(() => Post.author),
  },
});

bob.Post.instances.items;        // все посты, у которых author - bob
bob.posts.link(post);   // то же, что post.author.value = bob
bob.posts.unlink(post);
```

Что происходит:

- данные живут один раз, на владеющей стороне - стороны не могут разойтись;
- инверс никогда не сериализуется;
- его кардинальность выводится: инверс `children.many` и
  `refs.one(...).unique()` - одиночный `value`, иначе - список-запрос.

`refs.one(() => User).unique()` делает связь один-к-одному: вторая сущность,
указывающая на ту же цель, падает при записи.

## Циклы и самоссылки

Передавайте цель значением, когда она объявлена выше; санком, когда она ниже
или в другом файле; `Self` - для самой модели. Санки разрешаются при первой
навигации, поэтому взаимные ссылки не требуют аннотаций:

```ts
// post.ts
export const Post = staticModel({
  data: { title: f.string(), author: refs.one(() => User) },
});

// user.ts
export const User = staticModel({
  data: { login: f.string(), posts: inverse(() => Post.author) },
});
```

```ts
const Category = staticModel({
  data: {
    name: f.string(),
    children: children.many(Self),
    parent: inverse(() => Self.children),
  },
});
```

Оба варианта компилируются с полной типизацией навигации -
`post.author.value?.login.value` знает, что это `User`.

## Политики удаления

Когда сущность, на которую ссылаются, уничтожается, каждое `refs`-поле,
указывающее на неё, применяет свою политику:

```ts
author: refs.one(() => User),                    // nullify (дефолт): связь становится null
author: refs.one(() => User).policy("restrict"), // dispose падает, пока есть ссылки
author: refs.one(() => User).policy("orphan"),   // id остаётся, чтения дают null
```

```ts
User.instances.remove(bob.id);
post.author.value; // null - дефолтная политика очистила связь
```

Детям политика не нужна - они всегда умирают с родителем.

## Загрузка в любом порядке

Id ссылки может прийти раньше своей цели:

```ts
const post = Post.create({ title: "x", author: "u1" }); // u1 ещё не загружен

post.author.value;            // null - пока
User.create({ id: "u1", login: "bob" });
post.author.value?.login.value; // "bob" - то же чтение, теперь разрешилось
```

## Контракт

```ts
refs.one(target)      // хранит id | null;   вид: { value }
refs.many(target)     // хранит id[];        вид: { add, remove, ids, items, count }
children.one(target)  // хранит id | null;   вид: { value, create, clear }
children.many(target) // хранит id[];        вид: { add, remove, move, ids, items, count }
inverse(() => Model.field) // вид без хранения над владеющим полем

// target: Model | Union | () => Model | Union | Self
// модификаторы: .unique(), .policy("nullify" | "restrict" | "orphan")
```

## Частые кейсы

Используйте связи для:

- внешних ключей с сервера - `refs.one` с id прямо из JSON;
- вложенных серверных ответов - `children.many`, встроенные в обе стороны;
- двунаправленной навигации - одна владеющая сторона плюс `inverse`;
- деревьев - `children.many(Self)` с `inverse`-родителем;
- many-to-many - `refs.many` с одной стороны, `inverse` с другой; если ребру
  нужны свои данные - сделайте явную модель с двумя `refs.one`.

## Связанные разделы

- [Объединения](./unions#объединение-в-связях) - целью связи может быть объединение.
- [Загрузка и сериализация](./wire) - как сериализуются ссылки и дети.
- [Запросы и индексы](./queries) - инверсные виды похожи на запросы.
