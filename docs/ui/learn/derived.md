---
aside: false
prev:
  text: "3. Events"
  link: /ui/learn/events
next:
  text: "5. Props"
  link: /ui/learn/props
---

# Derived values

Display twice the count. Declare a `computed` store that depends on `count`, rather than keeping another writable field in sync.

<UIWalkthrough kind="derived" />

Import `computed` from `@virentia/ui`. Its function reads `count.value`, which Core tracks as a dependency. Pass the resulting `doubled` store to view.

One click now updates two texts: the button's count and its doubled result. No handler needs to assign doubled manually.

Change the calculation to the square of the count. Only the model computation changes, not view.
