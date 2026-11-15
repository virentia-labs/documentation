<script setup vapor lang="ts">
import { shallowRef } from 'vue';
import { register } from './registry';
const props = defineProps<{ id: number }>();
const value = shallowRef(0);
register(props.id, value);
</script>
<template><tr :data-row="id"><td>{{ String(id) }}</td><td>{{ value }}</td></tr></template>
