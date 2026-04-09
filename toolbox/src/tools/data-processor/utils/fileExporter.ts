// 文件导出工具 - 支持 Excel、CSV、JSON 导出

import { ExcelParser } from '@microti/file-handler'
import type { ProcessedData } from '../types'

/**
 * 导出处理后的数据到文件
 */
export async function exportProcessedData(
  processedData: ProcessedData,
  originalData: { fileName: string },
  fileName?: string
): Promise<boolean> {
  const { fileType } = processedData
  const outputFileName = fileName || generateOutputFileName(originalData.fileName)

  try {
    switch (fileType) {
      case 'excel':
        await exportToExcel(processedData, outputFileName)
        break
      case 'csv':
        await exportToCsv(processedData, outputFileName)
        break
      case 'json':
        await exportToJson(processedData, outputFileName)
        break
      default:
        throw new Error(`不支持的文件类型: ${fileType}`)
    }
    return true
  } catch (error) {
    console.error('导出失败:', error)
    throw error
  }
}

/**
 * 导出到 Excel
 */
async function exportToExcel(processedData: ProcessedData, fileName: string): Promise<void> {
  const { data, columns, columnLabels } = processedData

  // 确保文件名以 .xlsx 结尾
  const excelFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`

  // 如果有 columnLabels，重建数据对象，使用 columnLabels 作为键
  const useLabelsAsKeys = columnLabels && columnLabels.length > 0 && columnLabels.length === columns.length

  const exportData = data.map((row) => {
    const rowData: Record<string, unknown> = {}
    columns.forEach((col, idx) => {
      const key = useLabelsAsKeys ? columnLabels[idx] : col
      rowData[key] = row[col] ?? ''
    })
    return rowData
  })

  // 使用 columnLabels 作为表头（如果有），否则使用 columns
  const headers = useLabelsAsKeys ? columnLabels : columns

  ExcelParser.exportToExcel(exportData, excelFileName, {
    sheetName: '处理后的数据',
    headers,
  })
}

/**
 * 导出到 CSV
 */
async function exportToCsv(processedData: ProcessedData, fileName: string): Promise<void> {
  const { data, columns, columnLabels } = processedData

  // 确保文件名以 .csv 结尾
  const csvFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`

  // 如果有 columnLabels，重建数据对象，使用 columnLabels 作为键
  const useLabelsAsKeys = columnLabels && columnLabels.length > 0 && columnLabels.length === columns.length

  // 使用 columnLabels 作为表头（如果有），否则使用 columns
  const headers = useLabelsAsKeys ? columnLabels : columns

  // 构建 CSV 内容
  const csvLines: string[] = []

  // 表头
  csvLines.push(headers.join(','))

  // 数据行 - 使用对应的键获取数据
  data.forEach((row) => {
    const values = columns.map((col) => {
      // 如果使用 labels 作为键，直接用 columnLabels[idx] 作为新键名获取数据需要重新构建
      // 这里保持用 columns 作为键获取数据，只是表头用 labels
      const value = row[col]
      const strValue = value === null || value === undefined ? '' : String(value)

      // 如果值包含逗号、换行或引号，需要用引号包裹并转义
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    })
    csvLines.push(values.join(','))
  })

  const csvContent = csvLines.join('\n')

  // 创建 Blob 并下载
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = csvFileName
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 导出到 JSON
 */
async function exportToJson(processedData: ProcessedData, fileName: string): Promise<void> {
  const { data } = processedData

  // 确保文件名以 .json 结尾
  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`

  const jsonContent = JSON.stringify(data, null, 2)

  // 创建 Blob 并下载
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = jsonFileName
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 生成输出文件名
 */
export function generateOutputFileName(originalFileName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const lastDotIndex = originalFileName.lastIndexOf('.')

  if (lastDotIndex === -1) {
    return `${originalFileName}_conv_${timestamp}`
  }

  const baseName = originalFileName.slice(0, lastDotIndex)
  const extension = originalFileName.slice(lastDotIndex)

  return `${baseName}_conv_${timestamp}${extension}`
}

/**
 * 导出规则到 JSON 文件
 */
export function exportRulesToJson(rules: unknown[], fileName?: string): void {
  const exportData = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    rules,
  }

  const outputFileName = fileName || `rules_${Date.now()}.json`
  const jsonContent = JSON.stringify(exportData, null, 2)

  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = outputFileName.endsWith('.json') ? outputFileName : `${outputFileName}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 从 JSON 文件导入规则
 */
export async function importRulesFromJson(file: File): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.rules && Array.isArray(data.rules)) {
          resolve(data.rules)
        } else if (Array.isArray(data)) {
          resolve(data)
        } else {
          reject(new Error('无效的规则文件格式'))
        }
      } catch {
        reject(new Error('解析规则文件失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    reader.readAsText(file)
  })
}