import type { Rule } from './storage'

export * from './storage'
export * from './open-options'
export * from './rules-io'

export function getActionLabel(action: Rule['action']) {
  const labels = {
    delay: `延时 ${action.type === 'delay' ? action.delayMs : 0} ms`,
    block: '阻止请求',
    modifyResponseBody: '修改响应体',
    modifyRequestBody: '修改请求体',
    modifyRequestHeaders: '修改请求头',
    modifyResponseHeaders: '修改响应头',
    redirect: '重定向',
  }
  return labels[action.type] || action.type
}
