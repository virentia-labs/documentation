// Solid with its JSX compiler (babel-preset-solid): a Row component per row, row-local signal.
import { batch, createSignal, For } from 'solid-js';
import { render } from 'solid-js/web';
import type { Mounted } from './types';

export function mountSolid(container: HTMLElement, n: number, stride: number): Mounted {
  const setters: Array<(value: number) => void> = [];
  function Row(props: { id: number }) {
    const [value, set] = createSignal(0); setters[props.id] = set;
    return <tr data-row={props.id}><td>{String(props.id)}</td><td>{value()}</td></tr>;
  }
  const ids = Array.from({ length: n }, (_, id) => id);
  const dispose = render(() => <table><tbody><For each={ids}>{id => <Row id={id} />}</For></tbody></table>, container);
  return {
    async update(value) { batch(() => { for (let i = 0; i < n; i += stride) setters[i](value); }); },
    dispose,
  };
}
