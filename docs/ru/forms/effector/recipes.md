---
title: Рецепты
---

# Рецепты

Небольшие частые ситуации, каждая самодостаточна. Все сниппеты предполагают
модель из [обзора](./index): форму, преобразованную через `formToEffector`,
[ассоциацию](./index#ассоциация-скоупов) между скоупом Virentia и форкнутым
скоупом Effector и запуск, внутри которого триггерим. Как только эта связка
есть, модель — это просто Effector: `$`-стор-ы, события, эффекты и линза
`fields`, — так что эти рецепты обычные графы `sample` / `combine` /
`allSettled`.

```ts
const model = formToEffector(form);
associate({ virentia: vScope, effector: eScope });
```

## Сабмит по клоку

`submit` — это эффект. Наведите на него любой UI- или Effector-клок, а затем
реагируйте на события жизненного цикла, а не ждите в месте вызова.

```ts
import { createEvent, sample } from "effector";

const submitClicked = createEvent();

sample({ clock: submitClicked, target: model.submit });

// validated: форма прошла валидацию, payload — это values
model.validated.watch((values) => console.log("valid", values));

// submitted: onSubmit формы отработал до конца
model.submitted.watch((values) => console.log("submitted", values));
```

`validationFailed` срабатывает вместо `validated`, когда валидация отклоняется, а
`validatedAndSubmitted` — когда произошло и то, и другое.

## Гейт кнопки сабмита

Выведите флаг disabled кнопки из стор-ов верхнего уровня. `$isValid` отражает
текущие ошибки, `$isValidationPending` истинно, пока идут асинхронные валидаторы.

```ts
import { combine } from "effector";

const $canSubmit = combine(
  model.$isValid,
  model.$isValidationPending,
  (isValid, isPending) => isValid && !isPending,
);
```

Читайте `$canSubmit` в UI-биндинге. Он обновляется внутри ассоциированного
скоупа, поэтому в тестах читайте его через `scope.getState($canSubmit)`.

## Серверные ошибки в outer-канал

Ошибки валидации и серверные ошибки живут в разных каналах, чтобы одна не стирала
другую — см. [каналы ошибок](../errors). После отказа сервера пишите ответ
в **outer**-канал через `fill({ errors })`; локальные валидаторы трогают только
inner-канал, поэтому серверное сообщение остаётся на месте, пока вы его не
очистите.

```ts
import { allSettled, sample } from "effector";

// на отклонённом эффекте сабмита пробрасываем серверный payload
sample({
  clock: saveArticleFx.failData,
  fn: (error) => ({ errors: { email: error.fieldErrors.email } }),
  target: model.fill,
});

// или напрямую в тесте / обработчике
await allSettled(model.fill, {
  scope: eScope,
  params: { errors: { email: "Taken" } },
});
```

Очищайте outer-канал — например, при следующем редактировании — через
`clearOuterErrors`:

```ts
sample({ clock: model.changed, target: model.clearOuterErrors });
```

## Зеркалирование значения поля в свой стор

Leaf-поле отдаёт свой стор значения как watch-действие. Сверните его в обычный
стор Effector, когда хотите производить что-то от него вне формы.

```ts
import { createStore } from "effector";

const $email = createStore("").on(
  model.fields.email.state.clock(),
  (_, value) => value,
);
```

Полную линзу leaf-поля (`state`, `change`, `setOuterError`) см. на странице
[поле](./field).

## Управление полем из внешнего события

`change` — это target-действие, поэтому внешнее событие может писать прямо в
значение поля. Форма остаётся источником истины — это проходит через её конвейер
изменений, а не в обход.

```ts
import { sample } from "effector";

const emailReceived = createEvent<string>();

sample({ clock: emailReceived, target: model.fields.email.change.target() });
```

Чтобы прикрепить к полю серверную ошибку, наведитесь на
`model.fields.email.setOuterError.target()`.

## Сброс и снапшот

`reset` возвращает форму к начальным значениям; `forceUpdateSnapshot` делает
текущие значения новым базовым состоянием. `$isChanged` сравнивает живые значения
с этим снапшотом.

```ts
import { allSettled } from "effector";

// отбросить правки
await allSettled(model.reset, { scope: eScope });

// принять текущие значения как новое чистое состояние
await allSettled(model.forceUpdateSnapshot, { scope: eScope });

model.$isChanged.watch((changed) => console.log("dirty:", changed));
```

Частая связка: после успешного сохранения перебазировать снапшот, чтобы форма
снова читалась как чистая.

```ts
sample({ clock: model.submitted, target: model.forceUpdateSnapshot });
```

## Удаление пустых элементов массива

Линза array-поля — это коллекция с ключом по стабильному id. Выберите нужные
элементы через `where`, затем `delete()` вернёт событие, которое можно
триггерить. Здесь мы выбрасываем каждый пустой телефон перед сабмитом.

```ts
import { sample } from "effector";

const prune = model.fields.phones.where((p) => !p.value).delete();

sample({ clock: cleanupClicked, target: prune });
```

Полную коллекционную линзу — `ids`, `where`, `first` / `last` / `single` и
`delete` — см. на странице [array-поле](./array-field).
