/** @jsxImportSource @virentia/ui */
// Virentia with its template compiler (as @virentia/ui/vite does): a Row component per row, row-local store.
import { render, scope, scoped, store } from '@virentia/ui';
import type { Mounted } from './types';

export function mountVirentia(container: HTMLElement, n: number, stride: number): Mounted {
  const app = scope();
  const values: ReturnType<typeof store<number>>[] = [];
  function Row(props: { id: number }) {
    const value = store(0); values[props.id] = value;
    return <tr data-row={props.id}><td>{String(props.id)}</td><td>{() => value.value}</td></tr>;
  }
  const ids = Array.from({ length: n }, (_, id) => id);
  const dispose = render(() => <table><tbody>{ids.map(id => <Row id={id} key={id} />)}</tbody></table>, container, { scope: app });
  return {
    async update(value) { scoped(app, () => { for (let i = 0; i < n; i += stride) values[i].value = value; }); },
    dispose,
  };
}
