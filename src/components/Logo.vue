<script setup lang="ts">
import pureLogo from '~/assets/pure-logo.svg?raw'

withDefaults(defineProps<{
  size?: number
}>(), {
  size: 24,
})
</script>

<template>
  <span class="logo-icon" :style="{ width: `${size}px`, height: `${size}px` }" v-html="pureLogo" />
</template>

<style scoped>
.logo-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
