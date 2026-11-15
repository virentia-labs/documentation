<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";
import { ShikiMagicMovePrecompiled } from "@shikijs/magic-move/vue";
import { walkthroughs } from "../ui-walkthroughs.mjs";
import tokens from "../ui-walkthrough-tokens.json";
import "@shikijs/magic-move/style.css";

const props = defineProps<{ kind: "render" | "ownership" | "refs" | "self" | "testing" | "component" | "state" | "events" | "derived" | "props" | "condition" | "list" }>();
const { lang, isDark } = useData();
const ru = computed(() => lang.value.startsWith("ru"));
const index = ref(0);
const reducedMotion = ref(true);
const steps = computed(() => walkthroughs[props.kind]);
const current = computed(() => steps.value[index.value]);
const compiled = computed(() => tokens[props.kind][isDark.value ? "virentia-dark" : "virentia-light"]);
let preference: MediaQueryList | undefined;
let resize: ResizeObserver | undefined;
const graph = ref<HTMLElement>();
const routes = ref<string[]>([]);
async function measureGraph() {
  await nextTick();
  if (!graph.value) return;
  const bounds = graph.value.getBoundingClientRect();
  const nodes = new Map(
    [...graph.value.querySelectorAll<HTMLElement>("[data-node]")].map((node) => [
      node.dataset.node,
      node.getBoundingClientRect(),
    ]),
  );
  routes.value = current.value.edges
    .map(([from, to]) => {
      const a = nodes.get(from),
        b = nodes.get(to);
      if (!a || !b) return "";
      if (Math.abs(a.top - b.top) < 10 && a.left < b.left) {
        const y = a.top + a.height / 2 - bounds.top;
        const x1 = a.right - bounds.left + 3;
        const x2 = b.left - bounds.left - 7;
        const between = [...nodes.values()].filter((box) =>
          box !== a && box !== b && box.left > a.left && box.left < b.left);
        if (between.length) {
          // A direct edge must not look like an edge from the intervening card.
          const detour = Math.max(a.bottom, b.bottom, ...between.map((box) => box.bottom)) - bounds.top + 14;
          return `M ${x1} ${y} L ${x1 + 5} ${y} L ${x1 + 5} ${detour} L ${x2 - 5} ${detour} L ${x2 - 5} ${y} L ${x2} ${y}`;
        }
        return `M ${a.right - bounds.left + 3} ${y} L ${b.left - bounds.left - 7} ${y}`;
      }
      const x1 = a.left + a.width / 2 - bounds.left;
      const x2 = b.left + b.width / 2 - bounds.left;
      const y1 = a.bottom - bounds.top + 3;
      const y2 = b.top - bounds.top - 7;
      const middle = (y1 + y2) / 2;
      return `M ${x1} ${y1} C ${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`;
    })
    .filter(Boolean);
}
const updateMotion = () => {
  reducedMotion.value = preference?.matches ?? true;
};
onMounted(() => {
  preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateMotion();
  preference.addEventListener("change", updateMotion);
  resize = new ResizeObserver(measureGraph);
  if (graph.value) resize.observe(graph.value);
  measureGraph();
});
watch(index, measureGraph);
watch(() => props.kind, () => { index.value = 0; measureGraph(); });
watch(isDark, measureGraph);
onBeforeUnmount(() => {
  preference?.removeEventListener("change", updateMotion);
  resize?.disconnect();
});
</script>

<template>
  <section
    class="ui-walkthrough"
    :aria-label="ru ? 'Пошаговое объяснение' : 'Step-by-step explanation'"
  >
    <div class="walk-controls">
      <button type="button" :disabled="index === 0" @click="index--">
        {{ ru ? "Назад" : "Back" }}
      </button>
      <span>{{ ru ? "Шаг" : "Step" }} {{ index + 1 }} / {{ steps.length }}</span>
      <button type="button" :disabled="index === steps.length - 1" @click="index++">
        {{ ru ? "Далее" : "Next" }}
      </button>
    </div>
    <div class="walk-code">
      <ShikiMagicMovePrecompiled
        :key="`${kind}:${isDark}`"
        :steps="compiled"
        :step="index"
        :animate="!reducedMotion"
        :options="{ duration: reducedMotion ? 0 : 500, stagger: 0.3 }"
      />
    </div>
    <p class="walk-explanation" aria-live="polite">{{ ru ? current.ru : current.en }}</p>
    <div
      ref="graph"
      class="walk-graph"
      role="img"
      :aria-label="current.edges.map(([a, b]) => `${current.nodes.find(node => node.id === a)?.label} → ${current.nodes.find(node => node.id === b)?.label}`).join('; ')"
    >
      <svg class="graph-edges" aria-hidden="true">
        <defs>
          <marker
            :id="`walk-arrow-${kind}`"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6" fill="currentColor" />
          </marker>
        </defs>
        <path
          v-for="(route, edge) in routes"
          :key="edge"
          :d="route"
          fill="none"
          stroke="currentColor"
          :marker-end="`url(#walk-arrow-${kind})`"
        />
      </svg>
      <div class="graph-node" v-for="node in current.nodes" :key="node.id" :data-node="node.id">
        <code>{{ node.label }}</code
        ><small>{{ ru ? node.detailRu : node.detail }}</small>
      </div>
      <div class="graph-connections">
        <span v-for="([from, to], edge) in current.edges" :key="edge">
          {{ current.nodes.find((node) => node.id === from)?.label }}
          <b aria-hidden="true">→</b>
          {{ current.nodes.find((node) => node.id === to)?.label }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-walkthrough {
  margin: 24px 0 32px;
}
.walk-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.walk-controls button {
  min-height: 44px;
  padding: 8px 15px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font: inherit;
}
.walk-controls button:hover:not(:disabled) {
  background: var(--vp-c-bg-soft);
}
.walk-controls button:disabled {
  opacity: 0.55;
  cursor: default;
}
.walk-controls span {
  color: var(--vp-c-text-2);
  font-size: 15px;
}
.walk-code {
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-code-block-bg);
  border-radius: 8px;
  overflow-x: auto;
}
.walk-code :deep(.shiki-magic-move-container) {
  background: transparent !important;
  font-family: var(--vp-font-family-mono);
  font-size: 15px;
  line-height: 1.7;
}
.walk-explanation {
  min-height: 3em;
}
.walk-graph {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px 24px;
}
.graph-edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--vp-c-text-3);
  stroke-width: 1.5px;
  pointer-events: none;
  overflow: visible;
}
.graph-node {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 3px solid var(--vp-c-brand-1);
  padding: 4px 10px;
  background: var(--vp-c-bg);
}
.graph-node code {
  overflow-wrap: anywhere;
}
.graph-node small {
  color: var(--vp-c-text-2);
  font-size: 14px;
}
.graph-connections {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
}
.graph-connections span {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.graph-connections b {
  color: var(--vp-c-brand-1);
  font-weight: 400;
}
@media (max-width: 480px) {
  .walk-code {
    padding: 18px;
  }
  .walk-code :deep(.shiki-magic-move-container) {
    font-size: 14px;
  }
  .walk-graph {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
