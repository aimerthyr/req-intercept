import type { HeaderOp, Rule } from './rule'

function toHeaderInfo(ops: HeaderOp[]): chrome.declarativeNetRequest.ModifyHeaderInfo[] | null {
  const items = ops
    .filter(op => op.name.trim())
    .map(op => ({
      header: op.name.trim(),
      operation: op.operation as chrome.declarativeNetRequest.HeaderOperation,
      value: op.value,
    }))
  return items.length > 0 ? items : null
}

function toDnrRule(rule: Rule): chrome.declarativeNetRequest.Rule | null {
  const condition: chrome.declarativeNetRequest.RuleCondition = rule.condition.isRegex
    ? { regexFilter: rule.condition.urlPattern, resourceTypes: rule.condition.resourceTypes }
    : { urlFilter: rule.condition.urlPattern, resourceTypes: rule.condition.resourceTypes }

  switch (rule.action.type) {
    case 'block':
      return { id: rule.id, priority: 1, condition, action: { type: 'block' } }
    case 'redirect':
      return {
        id: rule.id,
        priority: 1,
        condition,
        action: { type: 'redirect', redirect: { url: rule.action.redirectUrl } },
      }
    case 'modifyRequestHeaders': {
      const requestHeaders = toHeaderInfo(rule.action.headers)
      if (!requestHeaders)
        return null
      return {
        id: rule.id,
        priority: 1,
        condition,
        action: { type: 'modifyHeaders', requestHeaders },
      }
    }
    case 'modifyResponseHeaders': {
      const responseHeaders = toHeaderInfo(rule.action.headers)
      if (!responseHeaders)
        return null
      return {
        id: rule.id,
        priority: 1,
        condition,
        action: { type: 'modifyHeaders', responseHeaders },
      }
    }
    default:
      return null // modifyResponseBody/delay 调用前已被过滤，这里只是兜底
  }
}

/** 全量同步：先清空旧规则再写入新规则。规则量级通常远小于 5000 上限，简单可靠优先于增量diff。 */
export async function syncDnrRules(rules: Rule[]): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const addRules = rules.map(toDnrRule).filter((r): r is chrome.declarativeNetRequest.Rule => r !== null)

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules,
  })
}
