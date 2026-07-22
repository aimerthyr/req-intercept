import { matchUrl } from '~/logic/url-match'
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

function findHit(url: string) {
  return activeRules.find(r => r.enabled && matchUrl(r.condition.urlPattern, r.condition.isRegex, url))
}

/** 去除 JSON 中的注释不受影响 */
function stripJsonComments(input: string): string {
  let result = ''
  let inString = false
  let inSingleLineComment = false
  let inMultiLineComment = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    const next = input[i + 1]
    if (inSingleLineComment) {
      if (c === '\n') {
        inSingleLineComment = false
        result += c
      }
      continue
    }
    if (inMultiLineComment) {
      if (c === '*' && next === '/') {
        inMultiLineComment = false
        i++
      }
      continue
    }
    if (inString) {
      result += c
      if (c === '\\') {
        result += next
        i++
        continue
      }
      if (c === '"')
        inString = false
      continue
    }
    if (c === '"') {
      inString = true
      result += c
      continue
    }
    if (c === '/' && next === '/') {
      inSingleLineComment = true
      i++
      continue
    }
    if (c === '/' && next === '*') {
      inMultiLineComment = true
      i++
      continue
    }
    result += c
  }
  return result
}

// ---- 劫持 fetch ----
const originalFetch = window.fetch
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : (input as Request).url ?? String(input)
  const hit = findHit(url)
  const action = hit?.action

  if (hit) {
    window.postMessage({
      __type: 'RR_RULE_HIT',
      ruleId: hit.id,
      url,
    }, '*')
  }

  if (action?.type === 'delay') {
    await new Promise(r => setTimeout(r, action.delayMs))
  }

  // 修改请求体
  if (action?.type === 'modifyRequestBody' && action.body !== undefined) {
    const headers = new Headers(init?.headers)
    const modifiedInit: RequestInit = {
      ...init,
      body: action.body,
      headers,
    }
    return await originalFetch(input, modifiedInit)
  }

  const response = await originalFetch(input, init)

  if (action?.type === 'modifyResponseBody') {
    return new Response(action.body ?? response.body, {
      status: action.status ?? response.status,
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
      window.postMessage({
        __type: 'RR_RULE_HIT',
        ruleId: hit.id,
        url: this.__url,
      }, '*')
    }

    if (action?.type === 'delay') {
      setTimeout(() => super.send(body), action.delayMs)
      return
    }

    // 修改请求体
    if (action?.type === 'modifyRequestBody' && action.body !== undefined) {
      return super.send(action.body)
    }

    if (action?.type === 'modifyResponseBody') {
      const patchedBody = action.body
      const patchedStatus = action.status
      this.addEventListener('readystatechange', () => {
        if (this.readyState === 4) {
          if (patchedBody !== undefined) {
            const strippedBody = stripJsonComments(patchedBody)
            Object.defineProperty(this, 'responseText', { value: strippedBody, configurable: true })

            if (this.responseType === 'json') {
              try {
                const responseValue = JSON.parse(strippedBody)
                Object.defineProperty(this, 'response', { value: responseValue, configurable: true })
              }
              catch (err) {
                console.error('[ReqProxy] ❌ modifyResponseBody JSON.parse 失败:', err, strippedBody)
              }
            }
            else {
              Object.defineProperty(this, 'response', { value: strippedBody, configurable: true })
            }
          }
          if (patchedStatus !== undefined) {
            Object.defineProperty(this, 'status', { value: patchedStatus, configurable: true })
          }
        }
      })
    }
    return super.send(body)
  }
}
window.XMLHttpRequest = PatchedXHR as any
