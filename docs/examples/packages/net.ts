// #region model
import { event, scope, scoped } from "@virentia/core";
import { staticModel } from "@virentia/core/models";
import { query, trigger } from "@virentia/net-core";

export const Search = staticModel({
  name: "DocsSearch",
  setup() {
    const changed = event<string>();
    const load = query({
      handler: async (text: string, { signal }) => {
        signal.throwIfAborted();
        return { text: text.toUpperCase() };
      },
    });
    trigger(load, { on: changed });
    return { changed, load };
  },
});
// #endregion model

// #region use
export async function searchIndependently() {
  const app = scope();
  const first = scoped(app, () => Search.create({ id: "first" }));
  const second = scoped(app, () => Search.create({ id: "second" }));
  try {
    await first.changed("ada");
    await second.load("grace");
    await first.load.refresh();
    const loaded = [first.load.data.value, second.load.data.value];
    await first.load.reset();
    return { loaded, reset: first.load.data.value, sibling: second.load.data.value };
  } finally {
    await first.dispose();
    await second.dispose();
  }
}
// #endregion use
