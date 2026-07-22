export interface RuleCondition {
  urlPattern: string
  isRegex?: boolean // true 时走 DNR 的 regexFilter（注意是 RE2 语法，不支持前瞻）
  resourceTypes?: chrome.declarativeNetRequest.ResourceType[] // 留空 = 不限制
}

export interface HeaderOp {
  name: string
  value?: string // set / append 时必填
  operation: 'set' | 'remove' | 'append'
}

export type RuleAction =
  | { type: 'modifyRequestHeaders', headers: HeaderOp[] }
  | { type: 'modifyResponseHeaders', headers: HeaderOp[] }
  | { type: 'redirect', redirectUrl: string }
  | { type: 'block' }
  | { type: 'modifyResponseBody', body?: string, status?: number } // 需主世界拦截
  | { type: 'modifyRequestBody', body?: string } // 需主世界拦截
  | { type: 'delay', delayMs: number } // 需主世界拦截

/** 规则运行时命中状态 */
export interface RuleHitStatus {
  /** 最近一次命中时间戳 */
  lastHitAt: number
  /** 最近一次命中的 URL */
  lastHitUrl?: string
  /** 累计命中次数 */
  hitCount: number
}

export interface Rule {
  id: number
  name: string
  enabled: boolean
  condition: RuleCondition
  action: RuleAction
  /** 运行时命中状态，由 ruleHitStatus 存储合并而来 */
  hitStatus?: RuleHitStatus
}

/** 需 MAIN 世界 req-proxy 处理的 action 子集 */
export type PageHookAction = Extract<RuleAction, { type: 'modifyResponseBody' } | { type: 'modifyRequestBody' } | { type: 'delay' }>

/** 与 Rule 结构一致，action 限定为 MAIN 世界可处理的类型 */
export type PageHookRule = Omit<Rule, 'action'> & { action: PageHookAction }

const PAGE_HOOK_TYPES = new Set<RuleAction['type']>(['modifyResponseBody', 'modifyRequestBody', 'delay'])

export const needsPageHook = (r: Rule) => PAGE_HOOK_TYPES.has(r.action.type)

export function isPageHookRule(r: Rule): r is PageHookRule {
  return needsPageHook(r)
}
