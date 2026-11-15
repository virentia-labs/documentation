<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import type { BlackHoleRenderer } from "../black-hole-renderer";

const scene = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const reducedMotion = ref(true);
const running = ref(false);
let renderer: BlackHoleRenderer | null = null;
let observer: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let preference: MediaQueryList | undefined;
let visible = false;
let mounted = false;
let failed = false;
let loading = false;
let animationFrame = 0;
let elapsed = 0;
let lastFrame = 0;
let lastDraw = 0;
const frameDuration = 1000 / 24;

function shouldPlay() {
  return mounted && visible && !reducedMotion.value && !failed
    && document.visibilityState === "visible";
}

function frame(now: number) {
  if (!running.value) return;
  animationFrame = requestAnimationFrame(frame);
  if (now - lastFrame < frameDuration) return;
  elapsed += Math.min(now - lastDraw, 100) / 1000;
  lastDraw = now;
  lastFrame = now - ((now - lastFrame) % frameDuration);
  renderer?.draw(elapsed);
}

function stop() {
  running.value = false;
  cancelAnimationFrame(animationFrame);
}

function resize() {
  if (!renderer || !scene.value) return;
  renderer.resize(scene.value.getBoundingClientRect().width);
  renderer.draw(elapsed);
}

async function syncPlayback() {
  if (!shouldPlay()) {
    stop();
    return;
  }
  if (!renderer && !loading && image.value?.complete && image.value.naturalWidth) {
    loading = true;
    try {
      const { createBlackHoleRenderer } = await import("../black-hole-renderer");
      if (!mounted || !shouldPlay() || !canvas.value || !image.value) return;
      renderer = createBlackHoleRenderer(canvas.value, image.value);
      if (!renderer) {
        failed = true;
        return;
      }
      resize();
      ready.value = true;
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  }
  if (renderer && !running.value && shouldPlay()) {
    lastFrame = performance.now();
    lastDraw = lastFrame;
    running.value = true;
    animationFrame = requestAnimationFrame(frame);
  }
}

function syncPreference() {
  reducedMotion.value = preference?.matches ?? true;
  if (reducedMotion.value) {
    stop();
    renderer?.dispose();
    renderer = null;
    ready.value = false;
  }
  void syncPlayback();
}

function contextLost(event: Event) {
  event.preventDefault();
  stop();
  renderer?.dispose();
  renderer = null;
  ready.value = false;
}

function contextRestored() {
  failed = false;
  void syncPlayback();
}

onMounted(() => {
  mounted = true;
  preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", syncPreference);
  document.addEventListener("visibilitychange", syncPlayback);
  canvas.value?.addEventListener("webglcontextlost", contextLost);
  canvas.value?.addEventListener("webglcontextrestored", contextRestored);
  syncPreference();
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    void syncPlayback();
  }, { threshold: 0 });
  if (scene.value) observer.observe(scene.value);
  resizeObserver = new ResizeObserver(resize);
  if (scene.value) resizeObserver.observe(scene.value);
});

onBeforeUnmount(() => {
  mounted = false;
  stop();
  observer?.disconnect();
  resizeObserver?.disconnect();
  preference?.removeEventListener("change", syncPreference);
  document.removeEventListener("visibilitychange", syncPlayback);
  canvas.value?.removeEventListener("webglcontextlost", contextLost);
  canvas.value?.removeEventListener("webglcontextrestored", contextRestored);
  renderer?.dispose();
});
</script>

<template>
  <div ref="scene" class="vh-cosmos" :data-motion="running ? 'playing' : 'paused'" :data-renderer="ready ? 'webgl' : 'image'">
    <div class="vh-cosmos__art" aria-hidden="true">
      <img ref="image" class="vh-cosmos__image" :src="withBase('/black-hole-hero.webp')"
        width="1254" height="1254" alt="" fetchpriority="high" decoding="async" @load="syncPlayback" />
      <canvas ref="canvas" class="vh-cosmos__canvas" :class="{ 'is-ready': ready }" />
    </div>
  </div>
</template>
