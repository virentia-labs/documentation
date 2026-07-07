# Testing

Create a fresh scope for every test. Store values, effect handlers, and Effector associations should not leak between cases.

## Core

```ts
import { describe, expect, it } from "vitest";
import { event, reaction, scope, scoped, store } from "@virentia/core";

describe("counter", () => {
  it("increments in an isolated scope", async () => {
    const testScope = scope();
    const incremented = event<number>();
    const count = store(0);

    reaction({
      on: incremented,
      run(amount) {
        count.value += amount;
      },
    });

    await scoped(testScope, () => incremented(2));

    scoped(testScope, () => {
      expect(count.value).toBe(2);
    });
  });
});
```

## Effector

Use real Effector and Virentia scopes. Create the association in test setup, then run code with the native tools of the runtime that owns the action.

```ts
import { describe, expect, it } from "vitest";
import { event, reaction, scope as createVirentiaScope, scoped, store } from "@virentia/core";
import { associate, ensureAssociation, fool } from "@virentia/effector";
import { allSettled, createEvent, fork, sample } from "effector";

describe("effector compatibility", () => {
  it("uses associated scopes", async () => {
    const virentia = createVirentiaScope();
    const effectorScope = fork();
    const association = associate({
      virentia,
      effector: effectorScope,
    });

    const submitted = createEvent<number>();
    const saved = fool(event<number>());
    const total = store(0);

    reaction({ on: saved, run: (value) => (total.value += value) });
    sample({ clock: submitted, target: saved });

    await allSettled(submitted, {
      scope: effectorScope,
      params: 12,
    });

    expect(ensureAssociation({ effector: effectorScope })).toBe(association);
    scoped(virentia, () => {
      expect(total.value).toBe(12);
    });
  });
});
```

If an association is missing, `@virentia/effector` throws. Create the association in setup code instead of relying on hidden scopes.
