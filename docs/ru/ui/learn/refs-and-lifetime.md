# Refs и жизненный цикл

Для фокуса нужен сам DOM-элемент. Храните ссылку в сторе модели и используйте событие `mounted`, когда элемент уже подключён.

```tsx
const FieldModel = staticModel({
  with: [ui],
  setup(self) {
    const input = ref<HTMLInputElement>();
    reaction({
      on: self.mounted,
      run: () => input.value?.focus(),
    });
    return { input };
  },
});
const Field = component({
  model: FieldModel,
  view: (_props, self) => <input ref={self.model.input} />,
});
```

`staticModel` импортируется из Core models; остальные функции — из UI. `ref` — изменяемый стор `Element | null`. Trait `ui` добавляет модели события `mounted` и `unmounted`.

<UIWalkthrough kind="refs" />

## Завершение отображения

При монтировании сначала заполняются refs, затем запускаются mounted-реакции: у родителя, потом у детей.

При размонтировании unmounted-реакции выполняются, пока DOM и refs ещё доступны. Рендер ждёт их завершения, удаляет узлы и записывает в refs null. Поэтому `await unmount()` можно использовать для ожидания анимации ухода.

Если реакция завершится ошибкой, очистка всё равно выполнится, а unmount вернёт ошибку. На сервере refs остаются null и lifecycle-события не вызываются.

[Справочник refs и событий](../api/refs-events) описывает типы и DOM payload.
