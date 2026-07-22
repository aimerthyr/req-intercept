import type { RuleHitStatus } from '~/shared/rule'

const STORAGE_KEY = 'ruleHitStatus'

async function readHitStatusMap(): Promise<Record<number, RuleHitStatus>> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const raw = stored[STORAGE_KEY]
  if (!raw)
    return {}
  return JSON.parse(raw as string) as Record<number, RuleHitStatus>
}

/** 记录规则命中 */
export async function recordRuleHit(ruleId: number, url: string): Promise<void> {
  const map = await readHitStatusMap()
  const prev = map[ruleId]
  map[ruleId] = {
    lastHitAt: Date.now(),
    lastHitUrl: url,
    hitCount: (prev?.hitCount ?? 0) + 1,
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(map) })
}

/** 格式化命中时间 */
export function formatHitTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
