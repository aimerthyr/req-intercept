<script setup lang="ts">
import {
  CopyOutlined,
  DeleteFilled,
  DeleteOutlined,
  EditFilled,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { VTableColumn } from '@aimerthyr/virtual-table'
import { VTable } from '@aimerthyr/virtual-table'
import RuleDrawer from './RuleDrawer.vue'
import { generateRuleId, rules, rulesReady, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { clearEditRuleIdFromUrl, getActionLabel, parseEditRuleIdFromUrl } from '~/logic'

const selectedMenu = ref('rules-list')
const drawerOpen = ref(false)
const editingRule = ref<Rule | null>(null)
const searchKeyword = ref('')
const enabledCount = computed(() => rules.value.filter(r => r.enabled).length)
const filteredRules = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword)
    return sortedRules.value
  return sortedRules.value.filter(r =>
    r.name.toLowerCase().includes(keyword)
    || r.condition.urlPattern.toLowerCase().includes(keyword),
  )
})

function openAddDrawer() {
  editingRule.value = null
  drawerOpen.value = true
}

function openEditDrawer(rule: Rule) {
  editingRule.value = rule
  drawerOpen.value = true
}

const columns: VTableColumn[] = [
  { columnHeader: '状态', columnKey: 'enabled', columnWidth: 80, columnAlign: 'center' },
  { columnHeader: '规则名称', columnKey: 'name', columnWidth: 180 },
  { columnHeader: 'URL 匹配模式', columnKey: 'pattern' },
  { columnHeader: '动作', columnKey: 'action', columnWidth: 200 },
  { columnHeader: '操作', columnKey: 'action-btn', columnWidth: 240, columnAlign: 'center' },
]

function toggleRule(event: boolean) {
  message.success(event ? '规则已启用' : '规则已禁用')
}

function deleteRule(record: Rule) {
  rules.value = rules.value.filter(r => r.id !== record.id)
  message.success('规则删除成功')
}

function copyRule(record: Rule) {
  const newRule: Rule = {
    ...record,
    id: generateRuleId(rules.value),
    name: `${record.name} (副本)`,
    enabled: false,
  }
  rules.value.push(newRule)
  message.success('规则复制成功')
}

function deleteAll() {
  rules.value = []
  searchKeyword.value = ''
  message.success('已删除所有规则')
}

onMounted(async () => {
  const editRuleId = parseEditRuleIdFromUrl()
  if (editRuleId == null)
    return

  await rulesReady
  const rule = rules.value.find(r => r.id === editRuleId)
  if (rule)
    openEditDrawer(rule)

  clearEditRuleIdFromUrl()
})
</script>

<template>
  <a-config-provider :theme="{ token: { colorPrimary: '#9254de' } }">
    <a-layout>
      <a-layout-sider
        theme="light"
        :width="200"
        style="box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05); overflow: auto; height: 100vh; position: fixed; left: 0"
      >
        <div class="logo">
          <Logo class="mb-8" />
          <div class="text-[16px] font-600">
            Request Interceptor
          </div>
        </div>
        <a-menu
          :selected-keys="[selectedMenu]"
          mode="inline"
          class="pt-[12px]"
          @select="({ key }: { key: any }) => (selectedMenu = key)"
        >
          <a-menu-item key="rules-list" class="my-0!">
            <UnorderedListOutlined />
            <span>规则列表</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout style="margin-left: 200px">
        <a-layout-content style="min-height: 100vh">
          <div v-if="selectedMenu === 'rules-list'" class="flex flex-col gap-12 h-full pb-12">
            <a-page-header
              title="规则列表"
              sub-title="管理所有请求拦截规则"
              class="border-b border-gray-200 pb-16 px-24"
            >
              <template #extra>
                <a-button class="flex items-center" type="primary" @click="openAddDrawer">
                  <PlusOutlined />
                  新增规则
                </a-button>
              </template>
            </a-page-header>

            <a-card class="mx-24" :body-style="{ padding: '16px 24px' }">
              <div class="flex flex-wrap items-center gap-16">
                <div class="flex items-center gap-12 shrink-0">
                  <a-statistic title="规则总数" :value="rules.length" />
                  <a-divider type="vertical" class="h-[40px]" />
                  <a-statistic title="已启用" :value="enabledCount" :value-style="{ color: '#52c41a' }" />
                </div>

                <a-input-search
                  v-model:value="searchKeyword"
                  allow-clear
                  placeholder="搜索规则名称或 URL 模式"
                  class="max-w-[400px]"
                />

                <div class="flex flex-wrap items-center gap-8 shrink-0 ml-auto">
                  <a-popconfirm
                    title="确定删除所有规则吗？此操作不可恢复"
                    ok-text="确定"
                    cancel-text="取消"
                    :disabled="!rules.length"
                    placement="topRight"
                    @confirm="deleteAll"
                  >
                    <a-button class="flex items-center" danger :disabled="!rules.length">
                      <DeleteOutlined />
                      清空
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>
            </a-card>

            <a-card class="mx-24 flex-1 min-h-0 px-24 pt-16" :body-style="{ padding: '0' }">
              <VTable
                :default-pagination="{ pageSize: 10, pageIndex: 1 }"
                :columns="columns"
                :data="filteredRules"
                :row-key="(record: Rule) => record.id"
                :row-height="40"
                class="h-full"
                :theme-config="{
                  primaryColor: '#9254de',
                  border: {
                    borderStyle: 'dashed',
                  },
                }"
                :pagination-config="{
                  mode: 'client',
                  enabled: filteredRules.length > 10,
                  total: filteredRules.length,
                }"
              >
                <template #bodyCell="{ column, row }">
                  <template v-if="column.columnKey === 'enabled'">
                    <a-switch v-model:checked="row.enabled" @change="toggleRule($event as boolean)" />
                  </template>
                  <template v-else-if="column.columnKey === 'name'">
                    <div class="flex items-center">
                      <a-tooltip :title="row.name">
                        <a-tag class="truncate max-w-[150px]" :color="row.enabled ? 'green' : 'default'">
                          {{ row.name }}
                        </a-tag>
                      </a-tooltip>
                    </div>
                  </template>
                  <template v-else-if="column.columnKey === 'pattern'">
                    <div class="flex gap-8 items-center">
                      <a-tooltip :title="row.condition.urlPattern">
                        <div class="truncate">
                          {{ row.condition.urlPattern }}
                        </div>
                      </a-tooltip>
                      <a-tag v-if="row.condition.isRegex" color="orange" size="small" style="margin-left: 8px">
                        正则
                      </a-tag>
                    </div>
                  </template>
                  <template v-else-if="column.columnKey === 'action'">
                    <a-tag :color="row.enabled ? 'blue' : 'default'">
                      {{ getActionLabel(row.action) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.columnKey === 'action-btn'">
                    <a-space>
                      <a-button type="primary" class="flex items-center" size="small" @click="openEditDrawer(row)">
                        <EditFilled />
                        编辑
                      </a-button>
                      <a-button size="small" class="flex items-center" @click="copyRule(row)">
                        <CopyOutlined />
                        复制
                      </a-button>
                      <a-popconfirm
                        title="确定要删除这条规则吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="deleteRule(row)"
                      >
                        <a-button type="primary" class="flex items-center" danger size="small">
                          <DeleteFilled />
                          删除
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </VTable>
            </a-card>
          </div>
        </a-layout-content>
      </a-layout>

      <RuleDrawer
        v-if="drawerOpen"
        v-model:open="drawerOpen"
        :rule="editingRule"
      />
    </a-layout>
  </a-config-provider>
</template>

<style scoped>
.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #9254de;
  border-bottom: 1px solid #f0f0f0;
  padding: 13px 0;
}
:deep(.ant-input-search .anticon-search svg) {
  display: block;
}
</style>
