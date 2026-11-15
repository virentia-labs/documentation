import { scoped } from "@virentia/core";
import { expect, test } from "vitest";
import { f, staticModel } from "@virentia/core/models";
import { action, component, h, render, scope } from "@virentia/ui";

const Model = staticModel({ data: { count: f.number(0) }, setup(self) {
  return { increment: action(() => { self.count.value++; }) };
} });
const Counter = component({ model: Model, view: (_props, self) =>
  h("button", { onClick: self.model.increment }, self.model.count) });

test.concurrent.each(["first", "second"])("preserves DOM in %s", async () => {
  const appScope = scope();
  const container = document.createElement("div");
  const unmount = render(() => h(Counter, { id: "same" }), container, { scope: appScope });
  try {
    const counter = scoped(appScope, () => Counter.model.get("same"))!;
    const before = container.querySelector("button")!;
    const text = [...before.childNodes].find((node) => node.nodeType === 3);
    await counter.increment();
    expect(container.querySelector("button")).toBe(before);
    expect(before.textContent).toBe("1");
    expect([...before.childNodes]).toContain(text);
  } finally { await unmount(); }
});
