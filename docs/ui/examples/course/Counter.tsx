/** @jsxImportSource @virentia/ui */
import { f, staticModel } from "@virentia/core/models";
import { action, component, computed } from "@virentia/ui";

export const CounterModel = staticModel({
  name: "LearningCounter",
  data: {
    count: f.number(0),
    label: f.string("Counter"),
    expanded: f.boolean(true),
  },
  setup(self) {
    const increment = action(() => { self.count.value++; });
    const doubled = computed(() => self.count.value * 2);
    const toggle = action(() => { self.expanded.value = !self.expanded.value; });
    return { increment, doubled, toggle };
  },
});

export const Counter = component({
  model: CounterModel,
  view(_props, self) {
    const counter = self.model;
    function details() {
      if (!counter.expanded.value) return null;
      return <output>Doubled: {counter.doubled}</output>;
    }
    return <section class="counter">
      <h2>{counter.label}</h2>
      <button onClick={counter.increment}>Count: {counter.count}</button>
      <button onClick={counter.toggle}>Details</button>
      {details}
    </section>;
  },
});
