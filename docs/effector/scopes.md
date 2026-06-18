# Scopes and serialization

Effector and Virentia keep state in different scopes. `@virentia/effector` stores explicit scope pairs in global weak maps:

```ts
import { associate, ensureAssociation } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

There is no compatibility object and no `dispose()` method. An association stays reachable while its Virentia or Effector scope is reachable.

## No implicit scopes

The package never creates a missing scope.

```ts
ensureAssociation({ effector: effectorScope });
```

This works only if the Effector scope is already present in an association. Otherwise it throws.

## Scope direction

The caller chooses one native scope, and the bridge finds the other one from the association.

```ts
await scoped(virentiaScope, () => virentiaBoundary(payload));
```

If `virentiaBoundary` needs Effector, the bridge uses the Effector scope associated with `virentiaScope`.

```ts
await allSettled(effectorBoundary, {
  scope: effectorScope,
  params: payload,
});
```

If `effectorBoundary` needs Virentia, the bridge uses the Virentia scope associated with `effectorScope`.

Do not pass both scopes manually inside one call. Associate them once, then start from the runtime that naturally owns the action.

## SSR

Create an association per request inside the render function:

```ts
export async function render(request: Request) {
  const virentiaScope = createVirentiaScope(request);
  const effectorScope = fork();

  const association = associate({
    virentia: virentiaScope,
    effector: effectorScope,
  });

  await scoped(virentiaScope, () =>
    allSettled(appStarted, {
      scope: effectorScope,
      params: request,
    }),
  );

  return renderApp(association);
}
```

Set the Virentia scope with `scoped`, and the Effector scope with `allSettled`, `scopeBind`, `launch`, or the UI Provider. The association links these two scopes ahead of time.

Serialize the Virentia scope with Virentia snapshot tools and the Effector scope with `serialize` from Effector. The compatibility layer stores only the association between them.

## Late association

If bootstrap order makes early creation awkward, associate scopes later:

```ts
associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

The Effector scope is not created automatically and is not captured later. Pass it when creating the association.

## Effector scope

The compatibility layer does not guess the Effector scope from global state. A fooled Effector-facing unit reads `stack.scope` in `step.run`. For SSR and tests this is the scope from `fork()`. In React, it is the same scope that you pass to Effector Provider.
