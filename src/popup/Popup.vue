<script setup lang="ts">
import { h } from 'vue'
import { SettingFilled } from '@ant-design/icons-vue'
import type { TableProps } from 'ant-design-vue'
import { Empty } from 'ant-design-vue'
import { globalConfig, rules, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { getActionLabel } from '~/logic'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

// 启用规则数量
const enabledCount = computed(() => {
  return rules.value.filter(r => r.enabled).length
})

// 表格列定义
const columns: TableProps['columns'] = [
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 70,
  },
  {
    title: '规则名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    width: 160,
  },
  {
    title: 'URL 模式',
    key: 'pattern',
    ellipsis: true,
  },
  {
    title: '动作',
    key: 'action',
    width: 120,
  },
]
</script>

<template>
  <a-config-provider :theme="{ token: { colorPrimary: '#9254de' } }">
    <div class="w-[720px]">
      <!-- 头部 -->
      <a-layout-header class="h-[56px] header px-16 justify-between  flex items-center">
        <div class="text-white text-[16px] font-600 flex items-center gap-8">
          <Logo :size="24" />
          <span>Request Interceptor</span>
        </div>
        <!-- 全局开关 -->
        <div class="flex items-center gap-8 px-12 py-4 rounded-6 bg-white/10">
          <div class="flex items-center gap-[8px]">
            <div
              class="w-[16px] h-[16px] rounded-full transition-colors"
              :class="globalConfig.extensionEnabled ? 'bg-[#52c41a]' : 'bg-[#f5222d]'"
            />
            <div class="text-white text-[14px] font-500">
              {{ globalConfig.extensionEnabled ? '运行中' : '已停止' }}
            </div>
          </div>
          <a-switch
            v-model:checked="globalConfig.extensionEnabled"
          />
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <div class="p-16">
        <a-empty
          v-if=" rules.length === 0"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
          description="暂无规则"
        >
          <a-button type="primary" size="small" @click="openOptionsPage">
            立即添加
          </a-button>
        </a-empty>

        <div v-else>
          <!-- 统计信息 -->
          <a-alert
            :message="`共 ${rules.length} 条规则，${enabledCount} 条已启用`"
            type="info"
            show-icon
            class="mb-12"
          >
            <template #action>
              <a-button class="flex items-center" type="primary" :icon="h(SettingFilled)" @click="openOptionsPage">
                管理
              </a-button>
            </template>
          </a-alert>

          <!-- 规则列表 -->
          <a-table
            :columns="columns"
            :data-source="sortedRules"
            :pagination="false"
            size="small"
            :row-key="(record: Rule) => record.id"
            :scroll="{ y: 200 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'enabled'">
                <div class="flex items-center">
                  <a-switch
                    v-model:checked="record.enabled"
                    size="small"
                  />
                </div>
              </template>
              <template v-else-if="column.key === 'name'">
                <div class="flex items-center">
                  <a-tag class="truncate max-w-[140px]" :color="record.enabled ? 'success' : 'default'">
                    {{ record.name }}
                  </a-tag>
                </div>
              </template>
              <template v-else-if="column.key === 'pattern'">
                <a-tooltip :title="(record.condition.isRegex ? '正则模式: ' : '通配模式: ') + record.condition.urlPattern">
                  {{ record.condition.urlPattern }}
                </a-tooltip>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-tag :color=" record.enabled ? 'blue' : 'default'">
                  {{ getActionLabel(record.action) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </div>
  </a-config-provider>
</template>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
