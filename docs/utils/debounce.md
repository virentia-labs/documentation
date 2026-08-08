# debounce

Waits for the source to go quiet, then emits its last value once.

```ts
debounce(source, ms);
debounce(source, { ms, leading: true });
```

The operator preserves the kind of the source: a store in — a store out (holding the last settled value, starting from the source's declaration initial); an event in — an event out.

## Search as you type

The main case. Take the raw input store, get a store that settles only when the typing pauses:

```ts
import { computed, store } from "@virentia/core";
import { debounce } from "@virentia/core/utils";

const query = store("");
const settled = debounce(query, 300); // Store<string>

const results = computed(() => search(list.value, settled.value));
```

`results` recomputes once per pause, not once per keystroke — and everything subscribed to it re-renders once per pause too. `settled` is an ordinary store: derive from it, subscribe to it, read it in a scope.

## Autosave a draft

The event form. Save when the user stops editing:

```ts
const draftChanged = event<Draft>();
const settled = debounce(draftChanged, 2000); // Event<Draft>

reaction({ on: settled, run: (draft) => void saveDraftFx(draft) });
```

Every edit within two seconds pushes the save further away; one `saveDraftFx` call per editing burst.

## Act now, ignore the burst

`leading: true` inverts the edge: the **first** hit passes immediately, then silence until a full quiet window:

```ts
const refresh = debounce(refreshClicked, { ms: 1000, leading: true });
```

The first click refreshes right away; frantic re-clicking does nothing until the user calms down for a second.

## When to reach for it

- Text inputs that drive anything expensive — search, validation against a server, filtering a large list.
- Autosave, "seen" markers, презенс-updates — anything that should fire once per burst of activity, with the final value.
- With `leading` — buttons that should respond instantly but not repeatedly.

When not: if you need a steady rate *during* the activity (progress while scrolling), that is [throttle](/utils/throttle); if you just need "later", that is [delay](/utils/delay).

## Behaviour notes

- **Windows are per scope.** Typing in one scope neither delays nor flushes another — a test and an SSR request each get their own quiet window.
- **Awaiting the source does not include the debounced emission.** It is a new root update `ms` later; a failure downstream of it is reported through the [error funnel](/core/reactions#when-a-reaction-throws), never an unhandled rejection.
- **Owner dispose cancels the pending window** — nothing fires after teardown.
- **Fake timers just work**: the operator sits on plain `setTimeout`, so `vi.useFakeTimers()` + `vi.advanceTimersByTime(300)` drive it deterministically.
