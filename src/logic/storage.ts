import { computed } from 'vue'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import type { Rule } from '~/shared/rule'
import type { GlobalConfig } from '~/shared/type'

export type { Rule, RuleCondition, RuleAction } from '~/shared/rule'

/**
 * 生成新的规则 ID
 * 使用当前最大 ID + 1，确保 ID 在合理范围内且不会冲突
 */
export function generateRuleId(existingRules: Rule[]): number {
  if (existingRules.length === 0) {
    return 1
  }
  const maxId = Math.max(...existingRules.map(r => r.id))
  return maxId + 1
}

export const { data: rules, dataReady: rulesReady } = useWebExtensionStorage<Rule[]>(
  'rules',
  [
    {
      id: 1,
      name: '示例规则',
      enabled: true,
      condition: {
        urlPattern: '*api.example.com*',
        isRegex: false,
      },
      action: {
        type: 'delay',
        delayMs: 2000,
      },
    },
  ],
)

/** 展示用：已启用规则排在前面，同组内保持原有顺序 */
export const sortedRules = computed(() =>
  [...rules.value].sort((a, b) => Number(b.enabled) - Number(a.enabled)),
)

export const { data: globalConfig } = useWebExtensionStorage<GlobalConfig>(
  'globalConfig',
  {
    extensionEnabled: true,
  },
)
