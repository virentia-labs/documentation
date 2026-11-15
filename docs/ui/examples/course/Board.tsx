/** @jsxImportSource @virentia/ui */
import { children, staticModel } from "@virentia/core/models";
import { action, component, For } from "@virentia/ui";
import { Counter, CounterModel } from "./Counter";

export const BoardModel = staticModel({
  name: "LearningBoard",
  data: { counters: children.many(CounterModel) },
  setup(self) {
    const add = action(() => { self.counters.add({ label: "New counter" }); });
    const removeLast = action(() => {
      const items = self.counters.items;
      const last = items[items.length - 1];
      if (last) return self.counters.remove(last);
    });
    return { add, removeLast };
  },
});

export const Board = component({
  model: BoardModel,
  view: (_props, self) => <main>
    <h1>Counters</h1>
    <nav aria-label="List actions">
      <button onClick={self.model.add}>Add counter</button>
      <button onClick={self.model.removeLast}>Remove last</button>
    </nav>
    <div class="counters">
      <For each={self.model.counters} view={Counter} fallback={<p>No counters yet</p>} />
    </div>
  </main>,
});
