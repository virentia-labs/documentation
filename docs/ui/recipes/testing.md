# Parallel tests without global resets

Use ordinary Vitest test.concurrent. Create a scope and container inside each test body. Virentia needs no test wrapper or runner-specific setup; a scope belongs to the test that creates it.

<UIWalkthrough kind="testing" />

Module-level staticModel declarations share units, not values. Equal IDs are safe in independent scopes. Ref attachments stay in their document; disposing one instance must not disconnect another test's computed propagation. Use separate documents too when your scenario depends on document-level state such as focus.

The example below creates both test scopes itself, changes a bound action and checks that the exact button and text node survive. Its finally waits for local teardown even if an assertion fails.

Isolation needs no global reset. Explicitly created models remain creator-owned; keep retains automatically created models, so dispose a retained instance when your test no longer needs it. See [Vitest and lifecycle rules](../api/testing).

:::: details Complete example sources
::: code-group
<<< @/ui/examples/dom-identity.ts
:::
::::
