// 文件解析 Hook - 仅支持 Excel、CSV、JSON 格式

import { useState, useCallback } from 'react'
import { CsvParser, ExcelParser, JsonParser } from '@microti/file-handler'
import type { ParsedFileData, FileParseOptions } from '../types'

interface UseFileParserReturn {
  parsedData: ParsedFileData | null
  isParsing: boolean
  error: string | null
  parseFile: (file: File, options?: FileParseOptions) => Promise<void>
  clearData: () => void
}

/**
 * 文件解析 Hook
 * 支持 Excel、CSV、JSON 格式
 */
export function useFileParser(): UseFileParserReturn {
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 检测文件类型
   */
  const detectFileType = (file: File): 'excel' | 'csv' | 'json' | 'unknown' => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return 'excel'
    }
    if (fileName.endsWith('.csv')) {
      return 'csv'
    }
    if (fileName.endsWith('.json')) {
      return 'json'
    }

    return 'unknown'
  }

  /**
   * 解析文件
   */
  const parseFile = useCallback(async (file: File, options: FileParseOptions = {}) => {
    setIsParsing(true)
    setError(null)

    try {
      const fileType = detectFileType(file)

      if (fileType === 'unknown') {
        throw new Error('不支持的文件类型，请上传 Excel、CSV 或 JSON 文件')
      }

      let result: any

      switch (fileType) {
        case 'excel':
          result = await ExcelParser.parseExcelFile(file, {
            headerRow: options.headerRow ?? 0,
            dataStartRow: options.dataStartRow ?? null,
            handleMergeCells: true,
            skipRows: options.skipRows ?? 0,
            page: options.page ?? 1,
            pageSize: options.pageSize ?? 10000,
            onProgress: (progress: number, info: { message: string }) => {
              console.log(`解析进度: ${progress}%, ${info.message}`)
            },
          })
          break

        case 'csv':
          result = await CsvParser.parseCsvFile(file, {
            encoding: options.encoding ?? 'auto',
            page: options.page ?? 1,
            pageSize: options.pageSize ?? 10000,
            onProgress: (progress: number, info: { message: string }) => {
              console.log(`解析进度: ${progress}%, ${info.message}`)
            },
          })
          break

        case 'json':
          result = await JsonParser.parseJsonFile(file, {
            page: options.page ?? 1,
            pageSize: options.pageSize ?? 10000,
            onProgress: (progress: number, info: { message: string }) => {
              console.log(`解析进度: ${progress}%, ${info.message}`)
            },
          })
          break

        default:
          throw new Error('不支持的文件类型，请上传 Excel、CSV 或 JSON 文件')
      }

      // 提取列名 - 保留原始 prop 用于数据访问，同时保留 label 用于显示
      const columns = result.headers.map((h: { prop: string; label: string }) => h.prop)
      const columnLabels = result.headers.map((h: { prop: string; label: string }) => h.label)
      const finalData = result.data as Record<string, unknown>[]

      setParsedData({
        data: finalData,
        columns,
        columnLabels,
        fileName: file.name,
        fileType,
        totalRows: result.totalRows,
        originalFile: file,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件解析失败'
      setError(errorMessage)
      console.error('文件解析错误:', err)
    } finally {
      setIsParsing(false)
    }
  }, [])

  /**
   * 清除数据
   */
  const clearData = useCallback(() => {
    setParsedData(null)
    setError(null)
  }, [])

  return {
    parsedData,
    isParsing,
    error,
    parseFile,
    clearData,
  }
}