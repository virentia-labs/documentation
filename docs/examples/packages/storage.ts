// #region model
import { scope, scoped } from "@virentia/core";
import { f, staticModel } from "@virentia/core/models";
import { memory, persist, type StorageBox } from "@virentia/storage-core";

export const Preferences = staticModel({
  name: "DocsPreferences",
  data: { theme: f.string("light") },
  setup(self) {
    return {
      connect(storage: StorageBox, key: string) {
        return persist({ source: self.theme, key, storage });
      },
    };
  },
});
// #endregion model

// #region use
export async function savePreferences() {
  const app = scope();
  const first = scoped(app, () => Preferences.create({ id: "first" }));
  const second = scoped(app, () => Preferences.create({ id: "second" }));
  const box = memory();
  try {
    first.connect(box, "first/theme");
    second.connect(box, "second/theme");
    first.theme.value = "dark";
    const saved = [box.get("first/theme"), box.get("second/theme")];
    await first.dispose(); // disconnects this instance's binding
    box.set("first/theme", "external");
    second.theme.value = "contrast"; // the sibling binding stays connected
    return { saved, sibling: box.get("second/theme") };
  } finally {
    await first.dispose();
    await second.dispose();
  }
}
// #endregion use
