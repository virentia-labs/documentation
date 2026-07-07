# React Router

Этот рецепт для приложений, где URL уже принадлежит React Router, а Virentia
нужна как модель состояния: loaders и actions запускают события, а экраны
читают результат через `useUnit`.

Если приложение использует `@virentia/router`, лучше смотреть раздел про
роутер. Здесь речь именно о совместной работе с React Router.

## Граница Приложения

React Router data router обычно создается вне React-дерева. Scope Virentia
создается на ту же lifetime-границу и передается в `ScopeProvider`.

```tsx
import { scope, scoped } from "@virentia/core";
import { ScopeProvider } from "@virentia/react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ProjectPage } from "./project-page";
import { projectOpened } from "./project.model";

const appScope = scope();

const router = createBrowserRouter([
  {
    path: "/projects/:projectId",
    async loader({ params }) {
      await scoped(appScope, () => projectOpened(params.projectId!));

      return null;
    },
    element: <ProjectPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <ScopeProvider scope={appScope}>
    <RouterProvider router={router} />
  </ScopeProvider>,
);
```

Для обычного client-only приложения module-level scope подходит. Для SSR,
тестов и встроенных виджетов создавайте отдельную пару `scope + router` на
request или экземпляр.

## Модель Роута

Loader запускает одно событие Virentia. Модель сама решает, что это событие
значит: загрузить данные, закрыть старое состояние, включить pending или
запустить guard.

```ts
import { effect, event, reaction, store } from "@virentia/core";

interface Project {
  id: string;
  title: string;
}

export const projectOpened = event<string>();
export const project = store<Project | null>(null);

export const loadProjectFx = effect(async (id: string) => {
  const response = await fetch(`/api/projects/${id}`);
  return response.json() as Promise<Project>;
});

reaction({
  on: projectOpened,
  run(id) {
    void loadProjectFx(id);
  },
});

reaction({
  on: loadProjectFx.doneData,
  run(nextProject) {
    project.value = nextProject;
  },
});
```

## Экран

Экран ничего не знает о loader. Он просто читает состояние модели из текущего
scope.

```tsx
import { useUnit } from "@virentia/react";
import { loadProjectFx, project } from "./project.model";

export function ProjectPage() {
  const model = useUnit({
    project,
    pending: loadProjectFx.pending,
  });

  if (model.pending) return <p>Загрузка...</p>;
  if (!model.project) return <p>Проект не найден</p>;

  return <h1>{model.project.title}</h1>;
}
```

`scoped` хорошо подходит для loaders и actions: React Router сообщает, что
произошло на границе URL, а промис `scoped` дожидается всего связанного state
graph в нужном scope.

