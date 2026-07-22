<script setup lang="ts">
import { ThunderboltFilled, ThunderboltOutlined } from '@ant-design/icons-vue'
import type { RuleHitStatus } from '~/shared/rule'
import { formatHitTime } from '~/logic/rule-hit'

defineProps<{
  status?: RuleHitStatus
  /** 已启用但从未命中时显示淡提示；停用且未命中则不显示 */
  enabled?: boolean
}>()
</script>

<template>
  <a-tooltip v-if="status" placement="top">
    <template #title>
      <div>
        <div class="hit-tip__row">
          已拦截 <strong>{{ status.hitCount }}</strong> 次
        </div>
        <div class="hit-tip__row flex items-center">
          触发时间
          <span class="hit-tip__time">({{ formatHitTime(status.lastHitAt) }})</span>
        </div>
        <div v-if="status.lastHitUrl" class="hit-tip__url">
          {{ status.lastHitUrl }}
        </div>
      </div>
    </template>
    <button type="button" class="hit-badge" aria-label="查看拦截记录">
      <ThunderboltFilled class="hit-badge__icon" />
      <span class="hit-badge__count">{{ status.hitCount }}</span>
    </button>
  </a-tooltip>

  <a-tooltip v-else-if="enabled" title="已启用，但尚未拦截到匹配请求" placement="top">
    <button type="button" class="hit-badge hit-badge--idle" aria-label="尚未拦截">
      <ThunderboltOutlined class="hit-badge__icon" />
    </button>
  </a-tooltip>
</template>

<style scoped>
.hit-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 20px;
  padding: 0 6px;
  border: none;
  border-radius: 999px;
  background: #f6ffed;
  color: #389e0d;
  font-size: 12px;
  line-height: 1;
  cursor: help;
  flex-shrink: 0;
}

.hit-badge:hover {
  background: #d9f7be;
}

.hit-badge--idle {
  background: #f5f5f5;
  color: #bfbfbf;
}

.hit-badge--idle:hover {
  background: #f0f0f0;
  color: #8c8c8c;
}

.hit-badge__icon {
  font-size: 10px;
}

.hit-badge__count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.hit-tip__row {
  line-height: 1.5;
}

.hit-tip__time {
  margin-left: 4px;
  opacity: 0.75;
}

.hit-tip__url {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgb(255 255 255 / 20%);
  word-break: break-all;
  opacity: 0.9;
  font-size: 12px;
  line-height: 1.4;
}
</style>
