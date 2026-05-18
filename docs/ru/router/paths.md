---
title: Шаблоны путей
---

# Шаблоны путей

`@virentia/router-paths` компилирует строку пути в две функции: `parse` и
`build`. Пакет не зависит от выполнения Virentia, React и `history`.

```ts
import { compile, type ParseUrlParams } from "@virentia/router-paths";

type Params = ParseUrlParams<"/users/:id<number>">;
// { id: number }

const userPath = compile("/users/:id<number>");

userPath.parse("/users/42");
// { path: "/users/42", params: { id: 42 } }

userPath.build({ id: 42 });
// "/users/42"
```

## API

```ts
const path = compile("/users/:id<number>");

path.parse(pathname);
path.build(params);
```

`parse` возвращает `null`, если строка не подходит под шаблон. `build` собирает
путь из параметров и проверяет форму параметров через TypeScript.

Для пути без параметров значение `params` во время выполнения равно `null`, а `build` можно
вызвать без аргументов.

## Строковые параметры

Обычный параметр парсится как строка:

```ts
const userPath = compile("/users/:id");

userPath.parse("/users/alice");
// { path: "/users/alice", params: { id: "alice" } }

userPath.build({ id: "alice" });
// "/users/alice"
```

## Числовые параметры

`<number>` нужен, когда сегмент должен стать числом:

```ts
const invoicePath = compile("/invoices/:id<number>");

invoicePath.parse("/invoices/100");
// { path: "/invoices/100", params: { id: 100 } }

invoicePath.parse("/invoices/abc");
// null
```

Тип параметров:

```ts
type Params = ParseUrlParams<"/invoices/:id<number>">;
// { id: number }
```

## Union-параметры

Union ограничивает параметр списком строк:

```ts
const docsPath = compile("/docs/:tab<overview|api>");

docsPath.parse("/docs/api");
// { path: "/docs/api", params: { tab: "api" } }

docsPath.parse("/docs/random");
// null
```

Тип параметров:

```ts
type Params = ParseUrlParams<"/docs/:tab<overview|api>">;
// { tab: "overview" | "api" }
```

## Опциональные параметры

`?` делает один сегмент необязательным:

```ts
const profilePath = compile("/users/:id?");

profilePath.parse("/users");
// { path: "/users", params: { id: undefined } }

profilePath.build({ id: undefined });
// "/users"
```

Если значение должно сочетаться с разными страницами, обычно удобнее хранить его
в строке запроса и использовать `router.trackQuery`.

## Параметры из нескольких сегментов

`+` читает один или больше сегментов:

```ts
compile("/files/:path+").parse("/files/a/b");
// { path: "/files/a/b", params: { path: ["a", "b"] } }
```

`*` читает ноль или больше сегментов:

```ts
compile("/files/:path*").parse("/files");
// { path: "/files", params: { path: [] } }
```

`{min,max}` ограничивает длину массива:

```ts
compile("/parts/:id<number>{2,3}").parse("/parts/1/2");
// { path: "/parts/1/2", params: { id: [1, 2] } }
```

Такой параметр полезен для путей к файлам, вложенных слагов и breadcrumbs.

## Express-конвертация

`convertPath(path, "express")` переводит синтаксис Virentia в строку для
роутеров в стиле Express:

```ts
import { convertPath } from "@virentia/router-paths";

convertPath("/files/:id<number>?", "express");
// "/files{/:id}"
```

Аннотации типов вроде `<number>` в Express path не попадают. Express получает
строки, а проверку параметров делает парсер Virentia или логика роута.
