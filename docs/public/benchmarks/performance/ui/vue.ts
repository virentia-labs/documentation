// Vue 3.5 SFCs (<script setup>, production-compiled with an inline template): a Row component per row, row-local shallowRef.
import { createApp, nextTick } from 'vue';
import Table from './vue/Table.vue';
import { resetValues } from './vue/registry';
import type { Mounted } from './types';

export function mountVue(container: HTMLElement, n: number, stride: number): Mounted {
  const values = resetValues();
  const app = createApp(Table, { ids: Array.from({ length: n }, (_, id) => id) });
  app.mount(container);
  return {
    async update(value) { for (let i = 0; i < n; i += stride) values[i].value = value; await nextTick(); },
    dispose() { app.unmount(); },
  };
}
