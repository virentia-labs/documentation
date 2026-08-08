---
title: React
---

# React

`@virentia/net-react` читает net-модели в компонентах React. Он не объявляет
query и не решает, когда они запускаются, — эта работа остаётся в моделях
[ядра](/ru/net/core/). React-пакет отвечает только на вопрос «при данном query
или mutation, что рендерить компоненту и как его вызывать?»

Query — это эффект Virentia, поэтому оба хука — тонкий сахар над `useUnit`: они
читают per-scope сторы и отдают колбэки, привязанные к предоставленному скоупу.
Ни собственного кеша, ни собственного контекста, ни жизненного цикла — скоуп из
`ScopeProvider` — единственная проводка.

## Страницы

- [useQuery](/ru/net/react/use-query) — `data`/`error`/`pending`/`stale` плюс
  привязанные к скоупу `run`/`refetch`/`reset`.
- [useMutation](/ru/net/react/use-mutation) — `data`/`error`/`pending` плюс
  привязанные к скоупу `mutate`/`reset`.

## Установка

```sh
pnpm add @virentia/net-core @virentia/net-react @virentia/core @virentia/react react
```

`@virentia/net-react` реэкспортирует `ScopeProvider`, `useProvidedScope` и
`useUnit`, так что компоненту хватает одного импорта для net и проводки скоупа.

## Минимальный компонент

```tsx
import { ScopeProvider, useQuery } from "@virentia/net-react";
import { scope } from "@virentia/core";
import { userQuery } from "./model";

function UserCard({ id }: { id: string }) {
  const user = useQuery(userQuery);

  if (user.pending) return <Spinner />;
  if (user.error) return <Retry onClick={() => user.run({ id })} />;

  return <Card data={user.data} />;
}

const appScope = scope();

export function App() {
  return (
    <ScopeProvider scope={appScope}>
      <UserCard id="42" />
    </ScopeProvider>
  );
}
```

Когда query запускается — [триггер](/ru/net/core/triggers) на роуте, `run` из
обработчика события, SSR-проход — решает модель; компонент лишь рендерит текущее
per-scope состояние.
