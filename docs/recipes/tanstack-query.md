# TanStack Query

Use TanStack Query for server data cache and Virentia for local workflow state:
selected rows, form drafts, wizard progress, optimistic UI flags, and domain
events that should be testable outside React.

## Providers

Both libraries need one provider around the interactive app. Create each runtime
object once per mounted tree.

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { scope } from "@virentia/core";
import { ScopeProvider } from "@virentia/react";
import { useState, type ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [appScope] = useState(() => scope());

  return (
    <QueryClientProvider client={queryClient}>
      <ScopeProvider scope={appScope}>{children}</ScopeProvider>
    </QueryClientProvider>
  );
}
```

TanStack Query owns freshness, retries, deduplication, and invalidation.
Virentia owns the state that describes what the user is doing with that data.

## Query Data, Virentia Selection

```ts
import { event, reaction, store } from "@virentia/core";

export interface User {
  id: string;
  name: string;
}

export const userSelected = event<string | null>();
export const selectedUserId = store<string | null>(null);

reaction({
  on: userSelected,
  run(id) {
    selectedUserId.value = id;
  },
});
```

```tsx
import { useQuery } from "@tanstack/react-query";
import { useUnit } from "@virentia/react";
import { selectedUserId, userSelected, type User } from "./users.model";

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  return response.json();
}

export function UsersPage() {
  const users = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  const selectedId = useUnit(selectedUserId);
  const selectUser = useUnit(userSelected);

  if (users.isPending) return <p>Loading...</p>;
  if (users.isError) return <p>Unable to load users</p>;

  return (
    <ul>
      {users.data.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            aria-pressed={user.id === selectedId}
            onClick={() => selectUser(user.id)}
          >
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Do not mirror every query response into a Virentia store. Read query data from
TanStack Query until the app needs a durable local snapshot, such as a form
draft or a multi-step workflow.

## Mutations Back Into The Model

When a mutation succeeds, invalidate the query cache and emit a Virentia event
for local workflow state.

```ts
import { event, reaction, store } from "@virentia/core";
import type { User } from "./users.model";

export const userSaved = event<User>();
export const lastSavedUser = store<User | null>(null);

reaction({
  on: userSaved,
  run(user) {
    lastSavedUser.value = user;
  },
});
```

```tsx
import { allSettled } from "@virentia/core";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useProvidedScope } from "@virentia/react";
import { userSaved, type User } from "./users.model";

async function saveUser(user: User): Promise<User> {
  const response = await fetch(`/api/users/${user.id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });

  return response.json();
}

export function SaveUserButton({ user }: { user: User }) {
  const scope = useProvidedScope();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: saveUser,
    async onSuccess(savedUser) {
      await allSettled(userSaved, {
        scope,
        payload: savedUser,
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <button
      type="button"
      disabled={save.isPending}
      onClick={() => save.mutate(user)}
    >
      Save
    </button>
  );
}
```

This split keeps network cache behavior close to TanStack Query and keeps the
application reaction to success in the Virentia model.

