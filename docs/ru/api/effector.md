# API @virentia/effector

`@virentia/effector` связывает юниты Virentia с юнитами настоящего пакета `effector`.

## associate

```ts
import { associate } from "@virentia/effector";

const association = associate({
  virentia: virentiaScope,
  effector: effectorScope,
});
```

Создает глобальную association для одного scope Virentia и одного scope Effector. Пакет хранит association в weak map, сразу по обоим scope.

Возвращаемый `EffectorAssociation` содержит ту же пару scope:

```ts
association.virentia;
association.effector;
```

Метода `dispose()` нет. Association достижима, пока достижимы ее scope.

## ensureAssociation

```ts
import { ensureAssociation } from "@virentia/effector";

const association = ensureAssociation({ effector: effectorScope });
```

Ищет существующую association по scope Effector, scope Virentia или по обоим сразу. Если связи нет, бросает ошибку.

## effectorAssociations

```ts
import { effectorAssociations } from "@virentia/effector";

effectorAssociations.byVirentia.get(virentiaScope);
effectorAssociations.byEffector.get(effectorScope);
```

Глобальный weak-map registry. В коде приложения обычно достаточно `associate` и `ensureAssociation`; прямой доступ полезен для диагностики и интеграционных тестов.

## fool

```ts
import { fool } from "@virentia/effector";

const universalUnit = fool(unit);
```

Возвращает проходной универсальный юнит. Используйте возвращенное значение на границах фич:

```ts
sample({
  clock: universalUnit,
  target: effectorTarget,
});

reaction({
  on: universalUnit,
  run(payload) {},
});
```

Результат можно использовать как Effector-юнит в `clock`, `source` или `target`, и как Virentia-юнит в `reaction`, `on`, `run` и `scoped`.

::: warning Прямые вызовы
`fool(original)` не мутирует `original`. Сохраняйте и передавайте возвращенный юнит. Вызов `original` остается вызовом исходного runtime-юнита, а не fooled-обертки. Мост может увидеть этот исходный вызов и передать его через связанные scope, но гибридный API есть только у значения, которое вернул `fool`.
:::

Если fooled-юниту нужен второй runtime, но association не находится по текущему scope Virentia или scope Effector из `stack.scope`, пакет бросает ошибку.
