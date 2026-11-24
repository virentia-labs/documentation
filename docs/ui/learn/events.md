---
aside: false
prev:
  text: "2. State"
  link: /ui/learn/state-and-props
next:
  text: "4. Derived values"
  link: /ui/learn/derived
---

# Events

Make the button increase the count. Declare an `increment` action in the model and pass it to `onClick`.

<UIWalkthrough kind="events" />

Import `action` from `@virentia/ui`. It combines an event with a reaction: calling it runs the handler that changes `count.value`.

`setup` declares model units. Returning `increment` makes it available in view as `self.model.increment`.

Click several times. The existing button's text changes; view is not called again.

Add a `decrement` action and a second button. You do not need to change the render call.
