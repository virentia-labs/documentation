<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import LocaleMemory from "./components/LocaleMemory.vue";
import SectionNav from "./components/SectionNav.vue";

const DefaultLayout = DefaultTheme.Layout;
</script>

<template>
  <DefaultLayout>
    <template #layout-top>
      <LocaleMemory />
    </template>
    <template #nav-bar-content-before>
      <SectionNav mode="bar" />
    </template>
    <template #nav-screen-content-before>
      <SectionNav mode="screen" />
    </template>
  </DefaultLayout>
</template>
