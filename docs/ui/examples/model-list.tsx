/** @jsxImportSource @virentia/ui */
import { component, For, render, scope, scoped } from "@virentia/ui";
import { Board, createBoard } from "./tasks/models";
import { TaskRow } from "./tasks/App";
const BoardView = component({ model: Board, view: (_props, self) => <ul><For each={self.model.tasks} view={TaskRow} /></ul> });
export function mountTasks(container: Element) {
  const appScope = scope();
  const board = scoped(appScope, () => createBoard());
  const unmount = render(() => <BoardView model={board} />, container, { scope: appScope });
  return { board, unmount };
}
