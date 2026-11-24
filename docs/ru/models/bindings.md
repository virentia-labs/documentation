---
title: UI-биндинги
---

# UI-биндинги

Запросы, экземпляры и определения моделей подключаются к существующим
`useModel` и `component` из `@virentia/react` и `@virentia/vue` - новых хуков
учить не нужно. Используйте биндинги, чтобы рендерить коллекции напрямую:
компонент подписывается ровно на то, что показывает.

## Запрос в компоненте

Список подписывается на запрос; каждая строка - на свой экземпляр:

```tsx
import { scoped } from "@virentia/core";
import { useModel, useProvidedScope } from "@virentia/react";

function TodoRow({ todo }: { todo: InstanceOf<typeof Todo> }) {
  const t = useModel(todo);

  if (!t) return null;

  return <li>{t.title.value}</li>;
}

function ActiveTodos() {
  const appScope = useProvidedScope();
  const active = useModel(scoped(appScope, () =>
    Todo.where(Todo.done.eq(false)).sort(Todo.priority.desc).take(50),
  ));

  return (
    <ul>
      {active.items.map((t) => (
        <TodoRow key={t.key} todo={t} />
      ))}
    </ul>
  );
}
```

Что происходит:

- пересборка цепочки на каждый рендер бесплатна - планы интернируются,
  результаты мемоизированы;
- список ререндерится только при изменении множества; строка - только на
  записи своего экземпляра: переименование одной задачи трогает одну строку,
  а не список;
- `t.key` - [стабильный ключ списка](./wire#стабильные-ключи-списков): без
  ремаунтов на `rebind` и склеенных строк при переиспользовании.

Во Vue те же вызовы возвращают refs: `active.value.items`,
`t.value.title.value`.

## Экземпляр по id

```tsx
function TodoScreen({ id }: { id: string }) {
  const appScope = useProvidedScope();
  const todo = useModel(scoped(appScope, () => Todo.get(id)));

  if (!todo) return <NotFound />;

  return <h1>{todo.title.value}</h1>;
}
```

`get(id)` следит за записями своего экземпляра, разрешает старые id после
[`rebind`](./wire#смена-id-rebind) - роут со временным id продолжает
работать - и отдаёт `null`, когда сущности нет или она уничтожена. Никаких
исключений посреди рендера.

## Экранные модели

Определение модели — scoped-фабрика `props → экземпляр`, поэтому
существующие сигнатуры экранных моделей принимают его напрямую:

```tsx
const OrderView = component({ model: OrderScreen, view: OrderLayout });

// или императивно:
const order = useModel(OrderScreen, { orderId });
```

Что происходит:

- экземпляр создаётся в предоставленном скоупе - обычный `create`;
- изменения пропсов мержатся в экземпляр (присутствующие ключи побеждают);
- анмаунт уничтожает экземпляр;
- `component.create()` возвращает controlled-экземпляр, который вью никогда
  не уничтожает - им владеет создатель.

## Состояние сквозь анмаунты: `keep`

```tsx
useModel(SettingsScreen, props, { keep: true });
// component({ model: SettingsScreen, view, keep: true })
```

`keep` меняет одно: анмаунт больше не диспозит. Ремаунт снова находит
экземпляр и домерживает текущие пропсы; жизнь завершает явный `remove` или
скоуп.

Кого находит ремаунт:

- без `id` в пропсах - единственный экземпляр модели в скоупе (настройки,
  единственная форма). Несколько живых экземпляров делают выбор
  неоднозначным - это dev-ошибка, а не молчаливый выбор;
- с `id` в пропсах - экземпляр с этим id (вкладки, master-detail, id
  приходит из роута или документа).

Опций `cache`/`key` у моделей нет - коллекция уже и есть кеш, `keep` просто
оставляет экземпляр в ней.

## Инспектор

Коллекции показываются в инспекторе агрегированно - количество сущностей,
размеры индексов, планы запросов - вместо записи на каждый экземпляр. Тысяча
строк списка - это нагрузка, а не тысяча скоупов в devtools.

## Контракт

```ts
// React и Vue, одинаковые формы; Vue возвращает refs
useModel(query): query;                        // живой вид запроса
useModel(scoped(appScope, () => Todo.get(id))): Instance | null; // вид сущности
useModel(Definition, props?, { keep? }): Instance | null;

component({ model: Definition, view, keep?, mapProps? });
Component.create(props): Instance;             // controlled-экземпляр
```

## Частые кейсы

Используйте биндинги для:

- списковых экранов - запрос, собранный в рендере, строки с ключом `t.key`;
- детальных экранов - `useModel(scoped(appScope, () => Todo.get(id)))` с фолбэком на `null`;
- состояния экрана, переживающего переключение вкладок, - `keep: true`;
- диалогов и редакторов, которыми владеет родитель, - `component.create()`.

## Связанные разделы

- [Запросы и индексы](./queries) - почему инлайн-цепочки бесплатны.
- [Загрузка и сериализация](./wire) - `rebind`, форвардинг, стабильные ключи.
- [Модели в React](/ru/react/models) и [во Vue](/ru/vue/models) -
  фреймворк-специфика.
