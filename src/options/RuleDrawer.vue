<script setup lang="ts">
import { DeleteOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import JsonEditor from '~/components/JsonEditor.vue'
import { generateRuleId, rules } from '~/logic/storage'
import type { Rule } from '~/logic/storage'

const props = defineProps<{
  rule?: Rule | null
}>()

const open = defineModel<boolean>('open', { default: false })

interface FormState {
  name: string
  urlPattern: string
  isRegex: boolean
  actionType: Rule['action']['type']
  delayMs: number
  responseBody: string
  responseStatus?: number
  requestBody: string
  redirectUrl: string
  headers: Array<{ name: string, value: string, operation: 'set' | 'remove' | 'append' }>
}

const formRef = ref<FormInstance>()
const isEditing = computed(() => !!props.rule)
const drawerTitle = computed(() => (isEditing.value ? '编辑规则' : '新增规则'))

const formState = reactive<FormState>({
  name: '',
  urlPattern: '',
  isRegex: false,
  actionType: 'delay',
  delayMs: 2000,
  responseBody: '',
  responseStatus: undefined,
  requestBody: '',
  redirectUrl: '',
  headers: [],
})

const formRules = {
  name: [{ required: true, message: '请输入规则名称' }],
  urlPattern: [{ required: true, message: '请输入 URL 匹配模式' }],
}

onMounted(() => {
  const record = props.rule
  if (!record)
    return

  formState.name = record.name
  formState.urlPattern = record.condition.urlPattern
  formState.isRegex = record.condition.isRegex || false
  formState.actionType = record.action.type

  if (record.action.type === 'delay') {
    formState.delayMs = record.action.delayMs
  }
  else if (record.action.type === 'modifyResponseBody') {
    formState.responseBody = record.action.body ?? ''
    formState.responseStatus = record.action.status
  }
  else if (record.action.type === 'modifyRequestBody') {
    formState.requestBody = record.action.body ?? ''
  }
  else if (record.action.type === 'modifyRequestHeaders' || record.action.type === 'modifyResponseHeaders') {
    formState.headers = record.action.headers.map(h => ({
      name: h.name,
      value: h.value ?? '',
      operation: h.operation,
    }))
  }
  else if (record.action.type === 'redirect') {
    formState.redirectUrl = record.action.redirectUrl
  }
})

function handleCancel() {
  open.value = false
}

function getValidHeaders() {
  const headers = formState.headers
    .map(h => ({ name: h.name.trim(), value: h.value.trim(), operation: h.operation }))
    .filter(h => h.name)

  if (headers.length === 0)
    throw new Error('请至少添加一条 Header，并填写 Header 名称')

  for (const h of headers) {
    if (h.operation !== 'remove' && !h.value)
      throw new Error(`Header「${h.name}」在设置/追加模式下需要填写值`)
  }

  return headers
}

async function handleOk() {
  try {
    await formRef.value?.validate()

    let action: Rule['action']

    if (formState.actionType === 'delay') {
      action = { type: 'delay', delayMs: formState.delayMs }
    }
    else if (formState.actionType === 'block') {
      action = { type: 'block' }
    }
    else if (formState.actionType === 'modifyResponseBody') {
      const hasBody = formState.responseBody.trim() !== ''
      const hasStatus = formState.responseStatus != null
      if (!hasBody && !hasStatus)
        throw new Error('请填写响应内容或状态码')
      action = {
        type: 'modifyResponseBody',
        ...(hasBody && { body: formState.responseBody }),
        ...(hasStatus && { status: formState.responseStatus }),
      }
    }
    else if (formState.actionType === 'modifyRequestBody') {
      const hasBody = formState.requestBody.trim() !== ''
      action = {
        type: 'modifyRequestBody',
        ...(hasBody && { body: formState.requestBody }),
      }
    }
    else if (formState.actionType === 'modifyRequestHeaders') {
      action = { type: 'modifyRequestHeaders', headers: getValidHeaders() }
    }
    else if (formState.actionType === 'modifyResponseHeaders') {
      action = { type: 'modifyResponseHeaders', headers: getValidHeaders() }
    }
    else if (formState.actionType === 'redirect') {
      action = { type: 'redirect', redirectUrl: formState.redirectUrl }
    }
    else {
      throw new Error('未知的动作类型')
    }

    if (isEditing.value && props.rule) {
      const updateRule = rules.value.find(r => r.id === props.rule!.id)
      if (updateRule) {
        updateRule.name = formState.name.trim()
        updateRule.condition.urlPattern = formState.urlPattern.trim()
        updateRule.condition.isRegex = formState.isRegex
        updateRule.action = action
        message.success('规则更新成功')
      }
    }
    else {
      const newRule: Rule = {
        id: generateRuleId(rules.value),
        name: formState.name.trim(),
        enabled: true,
        condition: {
          urlPattern: formState.urlPattern.trim(),
          isRegex: formState.isRegex,
        },
        action,
      }
      rules.value.push(newRule)
      message.success('规则添加成功')
    }

    open.value = false
  }
  catch (error: any) {
    message.error(error.message || '表单验证失败')
  }
}

function addHeader() {
  formState.headers.push({ name: '', value: '', operation: 'set' })
}

function removeHeader(index: number) {
  formState.headers.splice(index, 1)
}
</script>

<template>
  <a-drawer
    :open="open"
    :title="drawerTitle"
    :width="720"
    placement="right"
    @close="open = false"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="规则名称" name="name">
        <a-input v-model:value="formState.name" placeholder="例如:拦截 API 请求" />
      </a-form-item>

      <a-form-item label="URL 模式" name="urlPattern">
        <a-input v-model:value="formState.urlPattern" placeholder="risk/status" />
        <template #extra>
          <a-form-item-rest>
            <div class="flex items-center  mt-8">
              <a-checkbox v-model:checked="formState.isRegex">
                使用正则表达式
              </a-checkbox>
              <a-popover placement="bottomLeft" :overlay-style="{ maxWidth: '420px' }">
                <template #content>
                  <div class="flex flex-col gap-8">
                    <div class="flex flex-col gap-4">
                      <div class="font-500">
                        一、默认模式（子串匹配）
                      </div>
                      <div class="pl-16" style="text-indent: -16px">
                        1. 只要请求 URL 中包含填写的内容即算命中，例如填写 risk/status，可匹配 https://api.example.com/risk/status?id=1。
                      </div>
                      <div class="pl-16" style="text-indent: -16px">
                        2. * 表示通配符，代表任意字符，其余字符按字面量处理，无需手动转义。例如填写 api.example.com/*/risk/status，可同时匹配 api.example.com/v1/risk/status 和 api.example.com/v2/risk/status，但要求域名和 risk/status 都必须出现。
                      </div>
                    </div>

                    <div class="flex flex-col gap-4">
                      <div class="font-500">
                        二、正则表达式模式
                      </div>
                      <div class="pl-16" style="text-indent: -16px">
                        1. 勾选"使用正则表达式"后生效，如需按正则规则匹配（如数字范围、捕获组等）可使用此模式，例如填写 risk/status/\d+，可匹配 .../risk/status/123，但不匹配 .../risk/status/abc。
                      </div>
                      <div class="pl-16" style="text-indent: -16px">
                        2. 输入内容将被当作正则源码原样使用，需自行处理转义，例如域名中的 . 需写成 \.，即 api\.example\.com，否则 . 会被当作"任意字符"而非字面量的点。
                      </div>
                    </div>
                  </div>
                </template>
                <QuestionCircleOutlined class="text-[#faad14] cursor-pointer" />
              </a-popover>
            </div>
          </a-form-item-rest>
        </template>
      </a-form-item>

      <a-form-item label="动作类型" name="actionType">
        <a-select v-model:value="formState.actionType">
          <a-select-option value="modifyResponseBody">
            修改响应体
          </a-select-option>
          <a-select-option value="modifyRequestBody">
            修改请求体
          </a-select-option>
          <a-select-option value="delay">
            延时请求
          </a-select-option>
          <a-select-option value="block">
            阻止请求
          </a-select-option>
          <a-select-option value="redirect">
            重定向
          </a-select-option>
          <a-select-option value="modifyRequestHeaders">
            修改请求头
          </a-select-option>
          <a-select-option value="modifyResponseHeaders">
            修改响应头
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item v-if="formState.actionType === 'delay'" label="延时(ms)">
        <a-input-number
          v-model:value="formState.delayMs"
          :min="0"
          :step="100"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item v-if="formState.actionType === 'redirect'" label="重定向 URL">
        <a-input
          v-model:value="formState.redirectUrl"
          placeholder="https://example.com/new-path"
        />
      </a-form-item>
      <template
        v-if="formState.actionType === 'modifyRequestHeaders' || formState.actionType === 'modifyResponseHeaders'"
      >
        <a-form-item :label="formState.actionType === 'modifyRequestHeaders' ? '请求头' : '响应头'">
          <div class="flex flex-col gap-12">
            <div
              v-for="(header, index) in formState.headers"
              :key="index"
              class="flex gap-8 items-center"
            >
              <a-input
                v-model:value="header.name"
                placeholder="Header 名称"
                style="flex: 1"
              />
              <a-input
                v-model:value="header.value"
                placeholder="Header 值"
                style="flex: 1"
              />
              <a-select
                v-model:value="header.operation"
                style="width: 80px"
              >
                <a-select-option value="set">
                  设置
                </a-select-option>
                <a-select-option value="append">
                  追加
                </a-select-option>
                <a-select-option value="remove">
                  删除
                </a-select-option>
              </a-select>
              <a-button
                type="text"
                size="small"
                danger
                class="flex items-center"
                @click="removeHeader(index)"
              >
                <DeleteOutlined />
              </a-button>
            </div>
            <a-button type="dashed" style="width: 100%" @click="addHeader">
              <PlusOutlined />添加 Header
            </a-button>
          </div>
          <template #extra>
            <div class="flex  mt-8 gap-8  ">
              <div>操作说明:</div>
              <div class="flex flex-col">
                <div>设置 = 覆盖该 header</div>
                <div>追加 = 在现有值后追加</div>
                <div>删除 = 移除该 header</div>
              </div>
            </div>
          </template>
        </a-form-item>
      </template>

      <template v-if="formState.actionType === 'modifyRequestBody'">
        <a-form-item label="请求体内容">
          <JsonEditor v-model="formState.requestBody" />
          <template #extra>
            <div style="margin-top: 8px; font-size: 12px; color: #999">
              留空则保持原请求体
            </div>
          </template>
        </a-form-item>
      </template>

      <template v-if="formState.actionType === 'modifyResponseBody'">
        <a-form-item label="响应内容">
          <JsonEditor v-model="formState.responseBody" />
          <template #extra>
            <div style="margin-top: 8px; font-size: 12px; color: #999">
              留空则保持原响应体
            </div>
          </template>
        </a-form-item>
        <a-form-item label="状态码">
          <a-input-number
            v-model:value="formState.responseStatus"
            :min="100"
            :max="599"
            placeholder="留空则保持原状态码"
            style="width: 100%"
          />
        </a-form-item>
      </template>

      <a-form-item>
        <template #label>
          <div class="text-[#faad14]">
            温馨提示
          </div>
        </template>
        <div class="h-[32px] flex items-center text-[#faad14]">
          某些动作类型触发后是无法在 network 面板实时看到变化的
        </div>
      </a-form-item>
    </a-form>

    <template #footer>
      <div class="flex items-center justify-end gap-12 py-8">
        <a-button @click="handleCancel">
          取消
        </a-button>
        <a-button type="primary" @click="handleOk">
          {{ isEditing ? '更新' : '添加' }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>
