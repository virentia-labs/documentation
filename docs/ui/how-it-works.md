# How rendering works

View runs when a display attaches and creates bindings to model units. Clicking the counter changes data, not a new description of the whole component.

<UIWalkthrough kind="render" />

## Three update paths

<UIFlow kind="render" />

A scalar store changes existing text or a DOM property.

A conditional function owns a separate DOM range. A dependency change removes that range and constructs its replacement; neighboring bindings stay in place.

For receives insert, remove and move operations from its container, rather than matching list snapshots. An ordinary computed array has no operation feed and recreates its rows on change, with a development warning.

None of these paths uses reconciliation. Model and display lifetimes differ; see [ownership](./learn/setup-and-view) and [retention](./components).
