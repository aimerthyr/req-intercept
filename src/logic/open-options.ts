const OPTIONS_PAGE_PATH = 'dist/options/index.html'

export function getOptionsPageUrl(editRuleId?: number): string {
  const baseUrl = browser.runtime.getURL(OPTIONS_PAGE_PATH)
  return editRuleId != null ? `${baseUrl}?edit=${editRuleId}` : baseUrl
}

export async function openOptionsPage(editRuleId?: number): Promise<void> {
  const urlPrefix = browser.runtime.getURL(OPTIONS_PAGE_PATH)
  const url = getOptionsPageUrl(editRuleId)

  const tabs = await browser.tabs.query({})
  const existingTab = tabs.find(tab => tab.url?.startsWith(urlPrefix))

  if (existingTab?.id != null) {
    await browser.tabs.update(existingTab.id, { url, active: true })
    if (existingTab.windowId != null)
      await browser.windows.update(existingTab.windowId, { focused: true })
  }
  else {
    await browser.tabs.create({ url })
  }
}

export function parseEditRuleIdFromUrl(): number | null {
  const editId = new URLSearchParams(location.search).get('edit')
  if (!editId)
    return null
  const id = Number(editId)
  return Number.isFinite(id) ? id : null
}

export function clearEditRuleIdFromUrl(): void {
  const url = new URL(location.href)
  if (!url.searchParams.has('edit'))
    return
  url.searchParams.delete('edit')
  history.replaceState({}, '', url.toString())
}
