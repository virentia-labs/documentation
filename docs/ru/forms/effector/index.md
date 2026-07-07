---
title: Обзор
---

# Формы · Effector

`@virentia/forms` не зависит ни от UI, ни от рантайма: форма — это модель,
состояние которой живёт в стор-ах Virentia. Часть продуктов уже работает на
**Effector** и хочет читать состояние формы и управлять её жизненным циклом из
Effector-графа — `sample`, эффекты, `allSettled` — не переписывая форму.

`@virentia/forms-effector` — этот мост. Он построен на `fool` из
[`@virentia/effector`](../../effector/), поэтому форма Virentia остаётся
единственным источником истины; пакет **не** переизобретает форму на Effector.
Вложенные юниты (элементы array-поля, shape-поля, вложенные группы) отдаются
через lens-API в форме
[`@effector-kit/models`](https://github.com/movpushmov/effector-kit).

## Установка

```sh
pnpm add @virentia/forms-effector @virentia/forms @virentia/effector effector @virentia/core
```

## Как устроен раздел

Каждая страница берёт один вид поля или ситуацию и показывает, как это выглядит
после `formToEffector`. Начните здесь — с модели верхнего уровня и скоупов —
затем переходите к нужному виду поля.

| Страница                              | Когда нужна |
| ------------------------------------- | ----------- |
| [Поле](./field)                       | Leaf-поле нужно читать и им управлять из Effector. |
| [Array-поле](./array-field)           | Упорядоченному списку нужна линза по элементам с ключом. |
| [Shape-поле](./shape-field)           | Объекту с динамическими ключами нужна линза по детям. |
| [Кастомное поле](./custom-field)      | Композитное/кастомное поле должно отдать свои вложенные юниты. |
| [Рецепты](./recipes)                  | Небольшие частые ситуации: submit, серверные ошибки, зеркалирование. |

## Преобразование формы

`formToEffector` один раз обходит форму и возвращает её Effector-проекцию. Он
опирается только на публичный контракт формы, поэтому кастомные и композитные
поля работают, если отдают свои юниты и `readFields()`.

```ts
import { createArrayField, createField, createForm } from "@virentia/forms";
import { formToEffector } from "@virentia/forms-effector";

const form = createForm({
  schema: {
    email: createField(""),
    phones: createArrayField<string>([""]),
  },
});

const model = formToEffector(form);
```

## Ассоциация скоупов

Мост следует тому же правилу, что и `@virentia/effector`: fool-нутый юнит берёт
скоуп из **текущего запуска**. Свяжите скоуп Virentia с форкнутым скоупом
Effector один раз на запуск (тест, запрос, рендер) и триггерьте внутри него.

```ts
import { scope as virentiaScope } from "@virentia/core";
import { associate } from "@virentia/effector";
import { allSettled, fork } from "effector";

const vScope = virentiaScope();
const eScope = fork();

associate({ virentia: vScope, effector: eScope });

await allSettled(model.fill, {
  scope: eScope,
  params: { values: { email: "user@example.com" } },
});
```

Без ассоциации или без скоупа в текущем запуске нижележащие fool-нутые юниты
бросают исключение, а не создают скрытый скоуп. Скоуп выбирается через `scoped`,
Effector `allSettled` / `scopeBind` / `launch` или UI-провайдеры. Полная модель —
на странице [скоупов](../../effector/scopes) ядрового моста Effector.

## Модель верхнего уровня

Состояние формы отдаётся `$`-стор-ами Effector, жизненный цикл — событиями
Effector, а каждый мутирующий метод — Effector-**эффектом**, который выполняет
метод Virentia внутри ассоциированного скоупа Virentia.

| Группа   | Члены |
| -------- | ----- |
| Стор-ы   | `$values`, `$value`, `$errors`, `$innerErrors`, `$outerErrors`, `$snapshot`, `$isChanged`, `$isValid`, `$isValidationPending` |
| События  | `filled`, `changed`, `errorsChanged`, `validated`, `validationFailed`, `submitted`, `validatedAndSubmitted` |
| Эффекты  | `submit`, `validate`, `fill`, `reset`, `clearOuterErrors`, `clearInnerErrors`, `forceUpdateSnapshot` |

```ts
import { createEvent, sample } from "effector";

// Сабмит по Effector-клоку
const submitClicked = createEvent();
sample({ clock: submitClicked, target: model.submit });

// Реакция на провалидированную форму
model.validated.watch((values) => console.log("валидный payload", values));
```

Так как методы — это эффекты, `.pending` и `.done` / `.fail` работают как обычно,
а `fill` / `reset` / `submit` последовательно проигрывают свои сайд-эффекты
внутри скоупа Virentia.

## Вложенные юниты — линза

`model.fields` повторяет схему. Leaf-поля отдают юниты как действия watch
(`clock()`) или dispatch (`target()`); array- и shape-поля — коллекционные линзы
с ключом по стабильному id. Каждая страница раздела — экскурсия по одной из этих
форм.

```ts
model.fields.email.state.clock();          // Event<string>
model.fields.email.change.target();        // EventCallable<string>
model.fields.phones.ids("0").state.clock();
```

Операторы выбора — `ids`, `where`, `first`, `last`, `single`, `delete`,
`getSource`, `props` — повторяют сигнатуру линзы `@effector-kit/models`. `union`,
`ref` и алиасы инстансов не имеют аналога в фиксированной схеме формы и сознательно
не отдаются.
