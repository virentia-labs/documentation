<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { inBrowser, useData, useRoute, withBase } from "vitepress";

const storageKey = "virentia:docs-locale";
const knownLocales = new Set(["en", "ru"]);
const route = useRoute();
const { site } = useData();

const currentPath = computed(() => stripBase(route.path, site.value.base));

onMounted(() => {
  if (!inBrowser) {
    return;
  }

  const saved = localStorage.getItem(storageKey);

  if (saved && !knownLocales.has(saved)) {
    localStorage.removeItem(storageKey);
  }

  if (saved === "ru" && isRootPath(currentPath.value)) {
    window.location.replace(withBase("/ru/"));
    return;
  }

  document.addEventListener("click", rememberLocaleChoice);
});

onUnmounted(() => {
  if (inBrowser) {
    document.removeEventListener("click", rememberLocaleChoice);
  }
});

function rememberLocaleChoice(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const link = target.closest<HTMLAnchorElement>(
    ".VPNavBarTranslations a[href], .VPNavScreenTranslations a[href], .VPNavBarExtra .translations a[href]",
  );

  if (!link) {
    return;
  }

  const locale = localeFromHref(link.href);

  if (locale) {
    localStorage.setItem(storageKey, locale);
  }
}

function stripBase(path: string, base: string): string {
  if (base !== "/" && path.startsWith(base)) {
    return path.slice(base.length - 1) || "/";
  }

  return path;
}

function localeFromHref(href: string): "en" | "ru" | null {
  const url = new URL(href, window.location.href);
  const path = stripBase(url.pathname, site.value.base);

  if (path === "/ru" || path.startsWith("/ru/")) {
    return "ru";
  }

  return "en";
}

function isRootPath(path: string): boolean {
  return path === "/" || path === "/index" || path === "/index.html";
}
</script>

<template></template>
