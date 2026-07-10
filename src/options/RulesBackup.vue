<script setup lang="ts">
import {
  ExportOutlined,
  FileTextOutlined,
  ImportOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { rules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'
import {
  downloadRulesExport,
  mergeImportedRules,
  parseRulesImport,
  replaceImportedRules,
} from '~/logic'

const emit = defineEmits<{
  imported: []
}>()

const importInputRef = ref<HTMLInputElement>()
const importModalOpen = ref(false)
const rulesIoOpen = ref(false)
const importMode = ref<'merge' | 'replace'>('merge')
const pendingImportRules = ref<Rule[]>([])
const pendingImportEnabledCount = computed(() => pendingImportRules.value.filter(r => r.enabled).length)

function exportRules() {
  rulesIoOpen.value = false
  downloadRulesExport(rules.value)
  message.success('规则导出成功')
}

function triggerImport() {
  rulesIoOpen.value = false
  importInputRef.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  try {
    const content = await file.text()
    pendingImportRules.value = parseRulesImport(content)
    importMode.value = 'merge'
    importModalOpen.value = true
  }
  catch (error: any) {
    message.error(error.message || '导入失败')
  }
  finally {
    input.value = ''
  }
}

function confirmImport() {
  const count = pendingImportRules.value.length
  rules.value = importMode.value === 'replace'
    ? replaceImportedRules(pendingImportRules.value)
    : mergeImportedRules(rules.value, pendingImportRules.value)

  importModalOpen.value = false
  pendingImportRules.value = []
  emit('imported')
  message.success(`成功${importMode.value === 'replace' ? '覆盖' : '合并'}导入 ${count} 条规则`)
}

function cancelImport() {
  importModalOpen.value = false
  pendingImportRules.value = []
}
</script>

<template>
  <div>
    <a-popover
      v-model:open="rulesIoOpen"
      trigger="click"
      placement="bottomRight"
      overlay-class-name="rules-io-popover"
    >
      <a-button class="rules-io-trigger flex items-center">
        <ImportOutlined />
        备份与恢复
      </a-button>
      <template #content>
        <div class="rules-io-panel">
          <button
            type="button"
            class="rules-io-action"
            :class="{ disabled: !rules.length }"
            :disabled="!rules.length"
            @click="exportRules"
          >
            <span class="rules-io-action__icon rules-io-action__icon--export">
              <ExportOutlined />
            </span>
            <span class="rules-io-action__body">
              <span class="rules-io-action__title">导出规则</span>
              <span class="rules-io-action__desc">保存为 JSON 文件，便于备份或迁移</span>
            </span>
          </button>
          <button
            type="button"
            class="rules-io-action"
            @click="triggerImport"
          >
            <span class="rules-io-action__icon rules-io-action__icon--import">
              <ImportOutlined />
            </span>
            <span class="rules-io-action__body">
              <span class="rules-io-action__title">导入规则</span>
              <span class="rules-io-action__desc">从 JSON 文件恢复或合并规则</span>
            </span>
          </button>
        </div>
      </template>
    </a-popover>

    <input
      ref="importInputRef"
      type="file"
      accept=".json,application/json"
      class="hidden"
      @change="handleImportFile"
    >

    <a-modal
      v-model:open="importModalOpen"
      title="导入规则"
      :width="560"
      centered
      ok-text="确认导入"
      cancel-text="取消"
      class="import-rules-modal"
      :ok-button-props="{ danger: importMode === 'replace' }"
      @ok="confirmImport"
      @cancel="cancelImport"
    >
      <div class="import-modal">
        <div class="import-modal__summary">
          <span class="import-modal__summary-icon">
            <FileTextOutlined />
          </span>
          <div class="import-modal__summary-body">
            <div class="import-modal__summary-title">
              已读取 {{ pendingImportRules.length }} 条规则
            </div>
            <div class="import-modal__summary-desc">
              其中 {{ pendingImportEnabledCount }} 条已启用，请选择导入方式
            </div>
          </div>
        </div>

        <div class="import-modal__modes">
          <button
            type="button"
            class="import-mode-card"
            :class="{ active: importMode === 'merge' }"
            @click="importMode = 'merge'"
          >
            <span class="import-mode-card__icon import-mode-card__icon--merge">
              <ImportOutlined />
            </span>
            <span class="import-mode-card__title">合并导入</span>
            <span class="import-mode-card__desc">保留现有 {{ rules.length }} 条规则，追加导入内容</span>
          </button>

          <button
            type="button"
            class="import-mode-card import-mode-card--danger"
            :class="{ active: importMode === 'replace' }"
            @click="importMode = 'replace'"
          >
            <span class="import-mode-card__icon import-mode-card__icon--replace">
              <SwapOutlined />
            </span>
            <span class="import-mode-card__title">覆盖导入</span>
            <span class="import-mode-card__desc">清空现有规则后，仅保留导入内容</span>
          </button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
:deep(.rules-io-popover .ant-popover-inner) {
  padding: 8px;
  border-radius: 12px;
}

.rules-io-trigger {
  border-color: #d3adf7;
  color: #722ed1;
  background: #f9f0ff;
}

.rules-io-trigger:hover,
.rules-io-trigger:focus {
  border-color: #9254de !important;
  color: #531dab !important;
  background: #efdbff !important;
}

.rules-io-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
}

.rules-io-action {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.rules-io-action:hover:not(.disabled) {
  background: #fafafa;
  border-color: #f0f0f0;
}

.rules-io-action.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.rules-io-action__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
  flex-shrink: 0;
}

.rules-io-action__icon--export {
  color: #531dab;
  background: #efdbff;
}

.rules-io-action__icon--import {
  color: #0958d9;
  background: #e6f4ff;
}

.rules-io-action__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rules-io-action__title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  line-height: 1.4;
}

.rules-io-action__desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}

.import-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.import-modal__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
}

.import-modal__summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  color: #722ed1;
  font-size: 18px;
  flex-shrink: 0;
}

.import-modal__summary-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.import-modal__summary-desc {
  margin-top: 4px;
  font-size: 13px;
  color: #595959;
}

.import-modal__modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.import-mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.import-mode-card:hover {
  border-color: #d3adf7;
  background: #fcfcfc;
}

.import-mode-card.active {
  border-color: #9254de;
  background: #f9f0ff;
  box-shadow: 0 0 0 2px rgb(146 84 222 / 12%);
}

.import-mode-card--danger.active {
  border-color: #ff7875;
  background: #fff2f0;
  box-shadow: 0 0 0 2px rgb(255 120 117 / 12%);
}

.import-mode-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 15px;
}

.import-mode-card__icon--merge {
  color: #531dab;
  background: #efdbff;
}

.import-mode-card__icon--replace {
  color: #cf1322;
  background: #fff1f0;
}

.import-mode-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.import-mode-card__desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.6;
}
</style>
