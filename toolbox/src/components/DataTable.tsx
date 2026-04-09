import { useMemo, useRef, useState, useEffect, type CSSProperties } from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type Row, type SortingState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

type CellAlign = 'left' | 'center' | 'right'
type CellPin = 'left' | 'right'

export interface DataTableColumnMeta {
  align?: CellAlign
  pin?: CellPin
  width?: number | string
  minWidth?: number
  maxWidth?: number
}

interface DataTableProps<TData extends object> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  maxHeight?: number
  rowHeight?: number
  headerHeight?: number
  virtualized?: boolean
  enableSorting?: boolean
  getRowStyle?: (row: Row<TData>, rowIndex: number) => CSSProperties | undefined
  getRowKey?: (row: Row<TData>, rowIndex: number) => string
  resizable?: boolean
}

interface DataTableProps<TData extends object> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  maxHeight?: number
  rowHeight?: number
  headerHeight?: number
  virtualized?: boolean
  enableSorting?: boolean
  getRowStyle?: (row: Row<TData>, rowIndex: number) => CSSProperties | undefined
  getRowKey?: (row: Row<TData>, rowIndex: number) => string
  resizable?: boolean
}

function getColMeta<TData extends object>(col: ColumnDef<TData, unknown>): DataTableColumnMeta | undefined {
  return (col.meta as DataTableColumnMeta | undefined)
}

export default function DataTable<TData extends object>({
  data,
  columns,
  maxHeight = 520,
  rowHeight = 36,
  headerHeight = 40,
  virtualized = false,
  enableSorting = false,
  getRowStyle,
  getRowKey,
  resizable = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnWidths, setColumnWidths] = useState<Map<string, number>>(new Map())
  const [isResizing, setIsResizing] = useState(false)
  const [resizeColumnId, setResizeColumnId] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

// Initialize column widths from column definitions
  useMemo(() => {
    const widths = new Map<string, number>()
    columns.forEach(column => {
      const meta = getColMeta(column)
      let width: number = 100 // Default width
      
      if (meta?.width !== undefined && meta.width !== null) {
        if (typeof meta.width === 'number') {
          width = meta.width
        } else if (typeof meta.width === 'string') {
          const parsed = parseInt(meta.width, 10)
          if (!isNaN(parsed)) {
            width = parsed
          }
        }
      }
      
      widths.set(column.id as string, width)
    })
    setColumnWidths(widths)
  }, [columns])

  const table = useReactTable({
    data,
    columns,
    state: enableSorting ? { sorting } : {},
    onSortingChange: enableSorting ? setSorting : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
  })

  const leafColumns = table.getVisibleLeafColumns()
  const pinnedLeftOffsets = useMemo(() => {
    const offsets = new Map<string, number>()
    let left = 0
    for (const col of leafColumns) {
      const meta = getColMeta(col.columnDef)
      if (meta?.pin === 'left') {
        offsets.set(col.id, left)
        left += col.getSize()
      }
    }
    return offsets
  }, [leafColumns])

  const totalWidth = useMemo(() => leafColumns.reduce((sum, c) => sum + c.getSize(), 0), [leafColumns])
  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  })

   // Column resizing handlers
   const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
     e.preventDefault()
     e.stopPropagation()
     setIsResizing(true)
     setResizeColumnId(columnId)
     setStartX(e.clientX)
     const currentWidth = columnWidths.get(columnId) ?? 100
     setStartWidth(currentWidth)
   }
   
   const handleResizeMove = (e: React.MouseEvent) => {
     if (!isResizing || !resizeColumnId) return
     e.preventDefault()
     const diff = e.clientX - startX
     const newWidth = Math.max(20, startWidth + diff) // Minimum width of 20px
     setColumnWidths(prev => {
       const newMap = new Map(prev)
       newMap.set(resizeColumnId, newWidth)
       return newMap
     })
   }
   
   const handleResizeEnd = () => {
     setIsResizing(false)
     setResizeColumnId(null)
   }
   
   // Add event listeners for mouse up and move outside the component
   useEffect(() => {
     if (isResizing) {
       window.addEventListener('mousemove', handleResizeMove as unknown as EventListener)
       window.addEventListener('mouseup', handleResizeEnd as unknown as EventListener)
     } else {
       window.removeEventListener('mousemove', handleResizeMove as unknown as EventListener)
       window.removeEventListener('mouseup', handleResizeEnd as unknown as EventListener)
     }
     return () => {
       window.removeEventListener('mousemove', handleResizeMove as unknown as EventListener)
       window.removeEventListener('mouseup', handleResizeEnd as unknown as EventListener)
     }
   }, [isResizing, handleResizeMove, handleResizeEnd])

  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg)' }}>
      <div
        ref={scrollRef}
        style={{
          maxHeight,
          overflow: 'auto',
        }}
      >
         <div style={{ minWidth: totalWidth }}>
           <div
             style={{
               position: 'sticky',
               top: 0,
               zIndex: 5,
               height: headerHeight,
               display: 'flex',
               background: 'rgba(var(--bg-rgb), 0.8)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
               borderBottom: '2px solid var(--accent)',
             }}
           >
            {table.getHeaderGroups().map(headerGroup => (
              <div key={headerGroup.id} style={{ display: 'flex', height: '100%' }}>
               {headerGroup.headers.map((header) => {
                   const meta = getColMeta(header.column.columnDef)
                   const align: CellAlign = meta?.align ?? 'left'
                   const left = meta?.pin === 'left' ? pinnedLeftOffsets.get(header.column.id) : undefined
                   const canSort = enableSorting && header.column.getCanSort()
                   const sortDir = header.column.getIsSorted()
                   const columnWidth = columnWidths.get(header.column.id) ?? header.column.getSize()

                   return (
                     <div
                       key={header.id}
                       onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                       onMouseDown={(e) => handleResizeStart(e, header.column.id)}
                        style={{
                          width: columnWidth,
                          minWidth: columnWidth,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
                          padding: '0 12px',
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          borderRight: '1px solid rgba(128,128,128,0.15)',
                          cursor: canSort ? 'pointer' : 'default',
                          userSelect: 'none',
                          position: meta?.pin === 'left' ? 'sticky' : 'relative',
                          left,
                          background: meta?.pin === 'left' ? 'var(--bg-input)' : undefined,
                          zIndex: meta?.pin === 'left' ? 6 : 5,
                          gap: 6,
                          ...(resizable && {
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: 5,
                              cursor: 'col-resize',
                              backgroundColor: 'transparent'
                            }
                          })
                        }}
                      >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : ''}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {virtualized ? (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index]
                const rowStyle = getRowStyle?.(row, virtualRow.index)
                const key = getRowKey?.(row, virtualRow.index) ?? row.id

                return (
                  <div
                    key={key}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: rowHeight,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div style={{ display: 'flex', height: rowHeight, ...rowStyle }}>
                       {row.getVisibleCells().map((cell) => {
                         const meta = getColMeta(cell.column.columnDef)
                         const align: CellAlign = meta?.align ?? 'left'
                         const left = meta?.pin === 'left' ? pinnedLeftOffsets.get(cell.column.id) : undefined
                         const columnWidth = columnWidths.get(cell.column.id) ?? cell.column.getSize()

                         return (
                           <div
                             key={cell.id}
                             style={{
                               width: columnWidth,
                               minWidth: columnWidth,
                               flexShrink: 0,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
                               padding: '0 12px',
                               fontSize: 13,
                               borderRight: '1px solid rgba(128,128,128,0.12)',
                               borderBottom: '1px solid rgba(128,128,128,0.08)',
                               overflow: 'hidden',
                               position: meta?.pin === 'left' ? 'sticky' : 'relative',
                               left,
                               background: meta?.pin === 'left' ? 'inherit' : undefined,
                               zIndex: meta?.pin === 'left' ? 4 : 1,
                             }}
                           >
                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
                           </div>
                         )
                       })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            rows.map((row, rowIndex) => {
              const rowStyle = getRowStyle?.(row, rowIndex)
              const key = getRowKey?.(row, rowIndex) ?? row.id

               return (
                 <div key={key} style={{ display: 'flex', height: rowHeight, ...rowStyle }}>
                   {row.getVisibleCells().map((cell) => {
                     const meta = getColMeta(cell.column.columnDef)
                     const align: CellAlign = meta?.align ?? 'left'
                     const left = meta?.pin === 'left' ? pinnedLeftOffsets.get(cell.column.id) : undefined
                     const columnWidth = columnWidths.get(cell.column.id) ?? cell.column.getSize()

                     return (
                       <div
                         key={cell.id}
                         style={{
                           width: columnWidth,
                           minWidth: columnWidth,
                           flexShrink: 0,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
                           padding: '0 12px',
                           fontSize: 13,
                           borderRight: '1px solid rgba(128,128,128,0.12)',
                           borderBottom: '1px solid rgba(128,128,128,0.08)',
                           overflow: 'hidden',
                           position: meta?.pin === 'left' ? 'sticky' : 'relative',
                           left,
                           background: meta?.pin === 'left' ? 'inherit' : undefined,
                           zIndex: meta?.pin === 'left' ? 4 : 1,
                         }}
                       >
                         {flexRender(cell.column.columnDef.cell, cell.getContext())}
                       </div>
                     )
                   })}
                 </div>
               )
            })
          )}

          {!virtualized && rows.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>—</div>
          )}
        </div>
      </div>
    </div>
  )
}
