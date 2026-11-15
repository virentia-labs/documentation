---
aside: false
prev:
  text: "6. Conditional rendering"
  link: /ui/learn/conditions
next:
  text: "Guides"
  link: /ui/guides/
---

# A list of counters

We have written two Counter elements by hand. Now a board will own a collection of counters and add them with a button.

`children.many(CounterModel)` declares the child container. `For` displays its contents, passing each ready instance through the row's model prop.

<UIWalkthrough kind="list" />

Create `Board.tsx`, importing Counter and CounterModel from `./Counter`. Replace the import and render root in main:

```tsx
import { Board } from "./Board";

render(() => <Board counters={[
  { label: "Coffee", count: 2 },
  { label: "Tea", count: 5 },
]} />, container, { scope: appScope });
```

The board model creates child instances from the counters input.

Adding creates one row. Removing disposes its model and display; other rows stay in place. This list needs no separate keys: its source supplies the exact operation.

## Complete example

[Run the finished example](../installation#tutorial-example). Add counters, change their counts and remove the last one. Values in the remaining counters should not reset.

:::: details Sources
::: code-group
<<< @/ui/examples/course/Counter.tsx
<<< @/ui/examples/course/Board.tsx
<<< @/ui/examples/course/main.tsx
:::
::::

Continue with [model ownership](./setup-and-view), or choose a [guide](../guides/).
