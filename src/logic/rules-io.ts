import { generateRuleId } from './storage'
import type { Rule } from '~/shared/rule'

export const RULES_EXPORT_VERSION = 1

export interface RulesExportPayload {
  version: number
  exportedAt: string
  rules: Rule[]
}

function cloneRule(rule: Rule): Rule {
  return JSON.parse(JSON.stringify(rule))
}

function cloneRules(rules: Rule[]): Rule[] {
  return JSON.parse(JSON.stringify(rules))
}

function extractRules(parsed: unknown): Rule[] {
  const rules = Array.isArray(parsed)
    ? parsed
    : (parsed as RulesExportPayload)?.rules

  if (!Array.isArray(rules) || rules.length === 0)
    throw new Error('导入文件中没有规则')

  return rules
}

export function parseRulesImport(content: string): Rule[] {
  try {
    return extractRules(JSON.parse(content))
  }
  catch (error) {
    if (error instanceof Error && error.message === '导入文件中没有规则')
      throw error
    throw new Error('文件不是有效的 JSON 格式')
  }
}

export function createRulesExport(rules: Rule[]): RulesExportPayload {
  return {
    version: RULES_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    rules: cloneRules(rules),
  }
}

export function downloadRulesExport(rules: Rule[]): void {
  const payload = createRulesExport(rules)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `req-intercept-rules-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function mergeImportedRules(existing: Rule[], imported: Rule[]): Rule[] {
  const result = [...existing]
  for (const rule of imported) {
    result.push({
      ...cloneRule(rule),
      id: generateRuleId(result),
    })
  }
  return result
}

export function replaceImportedRules(imported: Rule[]): Rule[] {
  const result: Rule[] = []
  for (const rule of imported) {
    result.push({
      ...cloneRule(rule),
      id: generateRuleId(result),
    })
  }
  return result
}
