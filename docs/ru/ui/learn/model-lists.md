---
aside: false
prev:
  text: "6. Условный вывод"
  link: /ru/ui/learn/conditions
next:
  text: "Руководства"
  link: /ru/ui/guides/
---

# Список счётчиков

До сих пор мы вручную писали два `<Counter />`. Теперь доска будет хранить коллекцию дочерних счётчиков и добавлять их по кнопке.

`children.many(CounterModel)` объявляет контейнер детей. `For` отображает его содержимое и сам передаёт каждой строке готовый экземпляр через `model`.

<UIWalkthrough kind="list" />

Создайте `Board.tsx`; `Counter` и `CounterModel` импортируются из `./Counter`. В `main.tsx` замените импорт и корень рендера:

```tsx
import { Board } from "./Board";

render(() => <Board counters={[
  { label: "Coffee", count: 2 },
  { label: "Tea", count: 5 },
]} />, container, { scope: appScope });
```

Из данных в `counters` модель доски создаёт дочерние экземпляры.

Добавление создаёт одну строку. Удаление удаляет её модель и отображение; остальные строки остаются прежними. Отдельные ключи для этого списка не нужны: источник сообщает конкретную операцию.

## Собранный пример {#complete-example}

Запустите готовый пример по [инструкции](../installation#пример-учебника). Добавьте несколько счётчиков, измените их значения и удалите последний. Значения оставшихся не должны сбрасываться.

:::: details Исходники
::: code-group
<<< @/ui/examples/course/Counter.tsx
<<< @/ui/examples/course/Board.tsx
<<< @/ui/examples/course/main.tsx
:::
::::

Дальше можно изучить [владение моделями](./setup-and-view) или выбрать нужное [руководство](../guides/).
