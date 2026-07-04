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

  if (hit) {
    // eslint-disable-next-line no-console
    console.log('[ReqProxy] 🎯 拦截到 fetch 请求:', {
      url,
      ruleName: hit.name,
      actionType: action?.type,
    })
  }

  if (action?.type === 'delay') {
    await new Promise(r => setTimeout(r, action.delayMs))
  }

  // 修改请求体
  if (action?.type === 'modifyRequestBody') {
    const headers = new Headers(init?.headers)
    const modifiedInit: RequestInit = {
      ...init,
      body: action.body,
      headers,
    }
    return await originalFetch(input, modifiedInit)
  }

  const response = await originalFetch(input, init)

  // 修改响应体
  if (action?.type === 'modifyResponseBody') {
    return new Response(action.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
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

    if (hit) {
      // eslint-disable-next-line no-console
      console.log('[ReqProxy] 🎯 拦截到 XHR 请求:', {
        url: this.__url,
        ruleName: hit.name,
        actionType: action?.type,
      })
    }

    if (action?.type === 'delay') {
      setTimeout(() => super.send(body), action.delayMs)
      return
    }

    // 修改请求体
    if (action?.type === 'modifyRequestBody') {
      return super.send(action.body)
    }

    // 修改响应体
    if (action?.type === 'modifyResponseBody') {
      const patchedBody = action.body
      this.addEventListener('readystatechange', () => {
        if (this.readyState === 4) {
          const responseValue = this.responseType === 'json'
            ? JSON.parse(patchedBody)
            : patchedBody
          Object.defineProperty(this, 'responseText', { value: patchedBody, configurable: true })
          Object.defineProperty(this, 'response', { value: responseValue, configurable: true })
        }
      })
    }
    return super.send(body)
  }
}
window.XMLHttpRequest = PatchedXHR as any
