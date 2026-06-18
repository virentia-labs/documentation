# Скоупы и сериализация

Effector и Virentia хранят состояние в разных scope. `@virentia/effector` хранит явные пары scope в глобальных weak map:

```ts
import { associate, ensureAssociation } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Объекта совместимости нет, метода `dispose()` тоже нет. Association достижима, пока достижим scope Virentia или Effector.

## Без неявных scope

Пакет никогда не создает недостающий scope.

```ts
ensureAssociation({ effector: effectorScope });
```

Такой код сработает только если Effector scope уже есть в association. Иначе будет ошибка.

## Направление scope

Пользователь выбирает один нативный scope, а мост находит второй по association.

```ts
await scoped(virentiaScope, () => virentiaBoundary(payload));
```

Если `virentiaBoundary` нужен Effector, мост использует Effector scope, связанный с `virentiaScope`.

```ts
await allSettled(effectorBoundary, {
  scope: effectorScope,
  params: payload,
});
```

Если `effectorBoundary` нужна Virentia, мост использует Virentia scope, связанный с `effectorScope`.

Не передавайте оба scope вручную внутри одного вызова. Свяжите их один раз, затем стартуйте из того runtime, которому действие принадлежит естественно.

## SSR

Создавайте association на каждый request внутри функции рендера:

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

Scope Virentia задается через `scoped`, scope Effector — через `allSettled`, `scopeBind`, `launch` или Provider в UI. Association заранее связывает эти два scope.

Scope Virentia сериализуется snapshot-механизмом Virentia, scope Effector — через `serialize` из Effector. Слой совместимости хранит только association между ними.

## Поздняя association

Если порядок bootstrap мешает создать association сразу, сделайте это позже:

```ts
associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Effector scope не создается автоматически и не подхватывается позже. Его нужно передать при создании association.

## Scope Effector

Слой совместимости не угадывает Effector scope из глобального состояния. Fooled-юнит на стороне Effector читает `stack.scope` в `step.run`. Для SSR и тестов это scope из `fork()`. Для React это тот же scope, который передается в Effector Provider.
