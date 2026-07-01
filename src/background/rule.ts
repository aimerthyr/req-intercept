import type { Rule } from '~/shared/rule'

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
  return (rules ?? []) as Rule[]
}
