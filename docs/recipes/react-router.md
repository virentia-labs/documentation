# React Router

Use this recipe when React Router owns the URL and Virentia owns the app state
that route loaders, actions, and screens should update.

If you use `@virentia/router`, prefer the dedicated router pages. This recipe is
for apps already using React Router.

## App Boundary

Create the React Router data router outside the React tree, then wrap the
rendered app in `ScopeProvider`.

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

For client-only apps, one module-level `appScope` is fine. For SSR, tests, or
embedded widgets, create a fresh scope and router per request or instance.

## Route Model

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

The loader starts one Virentia event at a framework boundary. The model decides
what that event means.

## Screen

```tsx
import { useUnit } from "@virentia/react";
import { loadProjectFx, project } from "./project.model";

export function ProjectPage() {
  const model = useUnit({
    project,
    pending: loadProjectFx.pending,
  });

  if (model.pending) return <p>Loading...</p>;
  if (!model.project) return <p>Project not found</p>;

  return <h1>{model.project.title}</h1>;
}
```

Route loaders and actions are good places for `scoped` because the boundary
is explicit: React Router knows the URL event, and `scoped`'s promise waits for
the state graph that reacts to it.

