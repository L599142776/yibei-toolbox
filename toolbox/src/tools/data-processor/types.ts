// 数据批量整理工具 - 类型定义

/**
 * 替换规则类型
 * whole: 整体替换 - 只有当单元格完整内容与旧值完全相同时才替换
 * partial: 局部替换 - 在单元格内容中查找旧值并替换
 */
export type ReplaceType = 'whole' | 'partial'

/**
 * 单条替换规则
 */
export interface ProcessingRule {
  id: string
  column: string
  oldValue: string
  newValue: string
  replaceType: ReplaceType
}

/**
 * 文件解析结果
 */
export interface ParsedFileData {
  data: Record<string, unknown>[]
  columns: string[]
  columnLabels: string[]
  fileName: string
  fileType: 'excel' | 'csv' | 'json' | 'unknown'
  totalRows: number
  // 原始文件引用，用于导出
  originalFile?: File
}

/**
 * 处理后的数据
 */
export interface ProcessedData {
  data: Record<string, unknown>[]
  columns: string[]
  columnLabels: string[]
  processedCount: number
  fileType: 'excel' | 'csv' | 'json' | 'unknown'
}

/**
 * 文件解析选项
 */
export interface FileParseOptions {
  headerRow?: number
  dataStartRow?: number | null
  skipRows?: number
  encoding?: string
  page?: number
  pageSize?: number
}

/**
 * 处理进度信息
 */
export interface ProcessingProgress {
  stage: 'parsing' | 'processing' | 'exporting'
  current: number
  total: number
  message: string
}
