<script setup lang="ts">
import {
  CopyOutlined,
  DeleteFilled,
  EditFilled,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import RuleDrawer from './RuleDrawer.vue'
import { generateRuleId, rules, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { getActionLabel } from '~/logic'

const selectedMenu = ref('rules-list')
const drawerOpen = ref(false)
const editingRule = ref<Rule | null>(null)

function openAddDrawer() {
  editingRule.value = null
  drawerOpen.value = true
}

function openEditDrawer(rule: Rule) {
  editingRule.value = rule
  drawerOpen.value = true
}

const columns: any[] = [
  { title: '状态', dataIndex: 'enabled', key: 'enabled', width: 80, align: 'center' },
  { title: '规则名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: 'URL 匹配模式', key: 'pattern', ellipsis: true },
  { title: '动作', key: 'action', width: 200 },
  { title: '操作', key: 'action-btn', width: 240, align: 'center' },
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
          <a-menu-item key="rules-list">
            <UnorderedListOutlined />
            <span>规则列表</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout style="margin-left: 200px">
        <a-layout-content style="min-height: 100vh">
          <div v-if="selectedMenu === 'rules-list'" class="flex flex-col gap-12 ">
            <a-page-header
              title="规则列表"
              sub-title="管理所有请求拦截规则"
              class="border-b border-gray-200 pb-16 px-24 mb-16"
            >
              <template #extra>
                <a-button class="flex items-center" type="primary" @click="openAddDrawer">
                  <PlusOutlined />
                  新增规则
                </a-button>
              </template>
            </a-page-header>

            <a-card class="mx-24">
              <a-table
                :columns="columns"
                :data-source="sortedRules"
                :pagination="{ pageSize: 10, showSizeChanger: true, hideOnSinglePage: true }"
                :row-key="(record: Rule) => record.id"
              >
                <template #bodyCell="{ column, record }: { column: any, record: any }">
                  <template v-if="column.key === 'enabled'">
                    <a-switch v-model:checked="record.enabled" @change="toggleRule($event as boolean)" />
                  </template>
                  <template v-else-if="column.key === 'name'">
                    <a-tag :color="record.enabled ? 'green' : 'default'">
                      {{ record.name }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'pattern'">
                    {{ record.condition.urlPattern }}
                    <a-tag v-if="record.condition.isRegex" color="orange" size="small" style="margin-left: 8px">
                      正则
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-tag :color="record.enabled ? 'blue' : 'default'">
                      {{ getActionLabel(record.action) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action-btn'">
                    <a-space>
                      <a-button type="primary" class="flex items-center" size="small" @click="openEditDrawer(record)">
                        <EditFilled />
                        编辑
                      </a-button>
                      <a-button size="small" class="flex items-center" @click="copyRule(record)">
                        <CopyOutlined />
                        复制
                      </a-button>
                      <a-popconfirm
                        title="确定要删除这条规则吗？"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="deleteRule(record)"
                      >
                        <a-button type="primary" class="flex items-center" danger size="small">
                          <DeleteFilled />
                          删除
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </a-table>
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
</style>
