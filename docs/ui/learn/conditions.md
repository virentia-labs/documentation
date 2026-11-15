---
aside: false
prev:
  text: "5. Props"
  link: /ui/learn/props
next:
  text: "7. A list of counters"
  link: /ui/learn/model-lists
---

# Conditional rendering

Add a Details button that hides the doubled result without losing the count.

Add `expanded: f.boolean(true)` to the model and a toggle action:

```ts
const toggle = action(() => {
  self.expanded.value = !self.expanded.value;
});
return { increment, doubled, toggle };
```

Put a changing structural condition in a function inside view:

<UIWalkthrough kind="condition" />

Pass `{details}`, not `details()`. The renderer calls the function and tracks its read of `expanded.value`.

Hiding removes only output. The counter's button stays in place. Showing creates a new output with the current result; old and new subtrees are not compared.

Hide the details, increase the count and show them again. The result should include every click.
