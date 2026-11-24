// Vue 3.6 Vapor mode (release candidate): the same SFCs with <script setup vapor>, no virtual DOM: a Row component per row, row-local shallowRef.
import { createVaporApp as createApp, nextTick } from 'vue';
import Table from './vue-vapor/Table.vue';
import { resetValues } from './vue-vapor/registry';
import type { Mounted } from './types';

export function mountVueVapor(container: HTMLElement, n: number, stride: number): Mounted {
  const values = resetValues();
  const app = createApp(Table, { ids: Array.from({ length: n }, (_, id) => id) });
  app.mount(container);
  return {
    async update(value) { for (let i = 0; i < n; i += stride) values[i].value = value; await nextTick(); },
    dispose() { app.unmount(); },
  };
}
