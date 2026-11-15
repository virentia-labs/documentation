---
aside: false
prev:
  text: "Учебник"
  link: /ru/ui/learn/
next:
  text: "2. Состояние"
  link: /ru/ui/learn/state-and-props
---

# Первый компонент

Соберём счётчик. Начнём с кнопки, а в следующих главах добавим ей состояние и поведение.

Создайте `Counter.tsx`. Компонент связывает модель с функцией `view`. Пока данных нет, модель пустая. Нажмите «Далее», чтобы изменить надпись кнопки.

<UIWalkthrough kind="component" />

Разметка внутри `view` — обычный JSX. Чтобы вывести компонент на страницу, вызовем `render`.

## Подключить к странице

В `main.tsx` создайте scope приложения и укажите контейнер из HTML:

```tsx
import { render, scope } from "@virentia/ui";
import { Counter } from "./Counter";

const appScope = scope();
const container = document.getElementById("app")!;
render(() => <Counter />, container, {
  scope: appScope,
});
```

`render` подключит компонент к `<div id="app"></div>`. Scope хранит состояние этого приложения; сейчас достаточно создать его один раз и передать рендеру.

Измените надпись в `view` и проверьте результат. В следующей главе вместо надписи покажем число.
