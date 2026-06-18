---
title: Провайдер
---

# Провайдер

`RouterProvider` помещает роутер в контекст React, чтобы представления роутов,
`Link` и хуки роутера могли его найти. При монтировании он опционально
подключает history-адаптер.

```tsx
function RouterProvider(props: {
  router: Router;
  history?: RouterAdapter;
  children?: ReactNode;
}): ReactNode;
```

## Скоуп и порядок провайдеров

Состояние роутера живет в скоупе Virentia, поэтому `RouterProvider` находится
внутри `ScopeProvider`. Все, что читает состояние роута, должно быть под обоими:

```tsx
import { ScopeProvider } from "@virentia/react";
import { RouterProvider } from "@virentia/router-react";
import { createBrowserHistory } from "history";
import { historyAdapter } from "@virentia/router";
import type { ReactNode } from "react";
import { appScope } from "./scope";
import { router } from "./router";

const routerHistory = historyAdapter(createBrowserHistory());

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ScopeProvider scope={appScope}>
      <RouterProvider router={router} history={routerHistory}>
        {children}
      </RouterProvider>
    </ScopeProvider>
  );
}
```

Порядок важен: сначала `ScopeProvider`, чтобы роутер писал в тот скоуп, из
которого рендерит React.

## Подключение history

Когда вы передаете `history`, `RouterProvider` при монтировании вызывает
`router.setHistory` в скоупе провайдера. Это обычное место для подключения
history в приложении, управляемом React.

Если history создается и подключается вне React — в серверном загрузчике, в
стартовой команде или в тесте, — пропустите этот проп и передайте только
`router`:

```tsx
<RouterProvider router={router}>
  <App />
</RouterProvider>
```

Тогда роутер использует ту history, которая была установлена через
`router.setHistory` в другом месте. Контракт history-адаптера и не-React-способы
его подключения описаны в
[Роутер и history](/ru/router/core/router#подключение-history).

## Вложенные роутеры

[Вложенный роутер](/ru/router/core/router#вложенные-роутеры) отрисовывается со
своим собственным `RouterProvider` только если поддереву нужен другой роутер в
контексте. Большинство приложений предоставляют единственный корневой роутер;
дочерние роутеры, зарегистрированные через `createRouter`, получают history от
родителя и не нуждаются в собственном провайдере.
