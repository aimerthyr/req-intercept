import type { PageHookRule } from '~/shared/rule'

/**
 * 页面劫持脚本（跑在 main 世界中）用于劫持 fetch 和 XMLHttpRequest 请求
 */
let activeRules: PageHookRule[] = []

window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.__type !== 'RR_RULES_UPDATE')
    return
  activeRules = e.data.rules
})

function matchUrl(pattern: string, isRegex: boolean | undefined, url: string): boolean {
  if (isRegex)
    return new RegExp(pattern).test(url)
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`).test(url)
}

function findHit(url: string) {
  return activeRules.find(r => r.enabled && matchUrl(r.condition.urlPattern, r.condition.isRegex, url))
}

// ---- 劫持 fetch ----
const originalFetch = window.fetch
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : (input as Request).url ?? String(input)
  const hit = findHit(url)
  const action = hit?.action

  if (action?.type === 'delay') {
    await new Promise(r => setTimeout(r, action.delayMs))
  }

  const response = await originalFetch(input, init)

  if (action?.type === 'modifyResponseBody') {
    return new Response(action.body, {
      status: response.status,
      statusText: response.statusText,
      headers: { 'Content-Type': action.contentType ?? 'application/json' },
    })
  }
  return response
}

// ---- 劫持 XMLHttpRequest ----
const OriginalXHR = window.XMLHttpRequest
class PatchedXHR extends OriginalXHR {
  private __url = ''
  open(method: string, url: string, ...rest: any[]) {
    this.__url = url
    // @ts-expect-error 透传原生签名
    return super.open(method, url, ...rest)
  }

  send(body?: any) {
    const hit = findHit(this.__url)
    const action = hit?.action

    if (action?.type === 'delay') {
      setTimeout(() => super.send(body), action.delayMs)
      return
    }
    if (action?.type === 'modifyResponseBody') {
      const patchedBody = action.body
      this.addEventListener('readystatechange', () => {
        if (this.readyState === 4) {
          Object.defineProperty(this, 'responseText', { value: patchedBody })
          Object.defineProperty(this, 'response', { value: patchedBody })
          Object.defineProperty(this, 'status', { value: 200 })
        }
      })
    }
    return super.send(body)
  }
}
window.XMLHttpRequest = PatchedXHR as any
