<script setup lang="ts">
import Row from './Row.vue';
defineProps<{ ids: number[] }>();
</script>
<template><table><tbody><Row v-for="id in ids" :key="id" :id="id" /></tbody></table></template>
