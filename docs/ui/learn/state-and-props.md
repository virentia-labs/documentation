---
aside: false
prev:
  text: "1. Your first component"
  link: /ui/learn/first-app
next:
  text: "3. Events"
  link: /ui/learn/events
---

# State

Add a `count` field with an initial value of `0`. `f.number(0)` describes a numeric field; `self.model.count` accesses its store on the displayed instance.

<UIWalkthrough kind="state" />

Import `f` from `@virentia/core/models`. Pass the store itself to JSX: `{self.model.count}`. The renderer binds the button's text to it.

Do not substitute `count.value`: that reads a number when view is created, rather than establishing a binding. Actions will read and write `.value` in the next chapter.

Change the initial value to `10`. The button now shows 10, but clicking does nothing yet. Next, add an action.
