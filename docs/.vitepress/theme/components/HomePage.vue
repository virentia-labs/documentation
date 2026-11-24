<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useData, withBase } from "vitepress";
import BlackHoleScene from "./BlackHoleScene.vue";
import HomePerformance from "./HomePerformance.vue";
import "../home.css";

const { lang } = useData();
const russian = computed(() => lang.value.startsWith("ru"));
const prefix = computed(() => (russian.value ? "/ru" : ""));
const doc = (path: string) => withBase(`${prefix.value}${path}`);
const activeExample = ref<"model" | "view">("model");
const copyState = ref<"idle" | "copied" | "failed">("idle");
let copyTimer: ReturnType<typeof setTimeout> | undefined;

async function selectExample(example: "model" | "view") {
  activeExample.value = example;
  await nextTick();
  document.getElementById(`vh-tab-${example}`)?.focus();
}

onBeforeUnmount(() => {
  clearTimeout(copyTimer);
});

async function copyInstall() {
  try {
    await navigator.clipboard.writeText("pnpm add @virentia/core");
    copyState.value = "copied";
  } catch {
    copyState.value = "failed";
  }
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyState.value = "idle"; }, 2200);
}

const copy = computed(() => russian.value ? {
  headline: ["Твой следующий", "фреймворк для", "веб-приложений"],
  description: "Создавай реактивные модели, которые объединяют состояние и поведение приложения, а затем подключай их к своему интерфейсу.",
  start: "Начать создавать", github: "GitHub", install: "Установить Virentia",
  copy: "Копировать команду", copied: "Скопировано", failed: "Выдели и скопируй команду",
  foundations: "Модель становится основой твоего приложения.",
  foundationsNote: "Virentia связывает состояние, события и эффекты, чтобы логика оставалась понятной по мере роста приложения.",
  features: [
    { number: "01", title: "Логика живёт в модели", description: "Состояние, события и правила не зависят от компонентов, поэтому одну модель можно подключить к разным интерфейсам.", link: "/guide/ideology", label: "Устройство Virentia", icon: "model" },
    { number: "02", title: "Скоупы изолируют состояние", description: "Каждый экземпляр модели получает независимое состояние для приложения, отдельного теста или SSR-запроса.", link: "/core/scopes", label: "Подробнее о скоупах", icon: "scopes" },
    { number: "03", title: "Эффекты управляют асинхронностью", description: "Описывай загрузку, обработку ошибок и отмену рядом с остальной логикой приложения.", link: "/core/effects", label: "Подробнее об эффектах", icon: "async" },
  ],
  exampleLabel: "Как это работает",
  exampleTitle: "Начни с модели и подключи свой интерфейс.",
  exampleDescription: "В этом счётчике событие запускает реакцию, которая обновляет стор. Компонент React использует готовую модель, а поведение счётчика остаётся внутри неё.",
  explore: "Изучить ядро", modelTab: "Модель", viewTab: "React", exampleAria: "Примеры кода",
  ecosystemLabel: "Экосистема", ecosystemTitle: "Выбирай инструменты под своё приложение.",
  ecosystemDescription: "Используй реактивное ядро самостоятельно или подключай пакеты для работы с интерфейсом и существующими моделями.",
  packages: [
    { name: "Core", package: "@virentia/core", text: "Описывай логику приложения с помощью состояния, событий, эффектов и правил.", link: "/core/", mark: "◎" },
    { name: "React", package: "@virentia/react", text: "Подключай модели к компонентам через хуки и скоупы.", link: "/react/", mark: "⌘" },
    { name: "UI", package: "@virentia/ui", text: "Создавай интерфейсы на JSX с компиляцией и точечными обновлениями DOM.", link: "/ui/", mark: "◇" },
    { name: "Effector", package: "@virentia/effector", text: "Используй существующие модели Effector вместе с Virentia.", link: "/effector/", mark: "↔" },
  ],
  endTitle: "Создай следующее приложение с Virentia.", endNote: "Начни с руководства и собери свою первую модель на TypeScript.",
  license: "Virentia распространяется с открытым кодом по лицензии MIT.",
} : {
  headline: ["Your next", "framework to create", "web applications"],
  description: "Build reactive models that bring your application’s state and behavior together, then connect them to your interface.",
  start: "Get started", github: "GitHub", install: "Install Virentia",
  copy: "Copy install command", copied: "Copied", failed: "Select and copy the command",
  foundations: "Let your model hold the application together.",
  foundationsNote: "Virentia connects state, events, and effects so your logic stays clear as your application grows.",
  features: [
    { number: "01", title: "Your logic lives in the model.", description: "State, events, and rules work independently of components, so you can connect the same model to different interfaces.", link: "/guide/ideology", label: "The Virentia philosophy", icon: "model" },
    { number: "02", title: "Scopes keep state independent.", description: "Each model instance has its own state for your application, an isolated test, or an individual server request.", link: "/core/scopes", label: "Explore scopes", icon: "scopes" },
    { number: "03", title: "Effects handle asynchronous work.", description: "Describe loading, error handling, and cancellation alongside the rest of your application’s behavior.", link: "/core/effects", label: "Explore effects", icon: "async" },
  ],
  exampleLabel: "How it works",
  exampleTitle: "Start with a model and connect your interface.",
  exampleDescription: "In this counter, an event triggers a reaction that updates the store. The React component uses the model while the counter’s behavior stays inside it.",
  explore: "Explore the core", modelTab: "The model", viewTab: "React", exampleAria: "Code examples",
  ecosystemLabel: "The ecosystem", ecosystemTitle: "Choose the tools your application needs.",
  ecosystemDescription: "Use the reactive core on its own or add packages that connect it to your interface and existing models.",
  packages: [
    { name: "Core", package: "@virentia/core", text: "Define your application’s logic with state, events, effects, and rules.", link: "/core/", mark: "◎" },
    { name: "React", package: "@virentia/react", text: "Bring your models into components with hooks and scoped bindings.", link: "/react/", mark: "⌘" },
    { name: "UI", package: "@virentia/ui", text: "Build interfaces with compiled JSX and fine-grained DOM updates.", link: "/ui/", mark: "◇" },
    { name: "Effector", package: "@virentia/effector", text: "Bring existing Effector models along and connect them to Virentia.", link: "/effector/", mark: "↔" },
  ],
  endTitle: "Build your next application with Virentia.", endNote: "Follow the guide to create your first model in TypeScript.",
  license: "Virentia is open source and available under the MIT license.",
});
</script>

<template>
  <div class="vh-page">
    <section class="vh-hero" aria-labelledby="vh-title">
      <div class="vh-hero__copy">
        <div class="vh-brand">
          <img :src="withBase('/logo.svg')" width="60" height="60" alt="" />
          <span>virentia</span>
        </div>
        <h1 id="vh-title" class="vh-title">
          <span v-for="(line, index) in copy.headline" :key="line" :class="{ 'vh-title__accent': index === 2 }">{{ line + (index < 2 ? ' ' : '') }}</span>
        </h1>
        <p class="vh-hero__description">{{ copy.description }}</p>
        <div class="vh-actions">
          <a class="vh-button vh-button--primary" :href="doc('/guide/getting-started')">
            {{ copy.start }}<span aria-hidden="true">↗</span>
          </a>
          <a class="vh-button vh-button--secondary" href="https://github.com/virentia-labs/virentia" target="_blank" rel="noopener noreferrer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8a11.4 11.4 0 0 0-3.6 22.2c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.5-4.1-1.5-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.4-5.5-6A4.7 4.7 0 0 1 5.5 7.4c-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.3a11.9 11.9 0 0 1 6 0c2.4-1.6 3.4-1.3 3.4-1.3.6 1.7.2 3 .1 3.3a4.7 4.7 0 0 1 1.3 3.3c0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.2v3.6c0 .3.2.7.8.6A11.4 11.4 0 0 0 12 .8Z"/></svg>
            {{ copy.github }}<span class="vh-external" aria-hidden="true">↗</span>
          </a>
        </div>
        <div class="vh-install" :aria-label="copy.install">
          <span class="vh-install__prompt" aria-hidden="true">$</span>
          <code>pnpm add <span>@virentia/core</span></code>
          <button type="button" @click="copyInstall" :aria-label="copyState === 'copied' ? copy.copied : copy.copy" :title="copyState === 'copied' ? copy.copied : copy.copy">
            <svg v-if="copyState !== 'copied'" width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="6" y="6" width="10" height="11" rx="2"/><path d="M12 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"/></svg>
            <svg v-else width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>
          </button>
          <span class="vh-copy-status" role="status">{{ copyState === 'copied' ? copy.copied : copyState === 'failed' ? copy.failed : '' }}</span>
        </div>
        <p class="vh-hero__notes">{{ copy.license }}</p>
      </div>

      <BlackHoleScene />
    </section>

    <section class="vh-foundations" aria-labelledby="vh-foundations-title">
      <div class="vh-section-heading vh-section-heading--compact">
        <h2 id="vh-foundations-title">{{ copy.foundations }}</h2><p>{{ copy.foundationsNote }}</p>
      </div>
      <div class="vh-features">
        <a v-for="feature in copy.features" :key="feature.number" class="vh-feature" :href="doc(feature.link)">
          <div class="vh-feature__top"><span>{{ feature.number }}</span>
            <svg v-if="feature.icon === 'model'" width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="m17 3 13 7-13 7L4 10zM4 17l13 7 13-7M4 24l13 7 13-7"/></svg>
            <svg v-else-if="feature.icon === 'scopes'" width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="3" y="3" width="12" height="12" rx="3"/><rect x="19" y="19" width="12" height="12" rx="3"/><path d="M21 5h8v8M5 21v8h8"/></svg>
            <svg v-else width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M27 11A12 12 0 0 0 6 10M7 23a12 12 0 0 0 21 1M27 4v8h-8M7 30v-8h8"/><path d="m17 12-3 6h6l-3 5"/></svg>
          </div>
          <h3>{{ feature.title }}</h3><p>{{ feature.description }}</p>
          <span class="vh-text-link">{{ feature.label }}<span aria-hidden="true">↗</span></span>
        </a>
      </div>
    </section>

    <section class="vh-example" aria-labelledby="vh-example-title">
      <div class="vh-example__copy">
        <p class="vh-eyebrow">{{ copy.exampleLabel }}</p>
        <h2 id="vh-example-title">{{ copy.exampleTitle }}</h2>
        <p class="vh-section-description">{{ copy.exampleDescription }}</p>
        <a class="vh-text-link" :href="doc('/core/')">{{ copy.explore }}<span aria-hidden="true">↗</span></a>
        <div class="vh-model-flow" aria-hidden="true"><span>event</span><i></i><span>reaction</span><i></i><span>store</span></div>
      </div>
      <div class="vh-code-panel">
        <div class="vh-code-panel__bar">
          <div class="vh-code-tabs" role="tablist" :aria-label="copy.exampleAria">
            <button id="vh-tab-model" role="tab" type="button" :aria-selected="activeExample === 'model'" :tabindex="activeExample === 'model' ? 0 : -1" aria-controls="vh-panel-model" @click="activeExample = 'model'" @keydown.right.prevent="selectExample('view')">{{ copy.modelTab }}</button>
            <button id="vh-tab-view" role="tab" type="button" :aria-selected="activeExample === 'view'" :tabindex="activeExample === 'view' ? 0 : -1" aria-controls="vh-panel-view" @click="activeExample = 'view'" @keydown.left.prevent="selectExample('model')">{{ copy.viewTab }}</button>
          </div>
          <span class="vh-code-filename">{{ activeExample === 'model' ? 'model.ts' : 'counter.tsx' }}</span>
        </div>
        <div v-show="activeExample === 'model'" id="vh-panel-model" class="vp-doc vh-code-content" role="tabpanel" aria-labelledby="vh-tab-model" tabindex="0"><slot name="model" /></div>
        <div v-show="activeExample === 'view'" id="vh-panel-view" class="vp-doc vh-code-content" role="tabpanel" aria-labelledby="vh-tab-view" tabindex="0"><slot name="view" /></div>
      </div>
    </section>

    <HomePerformance />

    <section id="ecosystem" class="vh-ecosystem" aria-labelledby="vh-ecosystem-title">
      <div class="vh-section-heading">
        <div><p class="vh-eyebrow">{{ copy.ecosystemLabel }}</p><h2 id="vh-ecosystem-title">{{ copy.ecosystemTitle }}</h2></div>
        <p>{{ copy.ecosystemDescription }}</p>
      </div>
      <div class="vh-packages">
        <a v-for="item in copy.packages" :key="item.name" :href="doc(item.link)" class="vh-package">
          <div class="vh-package__heading"><span class="vh-package__mark" aria-hidden="true">{{ item.mark }}</span><h3>{{ item.name }}</h3><span class="vh-package__arrow" aria-hidden="true">↗</span></div>
          <p>{{ item.text }}</p><code>{{ item.package }}</code>
        </a>
      </div>
    </section>

    <section class="vh-outro" aria-labelledby="vh-outro-title">
      <img :src="withBase('/logo.svg')" width="64" height="64" alt="" loading="lazy" />
      <h2 id="vh-outro-title">{{ copy.endTitle }}</h2>
      <p>{{ copy.endNote }}</p>
      <a class="vh-button vh-button--primary" :href="doc('/guide/getting-started')">{{ copy.start }}<span aria-hidden="true">↗</span></a>
    </section>
  </div>
</template>
