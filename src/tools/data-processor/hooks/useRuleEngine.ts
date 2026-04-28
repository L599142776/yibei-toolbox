// 规则引擎 Hook

import { useState, useCallback, useEffect } from 'react'
import type { ProcessingRule, ReplaceType } from '../types'
import {
  generateRuleId,
  validateRule,
  parseBatchRules,
  processData,
} from '../utils/ruleEngine'

interface UseRuleEngineReturn {
  rules: ProcessingRule[]
  addRule: (column: string, oldValue: string, newValue: string, replaceType: ReplaceType) => void
  addBatchRules: (text: string, column: string, replaceType: ReplaceType) => number
  editRule: (id: string, updates: Partial<ProcessingRule>) => void
  removeRule: (id: string) => void
  moveRuleUp: (id: string) => void
  moveRuleDown: (id: string) => void
  clearRules: () => void
  exportRules: () => string
  importRules: (jsonString: string) => void
  validateNewRule: (rule: Partial<ProcessingRule>) => { valid: boolean; error?: string }
}

const STORAGE_KEY = 'data-processor-rules'

/**
 * 规则引擎 Hook
 * 管理规则的增删改查、排序、导入导出
 */
export function useRuleEngine(): UseRuleEngineReturn {
  const [rules, setRules] = useState<ProcessingRule[]>(() => {
    // 从 localStorage 加载保存的规则
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })

  // 保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
    }
  }, [rules])

  /**
   * 添加单条规则
   */
  const addRule = useCallback(
    (column: string, oldValue: string, newValue: string, replaceType: ReplaceType) => {
      const newRule: ProcessingRule = {
        id: generateRuleId(),
        column,
        oldValue,
        newValue,
        replaceType,
      }

      const validation = validateRule(newRule)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      setRules((prev) => [...prev, newRule])
    },
    []
  )

  /**
   * 批量添加规则
   * @returns 成功添加的规则数量
   */
  const addBatchRules = useCallback(
    (text: string, column: string, replaceType: ReplaceType): number => {
      const newRules = parseBatchRules(text, column, replaceType)

      if (newRules.length === 0) {
        throw new Error('未解析到有效规则，请检查格式')
      }

      setRules((prev) => [...prev, ...newRules])
      return newRules.length
    },
    []
  )

  /**
   * 编辑规则
   */
  const editRule = useCallback((id: string, updates: Partial<ProcessingRule>) => {
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          const updatedRule = { ...rule, ...updates }
          const validation = validateRule(updatedRule)
          if (!validation.valid) {
            throw new Error(validation.error)
          }
          return updatedRule
        }
        return rule
      })
    )
  }, [])

  /**
   * 删除规则
   */
  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }, [])

  /**
   * 上移规则
   */
  const moveRuleUp = useCallback((id: string) => {
    setRules((prev) => {
      const index = prev.findIndex((rule) => rule.id === id)
      if (index <= 0) return prev

      const newRules = [...prev]
      ;[newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]]
      return newRules
    })
  }, [])

  /**
   * 下移规则
   */
  const moveRuleDown = useCallback((id: string) => {
    setRules((prev) => {
      const index = prev.findIndex((rule) => rule.id === id)
      if (index === -1 || index >= prev.length - 1) return prev

      const newRules = [...prev]
      ;[newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]]
      return newRules
    })
  }, [])

  /**
   * 清空所有规则
   */
  const clearRules = useCallback(() => {
    setRules([])
  }, [])

  /**
   * 导出规则为 JSON 字符串
   */
  const exportRules = useCallback((): string => {
    const exportData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      rules,
    }
    return JSON.stringify(exportData, null, 2)
  }, [rules])

  /**
   * 从 JSON 字符串导入规则
   */
  const importRules = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)

      if (data.rules && Array.isArray(data.rules)) {
        // 验证并过滤有效规则
        const validRules = data.rules.filter((rule: ProcessingRule) => {
          const validation = validateRule(rule)
          return validation.valid
        })

        if (validRules.length === 0) {
          throw new Error('未找到有效规则')
        }

        setRules(validRules)
      } else if (Array.isArray(data)) {
        // 直接是规则数组
        const validRules = data.filter((rule: ProcessingRule) => {
          const validation = validateRule(rule)
          return validation.valid
        })

        if (validRules.length === 0) {
          throw new Error('未找到有效规则')
        }

        setRules(validRules)
      } else {
        throw new Error('无效的规则文件格式')
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '导入规则失败')
    }
  }, [])

  /**
   * 验证新规则
   */
  const validateNewRule = useCallback((rule: Partial<ProcessingRule>) => {
    return validateRule(rule)
  }, [])

  return {
    rules,
    addRule,
    addBatchRules,
    editRule,
    removeRule,
    moveRuleUp,
    moveRuleDown,
    clearRules,
    exportRules,
    importRules,
    validateNewRule,
  }
}

export { processData }
