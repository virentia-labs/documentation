---
aside: false
prev:
  text: "4. Derived values"
  link: /ui/learn/derived
next:
  text: "6. Conditional rendering"
  link: /ui/learn/conditions
---

# Props

Reuse the component for several counters. Add a `label` field and give each counter its own name and initial count.

<UIWalkthrough kind="props" />

Replace the single `<Counter />` in main with both counters:

```tsx
render(() => <>
  <Counter label="Coffee" count={2} />
  <Counter label="Tea" count={5} />
</>, container, { scope: appScope });
```

`label` and `count` are model inputs. These plain strings and numbers provide initial instance values. View reads the instance's stores through `self.model`.

Click Coffee. Tea stays unchanged: each display has its own instance, even though both share the CounterModel definition.

For live prop sources, see [reactive inputs](../reactivity).
