<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import DocHeader from "./components/DocHeader.vue";
import { computed, nextTick } from "vue";
import { inBrowser, onContentUpdated, useData } from "vitepress";
import HomeNav from "./components/HomeNav.vue";
import LocaleMemory from "./components/LocaleMemory.vue";
import SectionNav from "./components/SectionNav.vue";

const DefaultLayout = DefaultTheme.Layout;
const { frontmatter } = useData();
const isLanding = computed(() => frontmatter.value.pageClass === "virentia-landing");

onContentUpdated(async () => {
  if (!inBrowser || isLanding.value) return;
  await nextTick();
  const sidebar = document.querySelector<HTMLElement>(".virentia-docs .VPSidebar");
  const active = sidebar?.querySelector<HTMLElement>(".VPSidebarItem.is-active > .item");
  if (!sidebar || !active) return;
  const bounds = sidebar.getBoundingClientRect();
  const item = active.getBoundingClientRect();
  const header = document.querySelector(".VPNavBar")?.getBoundingClientRect().bottom ?? 0;
  const top = window.matchMedia("(min-width: 960px)").matches ? header + 24 : bounds.top + 24;
  if (item.top < top || item.bottom > bounds.bottom - 32) {
    sidebar.scrollTop += item.top - top - 80;
  }
});
</script>

<template>
  <DefaultLayout :class="{ 'virentia-docs': !isLanding }">
    <template #layout-top>
      <LocaleMemory />
    </template>
    <template #doc-before>
      <DocHeader />
    </template>
    <template #nav-bar-content-before>
      <HomeNav v-if="isLanding" />
      <SectionNav v-else mode="bar" />
    </template>
    <template #nav-screen-content-before>
      <HomeNav v-if="isLanding" screen />
      <SectionNav v-else mode="screen" />
    </template>
  </DefaultLayout>
</template>
