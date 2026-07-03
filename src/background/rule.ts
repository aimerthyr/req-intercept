import type { Rule } from '~/shared/rule'
import type { GlobalConfig } from '~/shared/type'

export type {
  HeaderOp,
  PageHookAction,
  PageHookRule,
  Rule,
  RuleAction,
  RuleCondition,
} from '~/shared/rule'
export { isPageHookRule, needsPageHook } from '~/shared/rule'

export async function getRules(): Promise<Rule[]> {
  const { rules } = await chrome.storage.local.get('rules')
  return JSON.parse((rules || '[]') as string) as Rule[]
}

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const { globalConfig } = await chrome.storage.local.get('globalConfig')
  return JSON.parse((globalConfig || '{}') as string) as GlobalConfig
}
