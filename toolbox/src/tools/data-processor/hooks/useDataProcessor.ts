// 数据处理 Hook

import { useState, useCallback } from 'react'
import type { ParsedFileData, ProcessedData, ProcessingRule, ProcessingProgress } from '../types'
import { processData } from '../utils/ruleEngine'
import { exportProcessedData } from '../utils/fileExporter'

interface UseDataProcessorReturn {
  processedData: ProcessedData | null
  isProcessing: boolean
  progress: ProcessingProgress | null
  error: string | null
  processAndExport: (
    parsedData: ParsedFileData,
    rules: ProcessingRule[],
    customFileName?: string
  ) => Promise<void>
  clearProcessedData: () => void
}

/**
 * 数据处理 Hook
 * 协调数据处理和导出流程
 */
export function useDataProcessor(): UseDataProcessorReturn {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * 处理数据并导出
   */
  const processAndExport = useCallback(
    async (parsedData: ParsedFileData, rules: ProcessingRule[], customFileName?: string) => {
      setIsProcessing(true)
      setError(null)

      try {
        // 验证输入
        if (!parsedData.data.length) {
          throw new Error('没有可处理的数据')
        }

        if (!rules.length) {
          throw new Error('请添加处理规则')
        }

        // 阶段 1: 处理数据
        setProgress({
          stage: 'processing',
          current: 0,
          total: parsedData.data.length,
          message: '正在应用规则...',
        })

        const processed = processData(parsedData.data, rules, parsedData.columns)

        const result: ProcessedData = {
          data: processed,
          columns: parsedData.columns,
          columnLabels: parsedData.columnLabels,
          processedCount: processed.length,
          fileType: parsedData.fileType,
        }

        setProcessedData(result)

        // 阶段 2: 导出文件
        setProgress({
          stage: 'exporting',
          current: processed.length,
          total: processed.length,
          message: '正在导出文件...',
        })

        await exportProcessedData(result, parsedData, customFileName)

        setProgress({
          stage: 'exporting',
          current: processed.length,
          total: processed.length,
          message: '导出完成',
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '处理失败'
        setError(errorMessage)
        console.error('数据处理错误:', err)
      } finally {
        setIsProcessing(false)
        setProgress(null)
      }
    },
    []
  )

  /**
   * 清除处理后的数据
   */
  const clearProcessedData = useCallback(() => {
    setProcessedData(null)
    setError(null)
    setProgress(null)
  }, [])

  return {
    processedData,
    isProcessing,
    progress,
    error,
    processAndExport,
    clearProcessedData,
  }
}
