<script setup lang="ts">
import { EditFilled, RightOutlined, SettingFilled, UnorderedListOutlined } from '@ant-design/icons-vue'
import type { VTableColumn } from '@aimerthyr/virtual-table'
import { VTable } from '@aimerthyr/virtual-table'
import { globalConfig, ruleHitStatus, rules, sortedRules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import { getActionLabel, openOptionsPage } from '~/logic'

function editRule(rule: Rule) {
  openOptionsPage(rule.id)
}

const enabledCount = computed(() => rules.value.filter(r => r.enabled).length)
const tableMaxHeight = computed(() => {
  const rows = sortedRules.value.length
  return rows > 5 ? 280 : 40 + rows * 44
})

const columns: VTableColumn[] = [
  { columnHeader: '状态', columnKey: 'enabled', columnWidth: 60 },
  { columnHeader: '规则名称', columnKey: 'name', columnWidth: 180 },
  { columnHeader: 'URL 模式', columnKey: 'pattern' },
  { columnHeader: '动作', columnKey: 'action', columnWidth: 120 },
  { columnHeader: '操作', columnKey: 'edit', columnWidth: 56, columnAlign: 'center' },
]
</script>

<template>
  <a-config-provider :theme="{ token: { colorPrimary: '#9254de', borderRadius: 10 } }">
    <div class="popup">
      <header class="popup-header">
        <div class="popup-header__brand">
          <Logo :size="24" />
          <span>Request Interceptor</span>
        </div>
        <div class="popup-header__switch">
          <span
            class="popup-header__status-dot"
            :class="globalConfig.extensionEnabled ? 'is-running' : 'is-stopped'"
          />
          <span class="popup-header__status-text">
            {{ globalConfig.extensionEnabled ? '运行中' : '已停止' }}
          </span>
          <a-switch v-model:checked="globalConfig.extensionEnabled" size="small" />
        </div>
      </header>

      <main class="popup-body">
        <section class="rules-card">
          <div class="rules-card__bar">
            <p class="rules-card__summary">
              共 <strong>{{ rules.length }}</strong> 条规则，
              <strong class="is-enabled">{{ enabledCount }}</strong> 条已启用
            </p>
            <button type="button" class="rules-card__manage" @click="() => openOptionsPage()">
              <SettingFilled />
              管理规则
              <RightOutlined />
            </button>
          </div>

          <div v-if="!rules.length" class="empty-inner">
            <div class="empty-inner__icon">
              <UnorderedListOutlined />
            </div>
            <p class="empty-inner__desc">
              前往管理页创建第一条拦截规则
            </p>
            <a-button type="primary" class="manage-entry" @click="() => openOptionsPage()">
              <SettingFilled />
              管理规则
            </a-button>
          </div>

          <VTable
            v-else
            :columns="columns"
            :data="sortedRules"
            class="rules-table"
            :style="{ maxHeight: `${tableMaxHeight}px` }"
            :row-key="(row: Rule) => row.id"
            :row-height="44"
            :theme-config="{
              primaryColor: '#9254de',
              border: { borderStyle: 'dashed' },
            }"
          >
            <template #bodyCell="{ column, row }">
              <template v-if="column.columnKey === 'enabled'">
                <a-switch v-model:checked="row.enabled" size="small" />
              </template>
              <template v-else-if="column.columnKey === 'name'">
                <div class="rule-name-cell">
                  <a-tooltip :title="row.name">
                    <a-tag class="rule-name-tag" :color="row.enabled ? 'purple' : 'default'">
                      {{ row.name }}
                    </a-tag>
                  </a-tooltip>
                  <RuleHitBadge :status="ruleHitStatus[row.id]" :enabled="row.enabled" />
                </div>
              </template>
              <template v-else-if="column.columnKey === 'pattern'">
                <a-tooltip :title="(row.condition.isRegex ? '正则: ' : '通配: ') + row.condition.urlPattern">
                  <span class="pattern-text">{{ row.condition.urlPattern }}</span>
                </a-tooltip>
              </template>
              <template v-else-if="column.columnKey === 'action'">
                <a-tag :color="row.enabled ? 'blue' : 'default'">
                  {{ getActionLabel(row.action) }}
                </a-tag>
              </template>
              <template v-else-if="column.columnKey === 'edit'">
                <a-button type="text" size="small" class="edit-btn" @click="editRule(row)">
                  <EditFilled />
                </a-button>
              </template>
            </template>
          </VTable>
        </section>
      </main>
    </div>
  </a-config-provider>
</template>

<style scoped>
.popup {
  width: 720px;
  overflow: hidden;
  background: var(--ri-page-bg);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 52px;
  padding: 0 16px;
  background: var(--ri-hero-gradient);
}

.popup-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.popup-header__switch {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 12%);
}

.popup-header__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.popup-header__status-dot.is-running {
  background: #52c41a;
  box-shadow: 0 0 0 3px rgb(82 196 26 / 24%);
}

.popup-header__status-dot.is-stopped {
  background: #ff4d4f;
  box-shadow: 0 0 0 3px rgb(255 77 79 / 24%);
}

.popup-header__status-text {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.popup-body {
  padding: 12px;
}

.rules-card {
  overflow: hidden;
  border: 1px solid #ebe4f5;
  border-radius: var(--ri-radius-lg);
  background: #fff;
  box-shadow: var(--ri-shadow);
}

.rules-card__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--ri-surface-gradient);
  border-bottom: 1px solid #e9d8fd;
}

.rules-card__summary {
  margin: 0;
  font-size: 13px;
  color: #595959;
}

.rules-card__summary strong {
  color: #262626;
}

.rules-card__summary .is-enabled {
  color: #52c41a;
}

.rules-card__manage {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ri-primary-darker);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.rules-card__manage:hover {
  color: var(--ri-primary);
}

.empty-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 24px 24px;
}

.empty-inner__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--ri-primary-bg);
  color: var(--ri-primary);
  font-size: 20px;
}

.empty-inner__desc {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
}

.manage-entry {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
}

.rules-table {
  overflow: hidden;
}

.rule-name-cell {
  display: flex;
  align-items: center;
  min-width: 0;
}

.rule-name-tag {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pattern-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-btn {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  color: var(--ri-primary) !important;
}

.edit-btn:hover {
  background: var(--ri-primary-bg) !important;
}
</style>
