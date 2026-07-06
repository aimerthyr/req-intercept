<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  svg: string
  size?: number
  color?: string
}>()

const wrapperStyle = computed(() => ({
  display: 'inline-flex',
  width: `${props.size || 16}px`,
  height: `${props.size || 16}px`,
  color: props.color,
}))

// 👇关键：强制修复 SVG 属性
const innerSvg = computed(() => {
  return props.svg
    .replace(/width="[^"]*"/g, '')
    .replace(/height="[^"]*"/g, '')
    .replace(/fill="[^"]*"/g, 'fill=\'currentColor\'')
})
</script>

<template>
  <span class="icon" :style="wrapperStyle" v-html="innerSvg" />
</template>

<style scoped>
.icon {
  line-height: 0;
}

/* 🔥核心：强制 svg 100% 填充容器 */
.icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
