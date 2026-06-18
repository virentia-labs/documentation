# @virentia/effector API

`@virentia/effector` connects Virentia units with units from the real `effector` package.

## associate

```ts
import { associate } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Creates a global association for one Virentia scope and one Effector scope. The package stores associations in weak maps, keyed by both scopes.

The returned `EffectorAssociation` contains the same scope pair:

```ts
association.virentia;
association.effector;
```

There is no `dispose()` method. The association is reachable while its scopes are reachable.

## ensureAssociation

```ts
import { ensureAssociation } from "@virentia/effector";

const association = ensureAssociation({ effector: effectorScope });
```

Finds an existing association by Effector scope, Virentia scope, or both. Throws if the pair does not exist.

## effectorAssociations

```ts
import { effectorAssociations } from "@virentia/effector";

effectorAssociations.byVirentia.get(virentiaScope);
effectorAssociations.byEffector.get(effectorScope);
```

The global weak-map registry. Most application code should use `associate` and `ensureAssociation`; direct access is useful for diagnostics and integration tests.

## fool

```ts
import { fool } from "@virentia/effector";

const universalUnit = fool(unit);
```

Returns a pass-through universal unit. Use the returned value at feature boundaries:

```ts
sample({
  clock: universalUnit,
  target: effectorTarget,
});

reaction({
  on: universalUnit,
  run(payload) {},
});
```

The result can be used as an Effector unit in `clock`, `source`, or `target`, and as a Virentia unit in `reaction`, `on`, `run`, and `scoped`.

::: warning Direct calls
`fool(original)` does not mutate `original`. Keep and pass the returned unit. Calling `original` still calls the original runtime unit, not the fooled wrapper. The bridge can observe that original call and forward it through associated scopes, but the hybrid API exists only on the value returned by `fool`.
:::

If a fooled unit needs the other runtime and cannot find an association from the current Virentia scope or the Effector scope from `stack.scope`, the package throws.
