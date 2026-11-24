import { computed, reaction } from "@virentia/core";
import { children, f, staticModel, type InstanceOf } from "@virentia/core/models";
import { action, ref, ui } from "@virentia/ui";

export const Task = staticModel({
  name: "CourseTask", with: [ui],
  data: { title: f.string(), draft: f.string(""), done: f.boolean(false) },
  setup(self) {
    const input = ref<HTMLInputElement>();
    const changeDraft = action((event: InputEvent) => {
      self.draft.value = (event.currentTarget as HTMLInputElement).value;
    });
    const save = action(() => { const text = self.draft.value.trim(); if (text) self.title.value = text; });
    const toggleDone = action(() => { self.done.value = !self.done.value; });
    reaction({ on: self.mounted, run: () => input.value?.focus() });
    return { input, changeDraft, save, toggleDone, canSave: computed(() => !!self.draft.value.trim()) };
  },
});
export const Board = staticModel({
  name: "CourseBoard",
  data: { title: f.string("Virentia Tasks"), editorOpen: f.boolean(false), newTitle: f.string(""), tasks: children.many(Task) },
  setup(self) {
    const toggleEditor = action(() => { self.editorOpen.value = !self.editorOpen.value; });
    const changeNewTitle = action((event: InputEvent) => {
      self.newTitle.value = (event.currentTarget as HTMLInputElement).value;
    });
    const addTask = action((event: SubmitEvent) => {
      event.preventDefault();
      const title = self.newTitle.value.trim();
      if (title) self.tasks.add({ title, draft: title });
      self.newTitle.value = "";
    });
    return { toggleEditor, changeNewTitle, addTask, count: computed(() => self.tasks.count) };
  },
});
export type TaskInstance = InstanceOf<typeof Task>;
export type BoardInstance = InstanceOf<typeof Board>;
export type TaskData = { id: string; title: string; done?: boolean };
export const seedTasks: TaskData[] = [{ id: "task-1", title: "Learn Virentia" }];
export function createBoard(tasks: readonly TaskData[] = seedTasks, id = "board", title = "Virentia Tasks"): BoardInstance {
  return Board.create({ id, title, tasks: tasks.map((task) => ({ ...task, draft: task.title })) });
}
