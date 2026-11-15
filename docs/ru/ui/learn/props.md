---
aside: false
prev:
  text: "4. Вычисления"
  link: /ru/ui/learn/derived
next:
  text: "6. Условный вывод"
  link: /ru/ui/learn/conditions
---

# Пропсы

Один компонент пригодится для нескольких счётчиков. Добавим поле `label` и передадим каждому счётчику своё имя и начальное число.

<UIWalkthrough kind="props" />

Вместо одного `<Counter />` в `main.tsx` покажите оба:

```tsx
render(() => <>
  <Counter label="Coffee" count={2} />
  <Counter label="Tea" count={5} />
</>, container, { scope: appScope });
```

`label` и `count` — входные данные модели. Здесь переданы обычные строки и числа: они задают значения при создании экземпляра. View читает его сторы через `self.model`.

Нажмите кнопку Coffee. Tea не изменится: у каждого отображения свой экземпляр, хотя определение `CounterModel` общее.

Пропсы также могут быть реактивными источниками — это отдельное [руководство](../reactivity).
