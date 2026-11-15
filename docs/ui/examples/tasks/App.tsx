/** @jsxImportSource @virentia/ui */
import { component, For } from "@virentia/ui";
import { Board, Task } from "./models";

export const TaskEditor = component({ model: Task, view: (_props, self) =>
  <section><label>Draft <input ref={self.model.input} value={self.model.draft} onInput={self.model.changeDraft} /></label>
    <button onClick={self.model.save}>Save</button></section>,
});
export const TaskRow = component({ model: Task, view: (_props, self) =>
  <li><input type="checkbox" checked={self.model.done} onChange={self.model.toggleDone} /><strong>{self.model.title}</strong></li>,
});
export default component({ model: Board, view(_props, self) {
  function content() {
    const task = self.model.tasks.items[0];
    if (self.model.editorOpen.value && task) return <TaskEditor model={task} />;
    return <ul><For each={self.model.tasks} view={TaskRow} fallback={<li>No tasks</li>} /></ul>;
  }
  return <main><h1>{self.model.title}</h1>
    <form onSubmit={self.model.addTask}>
      <input value={self.model.newTitle} onInput={self.model.changeNewTitle} /><button>Add</button>
    </form>
    <button onClick={self.model.toggleEditor}>Switch list/editor</button>
    <p>Tasks: {self.model.count}</p>{content}
  </main>;
} });
