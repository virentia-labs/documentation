# Next.js App Router

Этот рецепт показывает SSR с Next.js: роут готовит состояние Virentia на
сервере и продолжает работу из этого состояния на клиенте.

Здесь используется только публичный API, который сейчас есть в `@virentia/core`:
`scope`, `scoped` и `scope({ values })`. В текущем пакете нет
экспортированного автоматического serializer для всего scope, поэтому payload
ниже - это адаптер приложения. Когда в core появится full scope serialization,
этот адаптер можно будет заменить на API ядра.

## Модель

Модель общая для сервера и клиента. Сервер запускает ее в request scope, клиент
читает те же stores уже в browser scope.

```ts
import { effect, event, reaction, store } from "@virentia/core";

export interface Session {
  userId: string;
  name: string;
}

export interface Dashboard {
  teamId: string;
  title: string;
  projects: string[];
}

export interface DashboardPayload {
  session: Session;
  dashboard: Dashboard;
}

export const dashboardOpened = event<string>();
export const session = store<Session | null>(null);
export const dashboard = store<Dashboard | null>(null);

export const loadDashboardFx = effect(async (teamId: string) => {
  const response = await fetch(`/api/dashboard/${teamId}`);
  return response.json() as Promise<DashboardPayload>;
});

reaction({
  on: dashboardOpened,
  run(teamId) {
    void loadDashboardFx(teamId);
  },
});

reaction({
  on: loadDashboardFx.doneData,
  run(payload) {
    session.value = payload.session;
    dashboard.value = payload.dashboard;
  },
});
```

Дефолтный handler эффекта безопасен для браузера. Серверный код может подменить
его внутри request scope.

## Payload состояния

Добавьте адаптер приложения: он читает состояние из server scope и создает
browser scope из этих данных.

```ts
import { scope, scoped, type Scope } from "@virentia/core";
import {
  dashboard,
  session,
  type Dashboard,
  type Session,
} from "./dashboard.model";

export interface DashboardState {
  session: Session | null;
  dashboard: Dashboard | null;
}

export function serializeDashboardState(requestScope: Scope): DashboardState {
  return scoped(requestScope, () => ({
    session: session.value,
    dashboard: dashboard.value,
  }));
}

export function createDashboardScope(state: DashboardState): Scope {
  return scope({
    values: [
      [session, state.session],
      [dashboard, state.dashboard],
    ],
  });
}
```

Это локальный адаптер приложения. Он явно называет состояние, которое можно
передать через server/client boundary, и использует `scope({ values })`, чтобы
заполнить browser scope.

## Сервер

На каждый request создавайте свежий scope. Запустите модель внутри `scoped` -
его промис дожидается асинхронного графа, запущенного колбэком, - затем
сериализуйте состояние, которое нужно клиенту.

```ts
import "server-only";

import { scope, scoped } from "@virentia/core";
import {
  dashboardOpened,
  loadDashboardFx,
  type DashboardPayload,
} from "./dashboard.model";
import { serializeDashboardState } from "./dashboard.ssr-state";
import { loadDashboardFromDatabase } from "./dashboard.server";

export async function prepareDashboard(teamId: string) {
  const requestScope = scope({
    handlers: [
      [
        loadDashboardFx,
        async (nextTeamId): Promise<DashboardPayload> =>
          loadDashboardFromDatabase(nextTeamId),
      ],
    ],
  });

  await scoped(requestScope, () => dashboardOpened(teamId));

  return {
    key: `dashboard:${teamId}`,
    state: serializeDashboardState(requestScope),
  };
}
```

Request scope может использовать server-only handlers, cookies, headers, базу,
guards, формы или route models. В клиентское дерево передается только
сериализованное состояние.

## Клиентский provider

Provider является Client Component. Он один раз создает browser scope из
серверного состояния.

```tsx
"use client";

import { ScopeProvider } from "@virentia/react";
import { useState, type ReactNode } from "react";
import {
  createDashboardScope,
  type DashboardState,
} from "./dashboard.ssr-state";

export function VirentiaProvider({
  children,
  state,
}: {
  children: ReactNode;
  state: DashboardState;
}) {
  const [appScope] = useState(() => createDashboardScope(state));

  return <ScopeProvider scope={appScope}>{children}</ScopeProvider>;
}
```

Используйте `key`, когда новый серверный результат должен полностью заменить
browser scope.

## Страница

```tsx
import { DashboardScreen } from "./dashboard-screen";
import { prepareDashboard } from "./dashboard.ssr";
import { VirentiaProvider } from "./virentia-provider";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const prepared = await prepareDashboard(teamId);

  return (
    <VirentiaProvider key={prepared.key} state={prepared.state}>
      <DashboardScreen />
    </VirentiaProvider>
  );
}
```

Дальше клиентские компоненты используют обычные React-bindings.

```tsx
"use client";

import { useUnit } from "@virentia/react";
import { dashboard, session } from "./dashboard.model";

export function DashboardScreen() {
  const model = useUnit({ dashboard, session });

  if (!model.dashboard || !model.session) return null;

  return (
    <main>
      <h1>{model.dashboard.title}</h1>
      <p>{model.session.name}</p>
    </main>
  );
}
```

Так lifetime остается правильным: один request scope на сервере, один browser
scope на клиенте и никакого общего global state между пользователями.

