/** @jsxImportSource @virentia/ui */
import { component, render, scope, scoped } from "@virentia/ui";
import { Board, createBoard } from "./tasks/models";
import { TaskEditor } from "./tasks/App";
const BoardEditor = component({ model: Board, view(_props, self) {
  function editor() {
    if (!self.model.editorOpen.value) return null;
    const task = self.model.tasks.items[0];
    return task ? <TaskEditor model={task} /> : null;
  }
  return <main><h1>{self.model.title}</h1><button onClick={self.model.toggleEditor}>Open/close</button>{editor}</main>;
} });
export function mountEditor(container: Element) {
  const appScope = scope();
  const board = scoped(appScope, () => createBoard());
  return { board, unmount: render(() => <BoardEditor model={board} />, container, { scope: appScope }) };
}
