import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
  } from '@tanstack/react-table'
import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  getRowStyle?: (row: Row<T>, rowIndex: number) => React.CSSProperties
}

export function DataTable<T>({ data, columns, getRowStyle }: TableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-thead">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="table-tr">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="table-th"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="table-tbody">
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className="table-tr"
              style={getRowStyle?.(row, rowIndex)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="table-td">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="table-empty">
          暂无数据
        </div>
      )}
    </div>
  )
}

interface TableColumnHeaderProps {
  children: ReactNode
  sorted?: 'asc' | 'desc' | false
  onSort?: () => void
}

export function TableColumnHeader({ children, sorted, onSort }: TableColumnHeaderProps) {
  return (
    <button
      type="button"
      className="table-column-header"
      onClick={onSort}
    >
      <span>{children}</span>
      {sorted === 'asc' && <ChevronUp size={14} />}
      {sorted === 'desc' && <ChevronDown size={14} />}
    </button>
  )
}