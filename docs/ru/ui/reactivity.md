# Реактивные входные данные

Обычный проп задаёт входное значение. Если оно должно меняться после подключения компонента, передайте стор:

```tsx
const initial = store(2);
render(() => <Counter count={initial} />, container, {
  scope: appScope,
});
scoped(appScope, () => { initial.value = 8; });
```

Это тот же Counter из [учебника](./learn/model-lists). `store`, `scoped` и `render` импортируются из UI.

Теперь существующая кнопка показывает `8`, а computed `doubled` — `16`. View заново не вызывается. Заменив `count={initial}` на `count={initial.value}`, вы передали бы число-снимок.

Готовые юниты можно передавать и DOM-свойствам: `class={model.className}`, `disabled={model.busy}`, `value={model.text}`. Вычисления для этих значений объявляются в модели.

`value={model.text}` только отображает значение. Ввод пользователя обрабатывается event/action; автоматической двусторонней связи нет.

При интеграции с хостом источник пропса можно заменить другим стором без повторного вызова view. Подробный контракт входов — в [API компонентов](./api/components).
