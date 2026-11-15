<script setup lang="ts">
import { computed, inject } from "vue";
import { useData, withBase } from "vitepress";

defineProps<{ screen?: boolean }>();
const closeScreen = inject<() => void>("close-screen", () => {});
const { lang } = useData();
const isRussian = computed(() => lang.value.startsWith("ru"));
const links = computed(() => {
  const prefix = isRussian.value ? "/ru" : "";
  return [
    { text: isRussian.value ? "Руководство" : "Guide", href: `${prefix}/guide/getting-started` },
    { text: isRussian.value ? "Концепции" : "Concepts", href: `${prefix}/guide/ideology` },
    { text: isRussian.value ? "Производительность" : "Performance", href: `${prefix}/#performance` },
    { text: isRussian.value ? "Экосистема" : "Ecosystem", href: `${prefix}/#ecosystem` },
  ];
});
</script>

<template>
  <nav
    class="vh-nav"
    :class="{ 'vh-nav--screen': screen }"
    :aria-label="isRussian ? 'Главная навигация' : 'Main navigation'"
  >
    <a v-for="link in links" :key="link.href" :href="withBase(link.href)" @click="closeScreen">{{ link.text }}</a>
  </nav>
</template>
