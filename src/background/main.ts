import { sendMessage } from 'webext-bridge/background'
import { getRules, isPageHookRule, needsPageHook } from './rule'
import { syncDnrRules } from './dnrCompiler'

/**
 *  background 中 无法使用 window doucemnt DOM 之类的 API 因为它是跑在  Service Worker 里的，它和页面是两个 js 环境
 *  只能使用 拓展 API 例如 chrome.storage sendMessage 等等
 */

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// @ts-expect-error missing types
browser.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch((error: unknown) => console.error(error))

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

async function recompile() {
  const rules = await getRules()
  const dnrRules = rules.filter(r => r.enabled && !needsPageHook(r))
  const pageRules = rules.filter(isPageHookRule)

  // 1. 默认走 DNR：block / redirect / modifyHeaders
  await syncDnrRules(dnrRules)

  // 2. 走页面劫持：modifyResponseBody / delay
  const tabs = await chrome.tabs.query({})
  await Promise.all(
    tabs.map(tab =>
      tab.id
        ? sendMessage('response-rules-updated', pageRules as never, `content-script@${tab.id}`).catch(() => {})
        : null,
    ),
  )
}

// 规则变化时触发重新编译
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.rules)
    recompile()
})

recompile()
