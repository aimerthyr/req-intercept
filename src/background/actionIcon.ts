import { type Rule, getGlobalConfig } from './rule'

const ICON_INACTIVE: Record<number, string> = {
  16: 'assets/http-16.png',
  32: 'assets/http-32.png',
  48: 'assets/http-48.png',
  128: 'assets/http-128.png',
}

const ICON_ACTIVE: Record<number, string> = {
  16: 'assets/http-16-active.png',
  32: 'assets/http-32-active.png',
  48: 'assets/http-48-active.png',
  128: 'assets/http-128-active.png',
}

const iconCache = new Map<string, Record<number, ImageData>>()

async function loadIconImageData(paths: Record<number, string>): Promise<Record<number, ImageData>> {
  const cacheKey = Object.values(paths).join('|')
  const cached = iconCache.get(cacheKey)
  if (cached)
    return cached

  const imageData: Record<number, ImageData> = {}

  for (const [size, file] of Object.entries(paths)) {
    const px = Number(size)
    const response = await fetch(chrome.runtime.getURL(file))
    if (!response.ok)
      throw new Error(`Failed to load icon: ${file}`)

    const bitmap = await createImageBitmap(await response.blob())
    const canvas = new OffscreenCanvas(px, px)
    const ctx = canvas.getContext('2d')
    if (!ctx)
      throw new Error('OffscreenCanvas 2d context unavailable')

    ctx.drawImage(bitmap, 0, 0, px, px)
    bitmap.close()
    imageData[px] = ctx.getImageData(0, 0, px, px)
  }

  iconCache.set(cacheKey, imageData)
  return imageData
}

/** 有任意规则启用时切换为激活图标 */
export async function syncActionIcon(rules: Rule[]) {
  const config = await getGlobalConfig()
  const paths = config.extensionEnabled ? rules.some(r => r.enabled) ? ICON_ACTIVE : ICON_INACTIVE : ICON_INACTIVE
  try {
    const imageData = await loadIconImageData(paths)
    await chrome.action.setIcon({ imageData })
  }
  catch (error) {
    console.error('[Background] Failed to set action icon:', error)
  }
}
