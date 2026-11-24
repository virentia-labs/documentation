<script setup lang="ts">
import { computed } from "vue";
import { useData, useRoute, withBase } from "vitepress";
import { docsSections, type LocaleKey, type SectionNavItem } from "../../navigation";

const route = useRoute();
const { lang, site } = useData();
const locale = computed<LocaleKey>(() => lang.value.startsWith("ru") ? "ru" : "en");
const prefix = computed(() => locale.value === "ru" ? "/ru" : "");
const path = computed(() => route.path.startsWith(site.value.base)
  ? `/${route.path.slice(site.value.base.length)}` : route.path);
const area = computed(() => {
  if (path.value === `${prefix.value}/performance`) return {
    text: locale.value === "ru" ? "Производительность" : "Performance", link: `${prefix.value}/performance`,
  };
  const flatten = (items: SectionNavItem[]) => items.flatMap(item => "link" in item ? [item] : item.items);
  const section = docsSections.find(item => item.match[locale.value].some(match => path.value.startsWith(match) && match !== "/" && match !== "/ru/"));
  if (!section) return undefined;
  if (section.id !== "virentia") return { text: section.label[locale.value], link: section.link[locale.value] };
  return flatten(section.nav[locale.value]).filter(item => {
    const currentFamily = path.value.replace(/^\/ru(?=\/)/, "").split("/")[1];
    const targetFamily = item.link.replace(/^\/ru(?=\/)/, "").split("/")[1];
    return currentFamily === targetFamily;
  }).sort((a, b) => b.link.length - a.link.length)[0];
});
</script>

<template>
  <nav class="vd-breadcrumb" :aria-label="locale === 'ru' ? 'Путь к странице' : 'Breadcrumbs'">
    <a :href="withBase(`${prefix}/guide/getting-started`)">{{ locale === "ru" ? "Документация" : "Documentation" }}</a>
    <template v-if="area">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg>
      <a :href="withBase(area.link)">{{ area.text }}</a>
    </template>
  </nav>
</template>
