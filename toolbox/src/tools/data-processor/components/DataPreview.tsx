// 数据预览组件 - 使用 TanStack Table - 优化样式

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Database, Columns, FileType } from 'lucide-react'
import type { ParsedFileData } from '../types'

interface DataPreviewProps {
  data: ParsedFileData
  maxPreviewRows?: number
}

/**
 * 数据预览组件 - 优化样式版本
 * 使用 TanStack Table 展示解析后的数据
 */
export function DataPreview({ data, maxPreviewRows = 100 }: DataPreviewProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // 限制预览行数
  const previewData = useMemo(() => {
    return data.data.slice(0, maxPreviewRows)
  }, [data.data, maxPreviewRows])

  // 构建表格列定义 - 使用 columnLabels 作为显示名称，但使用 columns 作为数据键
  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return data.columns.map((col, idx) => ({
      accessorKey: col,
      header: data.columnLabels?.[idx] ?? col,
      cell: (info) => {
        const value = info.getValue()
        // 处理空值显示
        if (value === null || value === undefined || value === '') {
          return <span className="data-preview-empty">(空)</span>
        }
        // 处理长文本截断
        const strValue = String(value)
        if (strValue.length > 50) {
          return (
            <span className="data-preview-truncate" title={strValue}>
              {strValue.slice(0, 50)}...
            </span>
          )
        }
        return strValue
      },
    }))
  }, [data.columns, data.columnLabels])

  const table = useReactTable({
    data: previewData,
    columns: tableColumns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // 获取文件类型图标颜色
  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'excel':
        return 'file-type-excel'
      case 'shapefile':
        return 'file-type-shapefile'
      case 'csv':
        return 'file-type-csv'
      case 'json':
        return 'file-type-json'
      default:
        return 'file-type-default'
    }
  }

  return (
    <div className="data-preview">
      {/* 文件信息卡片 */}
      <div className="data-preview-info">
        <div className="data-preview-info-left">
          <div className={`data-preview-file-icon ${getFileTypeColor(data.fileType)}`}>
            <Database className="w-5 h-5" />
          </div>
          <div className="data-preview-file-meta">
            <p className="data-preview-filename">{data.fileName}</p>
            <p className="data-preview-file-type">{data.fileType} 文件</p>
          </div>
        </div>

        <div className="data-preview-info-divider" />

        <div className="data-preview-info-stats">
          <div className="data-preview-stat">
            <Columns className="data-preview-stat-icon" />
            <span className="data-preview-stat-text">{data.columns.length} 列</span>
          </div>
          <div className="data-preview-stat">
            <FileType className="data-preview-stat-icon" />
            <span className="data-preview-stat-text">{data.totalRows.toLocaleString()} 行</span>
          </div>

        </div>
      </div>

      {/* 数据表格 */}
      <div className="data-preview-table-wrap">
        <table className="data-preview-table">
          <thead className="data-preview-thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {/* 行号列 */}
                <th className="data-preview-row-num-header">
                  #
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="data-preview-col-header"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="data-preview-tbody">
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className="data-preview-row"
              >
                {/* 行号 */}
                <td className="data-preview-row-num">
                  {pagination.pageIndex * pagination.pageSize + index + 1}
                </td>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="data-preview-cell"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 空数据提示 */}
        {previewData.length === 0 && (
          <div className="data-preview-empty-state">
            <div className="data-preview-empty-icon">
              <Database className="w-8 h-8" />
            </div>
            <p className="data-preview-empty-text">暂无数据</p>
          </div>
        )}
      </div>

      {/* 分页控制 */}
      {previewData.length > 0 && (
        <div className="data-preview-pagination">
          <div className="data-preview-pagination-info">
            显示第 <span className="data-preview-pagination-num">{pagination.pageIndex * pagination.pageSize + 1}</span> 到{' '}
            <span className="data-preview-pagination-num">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                previewData.length
              )}
            </span>{' '}
            条，共 <span className="data-preview-pagination-num">{previewData.length.toLocaleString()}</span> 条
            {data.totalRows > maxPreviewRows && (
              <span className="data-preview-pagination-warning">
                (仅预览前 {maxPreviewRows} 条)
              </span>
            )}
          </div>

          <div className="data-preview-pagination-controls">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="data-preview-pagination-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="data-preview-pagination-page">
              {pagination.pageIndex + 1} / {table.getPageCount()}
            </span>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="data-preview-pagination-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={pagination.pageSize}
              onChange={(e) => {
                setPagination((prev) => ({
                  ...prev,
                  pageSize: Number(e.target.value),
                }))
              }}
              className="data-preview-pagination-select"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} 条/页
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
