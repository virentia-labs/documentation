# Модели и компоненты

React-компонентам часто нужно состояние, которое зависит от props и исчезает вместе с компонентом. В Virentia такое состояние все равно должно оставаться моделью ядра. React-пакет только создает ее в нужный момент и готовит к рендеру.

## Фабрики моделей

Фабрика модели получает `ModelContext`. Поле `props` — это стор, поэтому реакции могут читать актуальные props без пересоздания модели на каждый рендер.

```tsx
function createCounterModel({ props }: ModelContext<{ step: number }>) {
  const clicked = event<void>();
  const count = store(0);

  reaction({
    on: clicked,
    run() {
      count.value += props.step;
    },
  });

  return { clicked, count };
}
```

Используйте фабрику, когда модель принадлежит одному экземпляру компонента, зависит от props или нуждается в юнитах жизненного цикла вроде `mounted` и `unmounted`.

## useModel

`useModel` создает модель один раз для экземпляра компонента и подготавливает ее для рендера. Сторы становятся значениями. События и эффекты становятся callback-функциями, привязанными к текущему scope.

```tsx
export function Counter(props: { step: number }) {
  const model = useModel(createCounterModel, props);

  return <button onClick={() => model.clicked()}>{model.count}</button>;
}
```

Когда компонент размонтируется, работа, созданная фабрикой, будет очищена, если модель не была помещена в кеш.

## component

`component` упаковывает тот же паттерн в одно объявление: создать модель, поддерживать актуальные props, отправить события монтирования и размонтирования, подготовить модель и отрендерить view.

```tsx
export const Counter = component({
  model: createCounterModel,
  view({ model }) {
    return <button onClick={() => model.clicked()}>{model.count}</button>;
  },
});
```

Используйте `component`, когда модель принадлежит view. Используйте `useModel`, когда нужно вручную встроить модель в уже существующий компонент.

### Управляемая модель компонента

`component` также поддерживает controlled-сценарий. Возвращенный компонент имеет `.create(props)`, с помощью которого модель родительского component может создать и владеть моделью дочернего component.

```tsx
export const Parent = component({
  model() {
    const counter = Counter.create({ step: 2 });

    return { counter };
  },

  view({ model }) {
    return <Counter step={2} model={model.counter} />;
  },
});
```

Когда controlled-модель передана дочернему component, React по-прежнему обновляет `props`, `mounted`, `unmounted` и `mounts`. Размонтирование дочернего view не очищает модель; ей владеет родитель.

## Маппинг пропсов через `mapProps`

По умолчанию **внешние пропсы** компонента — то, что ты передаёшь в JSX — это же и **пропсы модели**. `mapProps` позволяет их развести: он получает внешние пропсы и возвращает пропсы модели. Он выполняется во время рендера, поэтому может читать React-контекст или вызывать хуки — параметры роутера, тему — и подмешивать их в то, что получает модель.

```tsx
export const Page = component({
  mapProps: (props: { slug: string }) => {
    const { uuid } = useParams<{ uuid: string }>(); // хук react-router
    return { ...props, uuid };
  },
  model: createPageModel, // получает ModelContext<{ slug: string; uuid: string }>
  view({ model }) {
    return <Article model={model} />;
  },
});
```

View по-прежнему получает **внешние** пропсы (плюс `model`); замапленные пропсы видит только модель. Не указывай `mapProps` — и они совпадают.

`.create(props)` принимает пропсы **модели** напрямую — он выполняется во время сборки родительской модели, вне рендера, поэтому шага `mapProps` там нет.

## Вложенные модели с `@@shape`

Модель часто собирается из меньших под-моделей. Когда под-модель — простая запись юнитов, `useModel` и `component` разворачивают её как есть. Когда она несёт ещё и вспомогательные функции, которые во view не нужны, объяви её привязываемые юниты через свойство `@@shape`: поле попадёт во view именно как эти юниты, а маркер не утечёт. Shape вкладываются, поэтому это работает на любой глубине.

```tsx
import { SHAPE } from "@virentia/react";

// Переиспользуемая под-модель поля: два юнита плюс приватный помощник.
function createField(initial: string) {
  const text = store(initial);
  const changed = event<string>();
  reaction({ on: changed, run: (next) => (text.value = next) });

  return {
    text,
    changed,
    isEmpty: () => text.value.trim() === "", // помощник, не привязывается
    [SHAPE]: { text, changed }, // привязываем только это
  };
}

// Модель, собранная из под-моделей.
function createProfileModel() {
  const name = createField("");
  const bio = createField("");
  const saved = event<void>();

  return { name, bio, saved };
}
```

С `useModel` каждое поле приходит как `{ text, changed }` — `isEmpty` остаётся снаружи:

```tsx
function Profile() {
  const model = useModel(createProfileModel, {}); // без props

  return (
    <form onSubmit={() => model.saved()}>
      <input value={model.name.text} onChange={(e) => model.name.changed(e.target.value)} />
      <input value={model.bio.text} onChange={(e) => model.bio.changed(e.target.value)} />
    </form>
  );
}
```

`component` привязывает ту же модель так же — view получает `model.name` и `model.bio` уже развёрнутыми до их юнитов:

```tsx
export const Profile = component({
  model: createProfileModel,
  view({ model }) {
    return (
      <form onSubmit={() => model.saved()}>
        <input value={model.name.text} onChange={(e) => model.name.changed(e.target.value)} />
        <input value={model.bio.text} onChange={(e) => model.bio.changed(e.target.value)} />
      </form>
    );
  },
});
```

Тянись к `@@shape` только когда под-модель смешивает юниты с не-юнитами. Под-модель, которая является простой записью юнитов, объявления не требует — она разворачивается сама.

## Юниты жизненного цикла

Фабрики получают `mounted`, `unmounted` и `mounts`. Используйте их для логики модели, которая должна реагировать на жизнь UI: загрузить данные при mount, поставить работу на паузу, когда размонтирован последний экземпляр, или понять, сколько view сейчас используют кешированную модель.

Юниты жизненного цикла — это часть модели, а не React-эффекты, замаскированные под код модели. Предпочитайте их, когда результат должен тестироваться как часть модели.
