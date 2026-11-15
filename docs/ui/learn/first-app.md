---
aside: false
prev:
  text: "Tutorial"
  link: /ui/learn/
next:
  text: "2. State"
  link: /ui/learn/state-and-props
---

# Your first component

Let's build a counter. Start with a button; later chapters add state and behavior.

Create `Counter.tsx`. A component connects a model to a `view` function. The model is empty for now. Click Next to change the button's label.

<UIWalkthrough kind="component" />

The markup returned by view is ordinary JSX. Mount the component with `render`.

## Mount it

In `main.tsx`, create an application scope and select your HTML container:

```tsx
import { render, scope } from "@virentia/ui";
import { Counter } from "./Counter";

const appScope = scope();
const container = document.getElementById("app")!;
render(() => <Counter />, container, {
  scope: appScope,
});
```

`render` attaches the component to `<div id="app"></div>`. A scope holds this application's state; create it once and pass it to render.

Change the label in view and check the result. Next, replace that label with a number.
