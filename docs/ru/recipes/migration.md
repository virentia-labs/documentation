# Миграция

Не заменяйте импорты `effector` глобально.

Существующий код Effector продолжает использовать настоящий пакет:

```ts
import { createEvent, createStore } from "effector";

export const effectorSubmitted = createEvent<string>();
export const $userId = createStore("").on(effectorSubmitted, (_, id) => id);
```

Новые модели Virentia пишутся отдельно:

```ts
import { event, store } from "@virentia/core";
import { fool } from "@virentia/effector";

export const virentiaSubmitted = fool(event<{ id: string }>());
export const userId = store("");
```

После этого части связываются явно через универсальный пограничный юнит:

```ts
import { sample } from "effector";

sample({
  clock: virentiaSubmitted,
  fn: ({ id }) => id,
  target: effectorSubmitted,
});
```

Association создается там, где известны оба scope:

```ts
import { associate } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Когда код Virentia вызывает `virentiaSubmitted` внутри `scoped(virentiaScope)`, мост берет association и запускает Effector target в `effectorScope`. Так приложение можно переносить постепенно. Библиотеки Effector продолжают работать с настоящим Effector, а модели Virentia остаются в своем scope.

## Операторы Effector

Используйте результат `fool`, когда существующий код Effector должен читать или вызвать юнит Virentia:

```ts
sample({
  clock: effectorSubmitted,
  target: virentiaSubmitted,
});
```

Также можно обернуть Effector-юнит и слушать его из Virentia:

```ts
const effectorSaved = fool(createEvent<string>());

reaction({
  on: effectorSaved,
  run(id) {
    userId.value = id;
  },
});
```
