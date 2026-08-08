---
title: Unions
---

# Unions

A union is one list over several models: a feed of posts and ads, a canvas of
different shapes, mixed search results. Use it when entities of different
kinds flow through the same screen but keep their own fields and behavior.

Variants are identified by model references - there are no type-name strings
to invent or keep unique.

Examples on this page run inside an active scope - see
[Collections and instances](./instances).

## Declaring A Union

```ts
import { union } from "@virentia/core/models";

const Timestamped = trait({
  data: { createdAt: f.date().indexed("ord") },
});

const Post = staticModel({
  with: [Timestamped],
  data: { title: f.string(), likes: f.number(0) },
});

const Ad = staticModel({
  with: [Timestamped],
  data: { budget: f.number(0), active: f.boolean(true) },
});

const FeedItem = union(Post, Ad).by((json) =>
  "budget" in json ? Ad : Post,
);

const feed = collection(FeedItem);
```

`by` tells the union which variant a JSON object belongs to. The union
collection is a view: instances live in `collection(Post)` and
`collection(Ad)`, and both directions see the same data.

## Adding Through The Union

```ts
feed.add({ title: "hello", likes: 3 }); // by → Post
feed.add({ budget: 100 });              // by → Ad

feed.count;             // 2
collection(Post).count; // 1
collection(Ad).count;   // 1
```

What happens:

- unknown ids go through `by` - shape discrimination on full objects;
- a known id merges into its variant directly, without `by` - partial updates
  do not need discriminating keys;
- a full object of another variant with a taken id is an error: variants do
  not migrate;
- without `.by(...)` the union has no `add` - neither in types nor at run
  time.

## Shared Fields

A field is shared by the union when every variant gets it from the same trait:

```ts
feed.where(FeedItem.createdAt.gte(today)).count;
feed.sort(FeedItem.createdAt.desc).items;
```

Both work because `Post` and `Ad` compose `Timestamped`. Each variant uses its
own index; sorted results merge across variants.

A name coincidence is not sharing - two models each declaring their own
`createdAt` in `data` produce no `FeedItem.createdAt`, and accessing it says
so. Put shared fields in a trait.

## Filtering Per Variant: `match`

Variant-specific conditions go through `match`, one branch per variant:

```ts
feed.match(
  [Post, (p) => p.likes.gte(100)],  // p is Post's descriptors
  [Ad, (a) => a.active.eq(true)],
);
```

A branch returns a predicate, or `true`/`false` to keep or drop the whole
variant. `match` is exhaustive: a missing variant is a compile error (the
message names it) and a runtime error. It chains with `where`, `sort`, and
`take`:

```ts
feed
  .where(FeedItem.createdAt.gte(today))
  .match([Post, (p) => p.likes.gte(10)], [Ad, () => false])
  .sort(FeedItem.createdAt.desc)
  .take(20);
```

## Narrowing Items

Results are typed as a union of variant instances; `in` narrows:

```ts
for (const item of feed.items) {
  if ("likes" in item) {
    item.likes.value;  // Post
  } else {
    item.budget.value; // Ad
  }
}
```

## Unions In Relations

A relation may target a union - by value or thunk:

```ts
const Bookmark = staticModel({
  data: { target: refs.one(FeedItem) },
});

bookmark.target.value = post; // any variant instance
bookmark.json().target;       // the id
```

Writes by instance remember the variant, so everything stays precise even
when two variants share an id string. An id loaded from JSON resolves by
searching the variants at first read; if it exists in two of them, the read
fails with a clear error - id-only data cannot be disambiguated.

Children targeting a union embed each child's JSON, and `by` re-discriminates
them on load.

## Contract

```ts
function union(...variants: Model[]): Union;

// the input discriminator: json is typed as Dto<V1> | Dto<V2> | ...
// until .by(...) is declared the union has no add - in types or at run time
union.by((json) => Variant): Union;

// the union collection is a Query over all variants, plus:
feed.add(json)      // routes through by / known-id merge
feed.get(id)        // searches the variants
feed.remove(id)
feed.match(...[Variant, (descriptors) => Predicate | boolean][])
```

Shared descriptors (`FeedItem.field`) exist for fields every variant carries
from the same trait.

## Common Cases

Use unions for:

- feeds and timelines mixing entity kinds;
- canvases and layer trees of heterogeneous elements;
- search results across several models;
- polymorphic references - `refs.one(FeedItem)` instead of a type-tag field.

## Related

- [Traits](./traits) - the source of shared fields.
- [Queries and indexes](./queries) - everything a union query inherits.
- [Relations](./relations) - relation targets in general.
