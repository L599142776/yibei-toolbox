// 规则引擎 - 数据处理核心逻辑

import type { ProcessingRule, ReplaceType } from '../types'

/**
 * 对单行数据应用单条规则
 * @param value 原始值
 * @param oldValue 要替换的值
 * @param newValue 新值
 * @param replaceType 替换类型
 * @returns 处理后的值
 */
export function applyRule(
  value: unknown,
  oldValue: string,
  newValue: string,
  replaceType: ReplaceType
): string {
  // 处理空值
  if (value === null || value === undefined) {
    return ''
  }

  // 转换为字符串进行处理
  const valueStr = String(value)
  const oldValueStr = String(oldValue)

  // 根据替换类型执行不同的逻辑
  if (replaceType === 'whole') {
    // 整体替换：只有当完整内容匹配时才替换
    if (valueStr === oldValueStr) {
      return newValue
    }
  } else {
    // 局部替换：查找并替换所有匹配项
    if (valueStr.includes(oldValueStr)) {
      return valueStr.split(oldValueStr).join(newValue)
    }
  }

  // 未匹配，返回原值
  return valueStr
}

/**
 * 对单行数据应用该列的所有规则
 * 规则按顺序匹配，首匹配成功后立即停止
 * @param value 原始值
 * @param rules 该列的所有规则（已按优先级排序）
 * @returns 处理后的值
 */
export function applyColumnRules(
  value: unknown,
  rules: ProcessingRule[]
): string {
  // 处理空值
  if (value === null || value === undefined) {
    return ''
  }

  let currentValue = String(value)

  // 按顺序应用规则，首匹配优先
  for (const rule of rules) {
    const oldValueStr = String(rule.oldValue)
    let matched = false

    if (rule.replaceType === 'whole') {
      // 整体替换
      if (currentValue === oldValueStr) {
        matched = true
      }
    } else {
      // 局部替换
      if (currentValue.includes(oldValueStr)) {
        matched = true
      }
    }

    if (matched) {
      // 首匹配成功，应用规则并停止
      if (rule.replaceType === 'whole') {
        currentValue = rule.newValue
      } else {
        currentValue = currentValue.split(oldValueStr).join(rule.newValue)
      }
      break // 关键：匹配成功后立即退出循环
    }
  }

  return currentValue
}

/**
 * 处理整个数据集
 * @param data 原始数据
 * @param rules 所有处理规则
 * @param columns 列名列表
 * @returns 处理后的数据
 */
export function processData(
  data: Record<string, unknown>[],
  rules: ProcessingRule[],
  columns: string[]
): Record<string, unknown>[] {
  if (!rules.length || !data.length) {
    return data
  }

  // 按列分组规则，提高处理效率
  const columnRulesMap = new Map<string, ProcessingRule[]>()

  for (const rule of rules) {
    if (!columnRulesMap.has(rule.column)) {
      columnRulesMap.set(rule.column, [])
    }
    columnRulesMap.get(rule.column)!.push(rule)
  }

  // 处理每一行数据
  return data.map((row) => {
    // 直接返回原始行数据，保留所有字段
    // GEOMETRY 等字段会保持原样传递
    const processedRow: Record<string, unknown> = { ...row }

    // 只处理有规则的列
    for (const [column, columnRules] of columnRulesMap) {
      if (columns.includes(column)) {
        processedRow[column] = applyColumnRules(row[column], columnRules)
      }
    }

    return processedRow
  })
}

/**
 * 验证规则是否有效
 * @param rule 规则对象
 * @returns 验证结果
 */
export function validateRule(rule: Partial<ProcessingRule>): { valid: boolean; error?: string } {
  if (!rule.column) {
    return { valid: false, error: '请选择目标列' }
  }

  if (rule.oldValue === undefined || rule.oldValue === '') {
    return { valid: false, error: '旧值不能为空' }
  }

  if (rule.newValue === undefined) {
    return { valid: false, error: '新值不能为空' }
  }

  if (!rule.replaceType || !['whole', 'partial'].includes(rule.replaceType)) {
    return { valid: false, error: '请选择替换类型' }
  }

  return { valid: true }
}

/**
 * 生成规则唯一ID
 * @returns 唯一ID
 */
export function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 解析批量规则文本
 * 格式：旧值→新值 或 旧值->新值，每行一条
 * @param text 批量规则文本
 * @param column 目标列
 * @param replaceType 替换类型
 * @returns 解析后的规则数组
 */
export function parseBatchRules(
  text: string,
  column: string,
  replaceType: ReplaceType
): ProcessingRule[] {
  const rules: ProcessingRule[] = []
  const lines = text.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // 支持两种分隔符：→ 或 ->
    let parts: string[] = []
    if (trimmedLine.includes('→')) {
      parts = trimmedLine.split('→', 2)
    } else if (trimmedLine.includes('->')) {
      parts = trimmedLine.split('->', 2)
    } else {
      continue // 格式不正确，跳过
    }

    if (parts.length === 2) {
      const oldValue = parts[0].trim()
      const newValue = parts[1].trim()

      if (oldValue) {
        // 旧值不能为空
        rules.push({
          id: generateRuleId(),
          column,
          oldValue,
          newValue,
          replaceType,
        })
      }
    }
  }

  return rules
}

/**
 * 预览规则效果
 * @param sampleValues 样本值数组
 * @param rule 规则
 * @returns 预览结果
 */
export function previewRuleEffect(
  sampleValues: unknown[],
  rule: ProcessingRule
): { original: string; processed: string; matched: boolean }[] {
  return sampleValues.map((value) => {
    const original = String(value ?? '')
    const processed = applyRule(value, rule.oldValue, rule.newValue, rule.replaceType)
    return {
      original,
      processed,
      matched: original !== processed,
    }
  })
}
