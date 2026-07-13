# useUnit

`useUnit` — мост между core-моделью и React-компонентом. Он читает сторы как обычные значения и привязывает события и эффекты как вызываемые функции — всё в scope из ближайшего [`ScopeProvider`](/ru/react/#scope-provider). Компонент перерендеривается, когда прочитанный им стор меняется **в этом scope**.

Передайте один юнит, массив или объект — форма результата повторяет форму входа.

## Один стор

```tsx
const count = useUnit(model.count);
```

`count` — значение стора в активном scope. Компонент перерендерится, когда `model.count` изменится именно там — и только там, поэтому тот же компонент под другим `ScopeProvider` покажет значение того scope. Это и позволяет одному дереву компонентов обслуживать много изолированных состояний (на запрос на сервере, на тест, на закешированный экран).

## Событие или эффект

События и эффекты возвращаются функциями, уже привязанными к scope, поэтому вызов сразу диспатчит в нужный scope без лишней обвязки.

```tsx
const incremented = useUnit(model.incremented);

return <button onClick={() => incremented(1)}>{count}</button>;
```

Эффект вызывается так же и возвращает промис. Не вызывайте «голый» юнит из обработчика, не привязав его — у непривязанного вызова нет scope.

## Несколько юнитов сразу

Передайте **объект**, чтобы прочитать группу юнитов за один вызов. Сторы становятся значениями, вызываемые — функциями.

```tsx
const model = useUnit({
  count: counter.count,
  incremented: counter.incremented,
  reset: counter.reset,
});

return <button onClick={() => model.incremented(1)}>{model.count}</button>;
```

Или **массив**, когда позиционная привязка читается лучше:

```tsx
const [count, incremented] = useUnit([counter.count, counter.incremented] as const);
```

## Кастомные shape через `@@shape`

Простую запись юнитов `useUnit` читает без всякой помощи. Свойство `@@shape` нужно для случая, когда объект несёт ещё и **не-юниты** — вспомогательные методы, конфиг, приватные поля, — а привязать хочется только часть. Объект объявляет свои привязываемые юниты через `@@shape`, и `useUnit` идёт по этому объявлению, а не перебирает все ключи, поэтому остальное остаётся нетронутым.

Создавайте такой объект **один раз** — в фабрике модели или в модульной области, но не в рендере, потому что его юниты должны быть стабильны:

```tsx
import { SHAPE, useUnit } from "@virentia/react";

function createCounter() {
  const count = store(0);
  const incremented = event<number>();
  reaction({ on: incremented, run: (n) => (count.value += n) });

  return {
    count,
    incremented,
    isZero: () => count.value === 0, // метод, а не юнит
    [SHAPE]: { count, incremented }, // привязываем только юниты
  };
}

const counter = createCounter();

// В компоненте: `isZero` не привязывается, только объявленные юниты.
const { count, incremented } = useUnit(counter);
```

Объявление — это обычно сам объект shape. Также принимается форма **функции**, возвращающей shape, — на случай, когда shape выводится из самого объекта:

```tsx
const source = {
  count,
  [SHAPE]() {
    return { count: this.count };
  },
};
```

Shape **вкладываются на любую глубину**: членом shape может быть либо простая запись юнитов, либо ещё один источник с `@@shape`, и `useUnit` разрешает всё дерево за один вызов.

```tsx
const dashboard = {
  [SHAPE]: {
    header: { title: header.title }, // простая вложенная запись
    counter: createCounter(), // вложенный источник @@shape
  },
};

const { header, counter } = useUnit(dashboard);
// header.title, counter.count, counter.incremented(1)
```

Тот же протокол работает и для поля модели, прочитанного через `useModel` или `component`: поле, объявляющее `@@shape`, попадает во view как свои привязанные юниты, а маркер наружу не утекает. См. [Вложенные модели с `@@shape`](/ru/react/models#вложенные-модели-с-shape).

## Эффекты и pending

`effect.pending` — это стор, поэтому читайте его рядом с эффектом для UI загрузки. Он публикуется сразу — вне транзакции — так что кнопка блокируется в момент старта эффекта.

```tsx
const { save, pending } = useUnit({
  save: saveFx,
  pending: saveFx.pending,
});

return (
  <button disabled={pending} onClick={() => save(values)}>
    Save
  </button>
);
```

Так же работают `effect.failData` (последняя ошибка), `effect.inFlight` (число выполняющихся вызовов) и другие [юниты эффекта](/ru/core/effects).

## Чтение среза стора

`useUnit(store)` перерендеривается при любом изменении стора. Когда компоненту нужна лишь часть большого стора, подпишитесь на **производный стор**, чтобы перерендер шёл только при изменении этой части.

```tsx
const fullName = useUnit(userSlice);
// где, объявлено один раз рядом с моделью:
const userSlice = user.map((u) => `${u.first} ${u.last}`);
```

Объявляйте производный стор **один раз** — рядом с моделью или через `useMemo`, — чтобы он был стабилен между рендерами. Создание `user.map(...)` инлайн на каждый рендер делает новый стор и новую подписку каждый раз.

Для значений из нескольких сторов или тяжёлых вычислений используйте `computed`:

```tsx
const total = useUnit(cartTotal);
const cartTotal = computed(() => cart.value.items.reduce((sum, i) => sum + i.price, 0));
```

## Мутабельные сторы

[Мутабельный стор](/ru/mutable/) работает с `useUnit`, как любой стор, — но `useUnit(store)` читает всё значение, поэтому компонент перерендеривается на каждый commit. Чтобы перерендеривать только при изменении среза, подпишитесь на этот срез через `map` или `computed`:

```tsx
const cart = mutableStore({ items: [] as Item[], coupon: null as string | null });
const couponStore = cart.map((c) => c.coupon);

function Coupon() {
  const coupon = useUnit(couponStore);
  // Перерендерится только при изменении `coupon` — `cart.value.items.push(...)` не тронет.
  return <span>{coupon ?? "нет купона"}</span>;
}
```

Мутабельный draft трекает чтения по keypath, поэтому производный стор подписывается только на части, которые прочитал его селектор. См. [Гранулярная реактивность](/ru/mutable/#гранулярная-реактивность).

## `useUnit` против `useModel`

`useUnit` привязывает юниты, которые у вас уже есть. Когда состояние принадлежит самому компоненту — создаётся из пропсов и уничтожается при размонтировании — берите [`useModel` или `component`](/ru/react/models): они строят модель и затем разворачивают её так же, как `useUnit`.
