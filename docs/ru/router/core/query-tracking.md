---
title: Отслеживание query
---

# Отслеживание query

`appRouter.trackQuery` связывает query-параметры URL с событиями модели. Это нужно,
когда часть интерфейса хранится в строке запроса: диалог, фильтр, вкладка,
сортировка или состояние встроенного виджета.

`appRouter.query` подходит для прямого чтения. `appRouter.trackQuery` нужен, когда
вход или выход из query-состояния должен запускать код модели.

## API трекера

```ts
interface QueryTracker<Parameters> {
  entered: Event<Parameters>;
  exited: Event<void>;
  enteredExternally: Event<Parameters>;
  enteredProgrammatically: Event<Parameters>;
  exitedExternally: Event<void>;
  exitedProgrammatically: Event<void>;
  enter: EventCallable<Parameters>;
  exit: EventCallable<{ ignoreParams: string[] } | void>;
}
```

`parameters` принимает любой объект с `safeParse`:

```ts
interface QuerySchema<T> {
  safeParse(query: Query):
    | { success: true; data: T }
    | { success: false };
}
```

Роутер не требует Zod. Можно использовать Zod, Valibot, свой парсер или маленькую
inline-схему.

## Диалог в query

Частый сценарий — диалог, который открывается через query:

```ts
const inviteDialog = appRouter.trackQuery({
  forRoutes: [teamRoute],
  parameters: {
    safeParse(query) {
      return query.dialog === "invite"
        ? { success: true, data: { dialog: "invite" as const } }
        : { success: false };
    },
  },
});
```

Открыть и закрыть диалог можно через tracker:

```ts
inviteDialog.enter({ dialog: "invite" });
inviteDialog.exit();
```

`entered` срабатывает, когда query подходит под схему и один из `forRoutes`
открыт. `exited` срабатывает, когда query больше не подходит или приложение
уходит с этих роутов.

## Фильтры

Фильтры удобно читать из query, чтобы перезагрузка страницы сохраняла состояние:

```ts
const issueFilter = appRouter.trackQuery({
  forRoutes: [issuesRoute],
  parameters: {
    safeParse(query) {
      const status = query.status;

      return status === "open" || status === "closed"
        ? { success: true, data: { status } }
        : { success: false };
    },
  },
});

reaction({
  on: issueFilter.entered,
  run({ status }) {
    issues.status.value = status;
    void issues.loadFx();
  },
});
```

Записать фильтр в URL:

```ts
issueFilter.enter({ status: "open" });
```

## Закрыть и оставить часть query

По умолчанию `exit()` очищает query:

```ts
inviteDialog.exit();
```

Если закрытие одного состояния не должно стереть другое, передается список параметров,
которые надо оставить:

```ts
inviteDialog.exit({ ignoreParams: ["tab", "sort"] });
```

## Ручная проверка

По умолчанию tracker пересчитывается при изменении роута или query. Поле
`check` используется, если проверка должна запускаться только по отдельному событию:

```ts
const refreshed = event<void>();

const preview = appRouter.trackQuery({
  check: refreshed,
  parameters: previewSchema,
});
```

Это полезно, если парсер дорогой или host-страница меняет query часто, а модель
не должна реагировать на каждое изменение.

## Origin: внешние и программные изменения

`entered`/`exited` срабатывают на любой переход. Когда важен источник изменения,
каждое из них разделено по origin:

- `enteredExternally` / `exitedExternally` — query изменился снаружи: первичная
  загрузка, назад/вперёд или вручную отредактированный URL.
- `enteredProgrammatically` / `exitedProgrammatically` — query изменил сам роутер:
  через `enter`/`exit` либо `navigate`/`route.open`.

Origin определяется структурно: роутер узнаёт history-эхо URL, который сам только
что записал. Ничего не передаётся через payload.

```ts
const inviteDialog = appRouter.trackQuery({ forRoutes: [teamRoute], parameters });

// диалог открыт по ссылке или кнопкой назад/вперёд:
reaction({ on: inviteDialog.enteredExternally, run: syncFromUrl });

// приложение открыло его само:
reaction({ on: inviteDialog.enteredProgrammatically, run: focusFirstField });
```
