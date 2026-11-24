/** @jsxImportSource @virentia/ui */
import App from "./tasks/App";
import { createBoard, type TaskData } from "./tasks/models";
export interface PageData { title: string; tasks: TaskData[] }
export function pageView(data: PageData) {
  const board = createBoard(data.tasks, "board", data.title);
  return <App model={board} />;
}
