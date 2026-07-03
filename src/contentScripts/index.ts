/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/content-script'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info('[ContentScript] 🚀 Content Script 已加载')

  async function pushRulesToPage() {
    try {
      const config = await sendMessage('get-page-global-config', undefined, 'background')
      if (!config.extensionEnabled)
        return
      const response = await sendMessage('get-page-rules', undefined, 'background')
      window.postMessage({ __type: 'RR_RULES_UPDATE', rules: response }, '*')
    }
    catch (err) {
      console.error('[ContentScript] 获取规则失败:', err)
    }
  }

  pushRulesToPage()

  window.addEventListener('message', (e) => {
    if (e.source !== window || e.data?.__type !== 'RR_REQUEST_RULES')
      return
    pushRulesToPage()
  })

  // 监听来自 background 的规则更新
  onMessage('response-rules-updated', ({ data }) => {
    // 通过 window.postMessage 广播给 req-proxy.ts 处理
    window.postMessage({ __type: 'RR_RULES_UPDATE', rules: data }, '*')
  })
})()
