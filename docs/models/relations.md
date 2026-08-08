---
title: Relations
---

# Relations

Relations connect entities across collections. Use `refs` when an entity
points at another that lives its own life (a post and its author), and
`children` when child entities exist only as part of the parent (a board and
its columns). Storage is always by id; navigation looks like objects.

Examples on this page run inside an active scope - see
[Collections and instances](./instances).

## References

`refs.one` stores one id and resolves it on read:

```ts
const Post = staticModel({
  data: { title: f.string(), author: refs.one(() => User) },
});

const User = staticModel({
  data: { login: f.string() },
});

const bob = collection(User).add({ login: "bob" });
const post = collection(Post).add({ title: "hello" });

post.author.value = bob;   // link (an id string works too)
post.author.value?.login.value; // "bob"
post.json().author;        // "bob's id" - references serialize as ids
```

`refs.many` stores an ordered id set with `add`/`remove`, `ids`, `items`,
`count`.

## Children

Children are composition: created through the parent, disposed with it.

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

const board = collection(Board).add({ title: "Sprint" });

board.columns.add({ name: "Doing" });
board.columns.items;   // [Column]
board.columns.move(board.columns.items[0], 0);

collection(Column).add({ name: "loose" });
// Error: Column is owned as children - create it through the parent

board.dispose();
collection(Column).count; // 0 - cascaded
```

In JSON children are embedded: the parent's `json()` contains the child
objects, and loading a children array reconciles - known ids merge, absent
children are disposed, array order is the order.

## The Back Side: `inverse`

By default a relation is one-directional. To see it from the other side,
declare an `inverse` - a view over the owning field, with no storage of its
own:

```ts
const User = staticModel({
  data: {
    login: f.string(),
    posts: inverse(() => Post.author),
  },
});

bob.posts.items;        // all posts whose author is bob
bob.posts.link(post);   // same as post.author.value = bob
bob.posts.unlink(post);
```

What happens:

- the data lives once, on the owning side - the two sides cannot disagree;
- the inverse never serializes;
- its cardinality is derived: the inverse of `children.many` and of
  `refs.one(...).unique()` is a single `value`, otherwise it is a query-like
  list.

`refs.one(() => User).unique()` makes the link one-to-one: a second entity
pointing at the same target fails at write.

## Cycles And Self-Reference

Pass the target as a value when it is declared above, as a thunk when it is
declared later or in another file, and as `Self` for the model itself. Thunks
resolve at first navigation, so mutual references need no annotations:

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

Both compile with full typing on navigation - `post.author.value?.login.value`
knows it is a `User`.

## Delete Policies

When a referenced entity is disposed, each `refs` field pointing at it applies
its policy:

```ts
author: refs.one(() => User),                    // nullify (default): link becomes null
author: refs.one(() => User).policy("restrict"), // dispose fails while referenced
author: refs.one(() => User).policy("orphan"),   // id stays, reads resolve to null
```

```ts
users.remove(bob.id);
post.author.value; // null - the default policy cleared the link
```

Children need no policy - they always die with the parent.

## Loading In Any Order

A reference id may arrive before its target:

```ts
const post = posts.add({ title: "x", author: "u1" }); // u1 not loaded yet

post.author.value;            // null - for now
users.add({ id: "u1", login: "bob" });
post.author.value?.login.value; // "bob" - same read, now resolved
```

## Contract

```ts
refs.one(target)      // stores id | null;   view: { value }
refs.many(target)     // stores id[];        view: { add, remove, ids, items, count }
children.one(target)  // stores id | null;   view: { value, create, clear }
children.many(target) // stores id[];        view: { add, remove, move, ids, items, count }
inverse(() => Model.field) // storage-less view over the owning field

// target: Model | Union | () => Model | Union | Self
// modifiers: .unique(), .policy("nullify" | "restrict" | "orphan")
```

## Common Cases

Use relations for:

- foreign keys from the server - `refs.one` with the id straight from JSON;
- nested server payloads - `children.many`, embedded in both directions;
- bidirectional navigation - one owning side plus `inverse`;
- trees - `children.many(Self)` with an `inverse` parent;
- many-to-many - `refs.many` on one side, `inverse` on the other; if the edge
  needs its own data, make it an explicit model with two `refs.one`.

## Related

- [Unions](./unions#unions-in-relations) - a relation may target a union.
- [Data in and out](./wire) - how references and children serialize.
- [Queries and indexes](./queries) - inverse views are query-shaped.
