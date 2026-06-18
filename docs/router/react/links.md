---
title: Links
---

# Links

A link is the UI form of navigation. `Link` renders a real anchor so that
keyboard, middle-click, "open in new tab", and screen readers all keep working,
while normal left-clicks go through `route.open` instead of a full page load.

## Link

```tsx
import { Link } from "@virentia/router-react";

<Link to={profileRoute} params={{ id: 42 }} query={{ tab: "posts" }}>
  Profile
</Link>
```

`Link` builds `href` from the registered route template, so the anchor shows the
real URL. On a normal click it prevents the default navigation and calls
`route.open` with the same `params`, `query`, and `replace`.

```ts
type LinkProps<Params> = {
  to: Route<Params>;
  params: Params; // optional when the route has no params
  query?: Query;
  replace?: boolean;
  children?: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>; // minus href
```

`params` is required by the types only when the route's template has params; a
paramless route omits it. Any other anchor attribute (`className`, `target`,
`onClick`, `aria-*`, `ref`) is forwarded to the `<a>`.

### When the browser keeps the click

`Link` deliberately does **not** intercept clicks that the user means as native
navigation. The default browser behavior runs when:

- the click is already `defaultPrevented` (for example by your own `onClick`);
- `target` is set and is not `_self`;
- a modifier key is held — <kbd>⌘</kbd>/<kbd>Ctrl</kbd>, <kbd>Shift</kbd>, or
  <kbd>Alt</kbd>.

Your `onClick` runs first, so returning early or calling `preventDefault` there
suppresses the route open while keeping the anchor.

## useLink

`useLink` returns the same `href` and bound open command without rendering an
anchor. Use it to build links inside design-system components (a styled button,
a card, a menu item):

```tsx
import { useLink } from "@virentia/router-react";

function ProfileButton() {
  const { path, open } = useLink(profileRoute, { id: 42 }, { tab: "posts" });

  return (
    <Button href={path} onClick={() => open({ params: { id: 42 } })}>
      Profile
    </Button>
  );
}
```

```ts
function useLink<Params extends object | void = void>(
  to: Route<Params>,
  params?: Params,
  query?: Query,
): {
  path: string;
  open: EventCallable<RouteOpenedPayload<Params>>;
};
```

`path` is the built URL for the given params and query; `open` is the route's
open command, already scoped to the provider's router. `Link` is implemented on
top of `useLink` — reach for the hook only when you need a non-anchor element.

The full command semantics (`route.open` vs `router.navigate`, `replace`, and
boundaries like `allSettled`) are described in
[Navigation](/router/core/navigation).
