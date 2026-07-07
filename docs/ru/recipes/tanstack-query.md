# TanStack Query

TanStack Query удобно оставить владельцем серверного кеша: загрузка, retry,
deduplication, stale/fresh-состояние и invalidation остаются там. Virentia при
этом хорошо подходит для состояния пользовательского сценария: выбранные
элементы, черновики форм, шаги визарда, optimistic-флаги и доменные события.

Главное правило: не копируйте каждый query response в store Virentia. Данные
запроса читайте из TanStack Query, а в Virentia кладите то, что относится к
поведению приложения.

## Провайдеры

Обе библиотеки имеют свой runtime. Создавайте `QueryClient` и scope один раз на
смонтированное React-дерево.

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

## Query в UI, выбор в модели

В этом примере список пользователей приходит из TanStack Query, а выбранный
пользователь хранится в Virentia. Выбор - это уже часть UI-сценария, а не
серверный кеш.

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

  if (users.isPending) return <p>Загрузка...</p>;
  if (users.isError) return <p>Не удалось загрузить пользователей</p>;

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

Если список обновится, TanStack Query сам отдаст новый `users.data`. Выбранный
`selectedUserId` останется в scope Virentia, потому что это состояние сценария,
а не часть ответа сервера.

## Mutation и реакция модели

После успешного сохранения обычно нужно сделать две вещи:

- обновить или инвалидировать query cache;
- сообщить модели, что пользовательский сценарий завершился успешно.

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
import { scoped } from "@virentia/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      await scoped(scope, () => userSaved(savedUser));
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <button
      type="button"
      disabled={save.isPending}
      onClick={() => save.mutate(user)}
    >
      Сохранить
    </button>
  );
}
```

Так сетевой кеш остается в TanStack Query, а доменная реакция на успешное
сохранение остается в Virentia и тестируется как обычная модель.
