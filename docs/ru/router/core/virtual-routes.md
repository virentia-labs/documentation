---
title: Виртуальные, chain- и сгруппированные роуты
---

# Виртуальные, chain- и сгруппированные роуты

Не каждое состояние, похожее на роут, отображается на URL. Модалка
подтверждения, производное состояние «открыт любой из этих экранов» или экран,
который должен появляться только после проверки авторизации, ведут себя как
роуты — они открываются, закрываются, несут параметры и могут быть отрисованы, —
но они не сопоставляются из адресной строки.

Ядро моделирует это тремя хелперами, построенными на одном и том же примитиве
виртуального роута:

- `createVirtualRoute` — роут, который вы открываете и закрываете императивно;
- `group` — виртуальный роут, отражающий «открыт любой из этих роутов»;
- `chainRoute` — виртуальный роут, который открывается только после прохождения
  дополнительных асинхронных проверок.

Все три возвращают `VirtualRoute`, поэтому отрисовываются через те же
представления роутов, что и обычные роуты, и принимаются везде, где принимается
`Route`.

## Виртуальные роуты

`createVirtualRoute` создает роут без пути, управляемый исключительно
собственными событиями `open` и `close`. Здесь нет сопоставления URL и нет
`beforeOpen`; открытие происходит синхронно.

```ts
import { createVirtualRoute } from "@virentia/router";

const inviteModal = createVirtualRoute<{ teamId: string }>();

inviteModal.open({ teamId: "42" });
inviteModal.isOpened.value; // true
inviteModal.params.value; // { teamId: "42" }

inviteModal.close();
inviteModal.isOpened.value; // false
```

### Форма

```ts
interface VirtualRoute<T, Params> {
  readonly "@@type": "pathless-route";

  readonly params: StoreWritable<Params>;
  readonly isOpened: StoreWritable<boolean>;
  readonly isPending: Store<boolean>;

  readonly open: EventCallable<T>;
  readonly opened: Event<T>;
  readonly openedOnServer: Event<T>;
  readonly openedOnClient: Event<T>;

  readonly close: EventCallable<void>;
  readonly closed: Event<void>;
  readonly cancelled: EventCallable<void>;
}
```

`open` принимает payload типа `T`. `opened` срабатывает при каждом открытии; на
сервере дополнительно срабатывает `openedOnServer`, а в браузере —
`openedOnClient`, что удобно для побочных эффектов только на сервере или только
на клиенте. `close` переключает `isOpened` в `false` и вызывает `closed` (это
no-op, если роут не был открыт).

### Transformer и состояние ожидания

По умолчанию `params` хранит payload открытия как есть. `transformer` выводит
сохраняемые параметры из payload — удобно для нормализации или обогащения
входных данных:

```ts
const details = createVirtualRoute<{ id: string }, { id: string; source: string }>({
  transformer: ({ id }) => ({ id, source: "virtual" }),
});

details.open({ id: "7" });
details.params.value; // { id: "7", source: "virtual" }
```

`isPending` по умолчанию — стор, который всегда `false`. Передайте свой `Store`,
когда виртуальный роут должен отражать внешнее состояние загрузки (именно так
`chainRoute` сообщает о прогрессе своего `beforeOpen`):

```ts
const isPending = computed(() => loadFx.pending.value);
const screen = createVirtualRoute({ isPending });
```

Виртуальные роуты подходят для модалок, drawer'ов, шагов мастера и любого
состояния «открыто ли это?», которое должно быть наблюдаемым и отрисовываемым
как роут, но не является адресуемым.

## Сгруппированные роуты

`group` строит виртуальный роут, который открыт, пока открыт **любой** из его
входных роутов, и находится в состоянии ожидания, пока в этом состоянии
находится **любой** входной роут:

```ts
import { group } from "@virentia/router";

const settingsArea = group([profileRoute, securityRoute, billingRoute]);

// settingsArea.isOpened равно true, когда открыт хотя бы один из трех.
```

Группа — чистый способ управлять общим лейаутом или обрамлением. Отрисуйте один
лейаут, пока пользователь находится где-либо в разделе, не подписываясь на
каждый роут по отдельности:

```tsx
const SettingsLayoutView = createRouteView({
  route: settingsArea,
  view: () => (
    <SettingsChrome>
      <Outlet />
    </SettingsChrome>
  ),
});
```

`group` только наблюдает за своими входами — у него нет параметров, и он
открывается и закрывается автоматически при изменении входов. Вы никогда не
вызываете `open`/`close` на группе сами.

## Chain-роуты

`chainRoute` решает задачу «URL совпал, но экран должен подождать». Обычный роут
открывается, как только совпадает его путь. Chain-роут наблюдает за исходным
роутом, выполняет дополнительную работу в `beforeOpen` и открывает собственный
виртуальный роут только когда срабатывает сигнал `openOn` — либо остается
закрытым, если первым сработает `cancelOn`.

```ts
import { chainRoute, createRoute } from "@virentia/router";
import { effect, event, reaction } from "@virentia/core";

const profileRoute = createRoute({ path: "/users/:id" });

const authorized = event<void>();
const rejected = event<void>();

const checkAccessFx = effect(async ({ params }) => {
  return params.id !== "0";
});

reaction({
  on: checkAccessFx.doneData,
  run(isAuthorized) {
    void (isAuthorized ? authorized : rejected)();
  },
});

export const authorizedProfileRoute = chainRoute({
  route: profileRoute,
  beforeOpen: checkAccessFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

### Конфигурация

```ts
function chainRoute<Params extends object | void = void>(props: {
  route: Route<Params> | VirtualRoute<RouteOpenedPayload<Params>, Params>;
  beforeOpen: BeforeOpenUnit<Params> | BeforeOpenUnit<Params>[];
  openOn?: UnitList<any>;
  cancelOn?: UnitList<any>;
}): VirtualRoute<RouteOpenedPayload<Params>, Params>;
```

| Поле | Значение |
| --- | --- |
| `route` | Исходный роут, за которым нужно наблюдать. Когда он открывается, цепочка стартует. |
| `beforeOpen` | Один юнит или массив юнитов (события, эффекты или функции), которые запускаются с payload исходного роута до того, как chain-роут может открыться. |
| `openOn` | Юниты, которые при срабатывании открывают chain-роут с последним payload исходного роута. |
| `cancelOn` | Юниты, которые при срабатывании закрывают chain-роут и вызывают `cancelled`. |

### Поведение

Когда срабатывает `route.opened` исходного роута, chain-роут копирует параметры
источника в собственные `params`, выставляет `isPending` в `true` и запускает
каждый юнит `beforeOpen` в скоупе роута. Дальше исход решают ваши реакции:

- запустите юнит `openOn`, чтобы открыть chain-роут (он повторно отдаст
  сохраненный payload через собственные `open`/`opened`);
- запустите юнит `cancelOn`, чтобы закрыть его и вызвать `cancelled`.

Chain-роут также закрывается всякий раз, когда закрывается исходный роут. Так как
результат — это `VirtualRoute`, в представлении роута для защищенного экрана вы
отрисовываете `authorizedProfileRoute`, а не `profileRoute`, при этом URL
по-прежнему принадлежит исходному роуту.

Chain-роуты подходят для проверок авторизации, экранов за фиче-флагами и потоков
«загрузить перед показом», где адрес может совпасть до того, как экрану
разрешено отрисоваться. Для проверок, которые должны выполняться как часть самой
активации (а не закрывать отдельный отрисовываемый роут), предпочтительнее
собственный [`beforeOpen`](/ru/router/core/routes#beforeopen) роута.
