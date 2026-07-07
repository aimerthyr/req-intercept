/**
 * 通配符 pattern 转正则表达式源码
 * 仅转义正则特殊字符，*  -> .*，不做锚定（子串匹配语义，与 DNR urlFilter 默认行为对齐）
 */
export function wildcardToRegexSource(pattern: string): string {
  return pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
}

/**
 * 统一的 URL 匹配函数
 */
export function matchUrl(pattern: string, isRegex: boolean | undefined, url: string): boolean {
  const source = isRegex ? pattern : wildcardToRegexSource(pattern)
  return new RegExp(source, 'i').test(url)
}
