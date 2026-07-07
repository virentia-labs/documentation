# Next.js App Router

Use this recipe when a Next.js route prepares Virentia state on the server and
continues from that state on the client.

This page uses only the public API that exists in `@virentia/core` today:
`scope`, `scoped`, and `scope({ values })`. There is no exported
automatic full-scope serializer in the current package, so the serialized
payload below is an app-owned adapter. When core exposes full scope
serialization, that adapter can be replaced by the core API.

## Model

The model is shared by server and client code. The server runs it in a request
scope; the client reads the same stores in a browser scope.

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

The default effect handler is browser-safe. Server-only code can override it in
the request scope.

## State Payload

Create an app adapter that turns the server scope into a serializable payload
and creates a browser scope from that payload.

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

This adapter is intentionally local to the application. It names the state that
is allowed to cross the server/client boundary and uses `scope({ values })` to
seed the browser scope.

## Server

Create a fresh scope for each request. Run the model inside `scoped`, whose
promise waits for the async graph the callback triggers, then serialize the
state that should be available to the client.

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

The request scope can use server-only handlers, cookies, headers, database
clients, guards, forms, or route models. Only the serialized state crosses into
the client tree.

## Client Provider

The provider is a Client Component. It creates the browser scope once from the
server state.

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

Use a `key` when a new server result should replace the whole browser scope.

## Page

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

Client components then use the regular React bindings.

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

This keeps the SSR lifetime correct: one request scope on the server, one
browser scope on the client, and no global state shared between users.

