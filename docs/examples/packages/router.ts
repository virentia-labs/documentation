// #region model
import { scope, scoped } from "@virentia/core";
import { staticModel } from "@virentia/core/models";
import { historyAdapter, route, router } from "@virentia/router";
import { createMemoryHistory } from "history";

export const Screen = staticModel({
  name: "DocsScreen",
  setup() {
    const page = route({ path: "/edit/:id" });
    return { page, navigation: router({ routes: [page] }) };
  },
});
// #endregion model

// #region use
export async function navigateIndependently() {
  const app = scope();
  const first = scoped(app, () => Screen.create({ id: "first" }));
  const second = scoped(app, () => Screen.create({ id: "second" }));
  const firstHistory = createMemoryHistory();
  const secondHistory = createMemoryHistory();
  try {
    await first.navigation.setHistory(historyAdapter(firstHistory));
    await second.navigation.setHistory(historyAdapter(secondHistory));
    await first.page.open({ params: { id: "ada" } });
    await second.page.open({ params: { id: "grace" } });
    return {
      paths: [firstHistory.location.pathname, secondHistory.location.pathname],
      params: [first.page.params.value, second.page.params.value],
      bound: first.navigation.knownRoutes[0]!.route === first.page,
    };
  } finally {
    await first.dispose(); // also releases its history listener
    await second.dispose();
  }
}
// #endregion use
