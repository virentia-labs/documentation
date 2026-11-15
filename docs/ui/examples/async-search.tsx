/** @jsxImportSource @virentia/ui */
import { scoped } from "@virentia/core";
import { f, model } from "@virentia/core/models";
import { action, component, For, render, scope } from "@virentia/ui";
export type Search = (query: string, signal: AbortSignal) => Promise<readonly string[]>;
export function makeSearchBox(search: Search) {
  const SearchModel = model({
    data: { query: f.string(""), results: f.array(f.string(), []), pending: f.boolean(false), error: f.string("").optional() },
    setup(self) {
      const input = action(async (event: InputEvent, api) => {
        const text = (event.currentTarget as HTMLInputElement).value.trim();
        self.query.value = text; self.results.value = []; self.error.value = ""; self.pending.value = !!text;
        if (!text) return;
        try {
          const found = await search(text, api.signal);
          if (!api.signal.aborted) scoped(api.scope, () => { self.results.value = [...found]; });
        } catch (reason) {
          if (!api.signal.aborted) scoped(api.scope, () => { self.error.value = reason instanceof Error ? reason.message : "Search failed"; });
        } finally {
          if (!api.signal.aborted) scoped(api.scope, () => { self.pending.value = false; });
        }
      });
      return { input };
    },
  });
  return component({ model: SearchModel, view(_props, self) {
    function status() { if (self.model.pending.value) return <p role="status">Searching…</p>; return null; }
    function error() { if (self.model.error.value) return <p role="alert">{self.model.error}</p>; return null; }
    return <section><input value={self.model.query} onInput={self.model.input} />{status}{error}
      <ul><For each={self.model.results} view={(title: import("@virentia/ui").Readable<string>) => <li>{title}</li>} /></ul>
    </section>;
  } });
}
export function mountSearch(container: Element, search: Search) {
  const SearchBox = makeSearchBox(search);
  return render(() => <SearchBox />, container, { scope: scope() });
}
