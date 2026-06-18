---
title: Path templates
---

# Path Templates

`@virentia/router-paths` is the URL template package. It has no dependency on
Virentia runtime, React, or history.

It gives one source of truth for:

- parsing a browser path into typed params;
- building a path from typed params;
- validating path template syntax at type level;
- converting Virentia path syntax for Express-style routers.

## API Shape

```ts
import { compile, convertPath, type ParseUrlParams } from "@virentia/router-paths";

type Params = ParseUrlParams<"/users/:id<number>">;
// { id: number }

const userPath = compile("/users/:id<number>");

userPath.parse("/users/42");
// { path: "/users/42", params: { id: 42 } }

userPath.build({ id: 42 });
// "/users/42"

convertPath("/users/:id<number>?", "express");
// "/users{/:id}"
```

`compile(path)` returns:

```ts
{
  parse(pathname: string): { path: string; params: Params } | null;
  build(params: Params): string;
}
```

For paths without params, `params` is `null` at runtime and the builder does not
require an argument.

## Plain Params

Plain params are strings:

```ts
const userPath = compile("/users/:id");

userPath.parse("/users/alice");
// { path: "/users/alice", params: { id: "alice" } }

userPath.build({ id: "alice" });
// "/users/alice"
```

## Number Params

`<number>` parses a segment into a number:

```ts
const invoicePath = compile("/invoices/:id<number>");

invoicePath.parse("/invoices/100");
// { params: { id: 100 } }

invoicePath.parse("/invoices/abc");
// null
```

The inferred type is:

```ts
type Params = ParseUrlParams<"/invoices/:id<number>">;
// { id: number }
```

## Union Params

Unions constrain a parameter to a small route-local enum:

```ts
const docsPath = compile("/docs/:tab<overview|api>");

docsPath.parse("/docs/api");
// { params: { tab: "api" } }

docsPath.parse("/docs/random");
// null
```

The inferred type is:

```ts
type Params = ParseUrlParams<"/docs/:tab<overview|api>">;
// { tab: "overview" | "api" }
```

## Optional Params

`?` makes one segment optional:

```ts
const profilePath = compile("/users/:id?");

profilePath.parse("/users");
// { params: { id: undefined } }

profilePath.build({ id: undefined });
// "/users"
```

This fits optional URL state that is still part of the path. If state can be
freely combined with many paths, query tracking is often a better fit.

## Multi-Segment Params

`+` reads one or more segments into an array:

```ts
compile("/files/:path+").parse("/files/a/b");
// { params: { path: ["a", "b"] } }
```

`*` reads zero or more segments:

```ts
compile("/files/:path*").parse("/files");
// { params: { path: [] } }
```

`{min,max}` constrains the number of segments:

```ts
compile("/parts/:id<number>{2,3}").parse("/parts/1/2");
// { params: { id: [1, 2] } }
```

Multi-segment params fit file paths, slugs, breadcrumbs, and import/export
routes where one logical param spans several URL segments.

## Express Conversion

`convertPath(path, "express")` converts Virentia template syntax into the subset
used by Express-style routers:

```ts
import { convertPath } from "@virentia/router-paths";

convertPath("/files/:id<number>?", "express");
// "/files{/:id}"
```

The conversion strips Virentia-only type annotations because Express receives
strings at runtime. Validation stays in the Virentia path parser or route model.
