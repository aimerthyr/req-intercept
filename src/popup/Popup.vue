<script setup lang="ts">
import { h } from 'vue'
import { EditFilled, SettingFilled } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import type { VTableColumn } from '@aimerthyr/virtual-table'
import { VTable } from '@aimerthyr/virtual-table'
import { globalConfig, rules, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { getActionLabel, openOptionsPage } from '~/logic'

function editRule(rule: Rule) {
  openOptionsPage(rule.id)
}

// 启用规则数量
const enabledCount = computed(() => {
  return rules.value.filter(r => r.enabled).length
})

// 表格列定义
const columns: VTableColumn[] = [
  {
    columnHeader: '状态',
    columnKey: 'enabled',
    columnWidth: 60,
  },
  {
    columnHeader: '规则名称',
    columnKey: 'name',
    columnWidth: 160,
  },
  {
    columnHeader: 'URL 模式',
    columnKey: 'pattern',
  },
  {
    columnHeader: '动作',
    columnKey: 'action',
    columnWidth: 120,
  },
  {
    columnHeader: '操作',
    columnKey: 'edit',
    columnWidth: 70,
    columnAlign: 'center',
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
          <a-button type="primary" size="small" @click="() => openOptionsPage()">
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
              <a-button class="flex items-center" type="primary" :icon="h(SettingFilled)" @click="() => openOptionsPage()">
                管理
              </a-button>
            </template>
          </a-alert>

          <!-- 规则列表 -->
          <VTable
            :columns="columns"
            :data="sortedRules"
            class="max-h-[280px]"
            :row-key="(row: Rule) => row.id"
            :theme-config="{
              primaryColor: '#9254de',
              border: {
                borderStyle: 'dashed',
              },
            }"
          >
            <template #bodyCell="{ column, row }">
              <template v-if="column.columnKey === 'enabled'">
                <div class="flex items-center">
                  <a-switch
                    v-model:checked="row.enabled"
                    size="small"
                  />
                </div>
              </template>
              <template v-else-if="column.columnKey === 'name'">
                <div class="flex items-center">
                  <a-tag class="truncate max-w-[140px]" :color="row.enabled ? 'success' : 'default'">
                    {{ row.name }}
                  </a-tag>
                </div>
              </template>
              <template v-else-if="column.columnKey === 'pattern'">
                <a-tooltip :title="(row.condition.isRegex ? '正则模式: ' : '通配模式: ') + row.condition.urlPattern">
                  <div class="truncate">
                    {{ row.condition.urlPattern }}
                  </div>
                </a-tooltip>
              </template>
              <template v-else-if="column.columnKey === 'action'">
                <a-tag :color=" row.enabled ? 'blue' : 'default'">
                  {{ getActionLabel(row.action) }}
                </a-tag>
              </template>
              <template v-else-if="column.columnKey === 'edit'">
                <div class="flex justify-center">
                  <a-button
                    type="text"
                    size="small"
                    class="flex items-center px-0 text-[#9254de] hover:!text-[#9254de]"
                    @click="editRule(row)"
                  >
                    <EditFilled />
                  </a-button>
                </div>
              </template>
            </template>
          </VTable>
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
