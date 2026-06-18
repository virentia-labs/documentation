# Совместимость с Effector

`@virentia/effector` нужен, когда модель Virentia должна работать рядом с уже существующим кодом на Effector.

Существующий код Effector продолжает импортировать `effector`, а модели Virentia используют `@virentia/core`. Этот пакет связывает их scope и позволяет одному пограничному юниту участвовать в обоих runtime.

## Установка

```sh
pnpm add @virentia/effector effector @virentia/core
```

## Association scope

Создайте одну association для scope Virentia и scope Effector, которые относятся к одному рендеру, тесту, request или границе приложения:

```ts
import { scope } from "@virentia/core";
import { associate } from "@virentia/effector";
import { fork } from "effector";

const virentiaScope = scope();
const effectorScope = fork();

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Association хранятся глобально в weak map. Объекта совместимости больше нет, `dispose()` тоже нет. Association достижима, пока достижимы ее scope.

Нужны оба scope. Если fooled-юнит запускается без association, пакет бросит ошибку, а не создаст скрытый scope.

## Универсальные юниты

Используйте `fool(unit)` на границах фич. Возвращенное значение — проходной юнит, который можно использовать и в Effector, и в Virentia:

```ts
import { event } from "@virentia/core";
import { fool } from "@virentia/effector";

export const checkoutRequested = fool(event<{ orderId: string }>());
```

Фичи на Effector могут использовать этот юнит как `clock`, `source` или `target`. Фичи на Virentia могут слушать его через `reaction`/`on` и вызывать внутри `run` или `scoped`.

::: warning Прямые вызовы
`fool(original)` возвращает новый универсальный юнит и не мутирует `original`. Сохраняйте и передавайте возвращенное значение. Вызов `original` остается вызовом исходного runtime-юнита, а не fooled-обертки. Мост может увидеть этот исходный вызов и передать его через связанные scope, но гибридный API есть только у значения, которое вернул `fool`.
:::

## Virentia в Effector

Фича на Virentia может владеть командой, а фича на Effector может потреблять эту команду как Effector clock:

```ts
import { event, scoped } from "@virentia/core";
import { fool } from "@virentia/effector";
import { createEvent, createStore, sample } from "effector";

const checkoutRequested = fool(event<{ orderId: string }>());

function createVirentiaCheckoutFeature() {
  return {
    requestCheckout: checkoutRequested,
  };
}

function createEffectorBillingFeature() {
  const $session = createStore({ token: "session-token" });
  const billingStarted = createEvent<{ orderId: string; token: string }>();

  sample({
    clock: checkoutRequested,
    source: $session,
    fn: (session, request) => ({
      orderId: request.orderId,
      token: session.token,
    }),
    target: billingStarted,
  });

  return {
    billingStarted,
  };
}

const checkout = createVirentiaCheckoutFeature();
const billing = createEffectorBillingFeature();

await scoped(virentiaScope, () => checkout.requestCheckout({ orderId: "order:1" }));
```

Вызов Virentia идет в `virentiaScope`. Мост берет association и запускает Effector clock в связанном `effectorScope`.

## Effector в Virentia

Фича на Effector может владеть командой, а фича на Virentia может слушать тот же пограничный юнит:

```ts
import { event, reaction } from "@virentia/core";
import { fool } from "@virentia/effector";
import { allSettled, createEvent, sample } from "effector";

const routeOpened = fool(createEvent<string>());

function createEffectorRoutesFeature() {
  const profileClicked = createEvent<string>();

  sample({
    clock: profileClicked,
    target: routeOpened,
  });

  return {
    profileClicked,
  };
}

function createVirentiaAnalyticsFeature() {
  const profileTracked = event<{ route: string }>();

  reaction({
    on: routeOpened,
    run(route) {
      profileTracked({ route });
    },
  });

  return {
    profileTracked,
  };
}

const routes = createEffectorRoutesFeature();
const analytics = createVirentiaAnalyticsFeature();

await allSettled(routes.profileClicked, {
  scope: effectorScope,
  params: "/users/1",
});
```

Effector-граф запускается в `effectorScope`. Мост берет association и запускает Virentia reaction в связанном `virentiaScope`.

## Поиск scope

Когда fooled-юнит запускается внутри Effector-графа, мост читает `stack.scope` и находит связанный scope Virentia. Когда fooled-юнит запускается внутри `scoped`, мост читает текущий scope Virentia и находит связанный scope Effector.

Используйте `scoped`, Effector `allSettled`, `scopeBind`, `launch` или UI Providers, чтобы выбрать scope. Мост только переводит запуск между уже связанными scope.
