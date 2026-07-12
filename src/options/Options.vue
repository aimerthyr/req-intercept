<script setup lang="ts">
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteFilled,
  DeleteOutlined,
  EditFilled,
  PauseCircleOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { VTableColumn } from '@aimerthyr/virtual-table'
import { VTable } from '@aimerthyr/virtual-table'
import RuleDrawer from './RuleDrawer.vue'
import RulesBackup from './RulesBackup.vue'
import { generateRuleId, rules, rulesReady, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { clearEditRuleIdFromUrl, getActionLabel, parseEditRuleIdFromUrl } from '~/logic'

const selectedMenu = ref('rules-list')
const drawerOpen = ref(false)
const editingRule = ref<Rule | null>(null)
const searchKeyword = ref('')
const enabledCount = computed(() => rules.value.filter(r => r.enabled).length)
const disabledCount = computed(() => rules.value.length - enabledCount.value)
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
  { columnHeader: '操作', columnKey: 'action-btn', columnWidth: 220, columnAlign: 'center' },
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
  <a-config-provider :theme="{ token: { colorPrimary: '#9254de', borderRadius: 10 } }">
    <a-layout class="options-layout">
      <a-layout-sider class="options-sider" :width="220">
        <div class="sider-brand">
          <div class="sider-brand__logo">
            <Logo :size="36" />
          </div>
          <div class="sider-brand__title">
            Request Interceptor
          </div>
          <div class="sider-brand__desc">
            HTTP 请求拦截与管理
          </div>
        </div>
        <a-menu
          :selected-keys="[selectedMenu]"
          mode="inline"
          class="sider-menu"
          @select="({ key }: { key: any }) => (selectedMenu = key)"
        >
          <a-menu-item key="rules-list">
            <UnorderedListOutlined />
            <span>规则列表</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout-content class="options-main">
        <div v-if="selectedMenu === 'rules-list'" class="options-page">
          <div class="page-hero">
            <div class="page-hero__body">
              <h1 class="page-hero__title">
                规则列表
              </h1>
              <p class="page-hero__desc">
                管理所有请求拦截规则，支持匹配、修改、延迟与重定向
              </p>
            </div>
            <div class="page-hero__actions">
              <RulesBackup @imported="searchKeyword = ''" />
              <a-button class="flex items-center" type="primary" @click="openAddDrawer">
                <PlusOutlined />
                新增规则
              </a-button>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-card__icon stat-card__icon--total">
                <UnorderedListOutlined />
              </span>
              <div class="stat-card__body">
                <div class="stat-card__label">
                  规则总数
                </div>
                <div class="stat-card__value">
                  {{ rules.length }}
                </div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-card__icon stat-card__icon--enabled">
                <CheckCircleOutlined />
              </span>
              <div class="stat-card__body">
                <div class="stat-card__label">
                  已启用
                </div>
                <div class="stat-card__value stat-card__value--success">
                  {{ enabledCount }}
                </div>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-card__icon stat-card__icon--disabled">
                <PauseCircleOutlined />
              </span>
              <div class="stat-card__body">
                <div class="stat-card__label">
                  已停用
                </div>
                <div class="stat-card__value stat-card__value--muted">
                  {{ disabledCount }}
                </div>
              </div>
            </div>
          </div>

          <div class="panel panel--toolbar">
            <a-input-search
              v-model:value="searchKeyword"
              allow-clear
              placeholder="搜索规则名称或 URL 模式"
              class="toolbar-search"
            />
            <a-popconfirm
              title="确定删除所有规则吗？此操作不可恢复"
              ok-text="确定"
              cancel-text="取消"
              :disabled="!rules.length"
              placement="topRight"
              @confirm="deleteAll"
            >
              <a-button class="flex items-center" danger ghost :disabled="!rules.length">
                <DeleteOutlined />
                清空全部
              </a-button>
            </a-popconfirm>
          </div>

          <div class="panel panel--table">
            <div class="panel__header">
              <div>
                <div class="panel__title">
                  规则明细
                </div>
                <div class="panel__subtitle">
                  {{ searchKeyword ? `筛选结果 ${filteredRules.length} 条` : `共 ${rules.length} 条规则` }}
                </div>
              </div>
            </div>

            <div v-if="!rules.length" class="empty-state">
              <div class="empty-state__icon">
                <UnorderedListOutlined />
              </div>
              <div class="empty-state__title">
                还没有任何规则
              </div>
              <div class="empty-state__desc">
                创建第一条规则，开始拦截和修改 HTTP 请求
              </div>
              <a-button type="primary" class="flex items-center" @click="openAddDrawer">
                <PlusOutlined />
                立即创建
              </a-button>
            </div>

            <div v-else-if="!filteredRules.length" class="empty-state empty-state--compact">
              <div class="empty-state__title">
                没有匹配的规则
              </div>
              <div class="empty-state__desc">
                试试调整搜索关键词
              </div>
            </div>

            <VTable
              v-else
              :default-pagination="{ pageSize: 10, pageIndex: 1 }"
              :columns="columns"
              :data="filteredRules"
              :row-key="(record: Rule) => record.id"
              :row-height="44"
              class="rules-table"
              :theme-config="{
                primaryColor: '#9254de',
                border: { borderStyle: 'dashed' },
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
                      <a-tag class="rule-name-tag" :color="row.enabled ? 'purple' : 'default'">
                        {{ row.name }}
                      </a-tag>
                    </a-tooltip>
                  </div>
                </template>
                <template v-else-if="column.columnKey === 'pattern'">
                  <div class="pattern-cell">
                    <a-tooltip :title="row.condition.urlPattern">
                      <span class="pattern-cell__text">{{ row.condition.urlPattern }}</span>
                    </a-tooltip>
                    <a-tag v-if="row.condition.isRegex" color="orange" class="pattern-cell__tag">
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
                  <div class="row-actions">
                    <a-button type="link" size="small" class="row-action row-action--primary" @click="openEditDrawer(row)">
                      <EditFilled />
                      编辑
                    </a-button>
                    <a-button type="link" size="small" class="row-action" @click="copyRule(row)">
                      <CopyOutlined />
                      复制
                    </a-button>
                    <a-popconfirm
                      title="确定要删除这条规则吗？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="deleteRule(row)"
                    >
                      <a-button type="link" size="small" danger class="row-action">
                        <DeleteFilled />
                        删除
                      </a-button>
                    </a-popconfirm>
                  </div>
                </template>
              </template>
            </VTable>
          </div>
        </div>
      </a-layout-content>

      <RuleDrawer
        v-if="drawerOpen"
        v-model:open="drawerOpen"
        :rule="editingRule"
      />
    </a-layout>
  </a-config-provider>
</template>

<style scoped>
.options-layout {
  min-height: 100vh;
  background: var(--ri-page-bg);
}

.options-sider {
  position: fixed;
  left: 0;
  height: 100vh;
  overflow: auto;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  box-shadow: 2px 0 16px rgb(146 84 222 / 6%);
}

.options-main {
  margin-left: 220px;
  min-height: 100vh;
}

.options-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  height: 100vh;
}

.sider-brand {
  padding: 24px 20px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.sider-brand__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: var(--ri-surface-gradient);
  color: var(--ri-primary);
}

.sider-brand__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ri-primary-darker);
  text-align: center;
  line-height: 1.4;
}

.sider-brand__desc {
  margin-top: 6px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
}

.sider-menu {
  padding: 12px 10px;
  border-inline-end: none !important;
  background: transparent !important;
}

:deep(.sider-menu .ant-menu-item) {
  height: 44px;
  margin: 0;
  border-radius: var(--ri-radius-md);
  font-weight: 500;
}

:deep(.sider-menu .ant-menu-item-selected) {
  background: var(--ri-primary-bg) !important;
  color: var(--ri-primary-darker) !important;
}

.page-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-radius: var(--ri-radius-lg);
  background: var(--ri-hero-gradient);
  box-shadow: var(--ri-shadow);
}

.page-hero__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.page-hero__desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: rgb(255 255 255 / 82%);
}

.page-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid #f0f0f0;
  border-radius: var(--ri-radius-lg);
  background: #fff;
  box-shadow: var(--ri-shadow);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--ri-radius-md);
  font-size: 18px;
  flex-shrink: 0;
}

.stat-card__icon--total {
  color: var(--ri-primary-darker);
  background: var(--ri-primary-bg-strong);
}

.stat-card__icon--enabled {
  color: #389e0d;
  background: #f6ffed;
}

.stat-card__icon--disabled {
  color: #8c8c8c;
  background: #fafafa;
}

.stat-card__label {
  font-size: 13px;
  color: #8c8c8c;
}

.stat-card__value {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  line-height: 1.2;
}

.stat-card__value--success {
  color: #52c41a;
}

.stat-card__value--muted {
  color: #8c8c8c;
}

.panel {
  border: 1px solid #f0f0f0;
  border-radius: var(--ri-radius-lg);
  background: #fff;
  box-shadow: var(--ri-shadow);
}

.panel--toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
}

.panel--table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 20px 20px 16px;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel__title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.panel__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #8c8c8c;
}

.toolbar-search {
  width: min(100%, 420px);
}

.rules-table {
  flex: 1;
  min-height: 0;
}

.rule-name-tag {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pattern-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pattern-cell__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pattern-cell__tag {
  flex-shrink: 0;
  margin: 0 !important;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.row-action {
  display: inline-flex !important;
  align-items: center;
  padding-inline: 6px !important;
}

.row-action--primary {
  color: var(--ri-primary) !important;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  border: 1px dashed var(--ri-primary-border);
  border-radius: var(--ri-radius-lg);
  background: var(--ri-primary-bg);
}

.empty-state--compact {
  padding: 32px 24px;
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #fff;
  color: var(--ri-primary);
  font-size: 24px;
}

.empty-state__title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.empty-state__desc {
  font-size: 13px;
  color: #8c8c8c;
}

:deep(.ant-input-search .anticon-search svg) {
  display: block;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
