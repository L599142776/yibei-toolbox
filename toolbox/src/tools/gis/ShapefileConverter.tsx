import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { ShapefileParser } from '@microti/file-handler'
import type { ShapefileParseResult, ShapefileParserOptions } from '@microti/file-handler'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'
import DataTable from '../../components/DataTable'
import { Upload, FileArchive, Loader2, RotateCcw, CheckSquare, Square, Trash2, Filter, Plus, X, BookOpen, Download } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

// 导入规则管理组件
import { useRuleEngine } from '../data-processor/hooks/useRuleEngine'
import { RuleManager } from '../data-processor/components/RuleManager'
import { processData } from '../data-processor/utils/ruleEngine'
import type { ProcessingRule } from '../data-processor/types'

type FilterOp = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains' | 'isEmpty' | 'isNotEmpty'

interface FilterRule {
  id: string
  column: string
  operator: FilterOp
  value: string
}

export default function ShapefileConverter() {
  const [result, setResult] = useState<ShapefileParseResult | null>(null)
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState('')
  const [encoding, setEncoding] = useState('GB18030')
  const [exportEncoding, setExportEncoding] = useState('GB18030')
  const [exportProjection, setExportProjection] = useState('WGS84')
  const [uploadedFiles, setUploadedFiles] = useState<File[] | null>(null)
  const [isZipFile, setIsZipFile] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showRulesPanel, setShowRulesPanel] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 规则管理
  const {
    rules,
    addRule,
    editRule,
    removeRule,
    moveRuleUp,
    moveRuleDown,
    clearRules,
    exportRules,
    importRules,
  } = useRuleEngine()

  // 获取表头（排除几何字段）
  const headers = useMemo(() => {
    if (!result?.headers) return []
    return result.headers.filter(h => h.prop !== 'GEOMETRY' && h.prop !== 'wkt' && h.prop !== 'wktType')
  }, [result])

  // 获取可用的列名
  const columns = useMemo(() => {
    return headers.map(h => h.prop)
  }, [headers])

  useEffect(() => {
    if (result?.data) {
      setTableData(result.data.map(row => ({ ...row })))
      setSelectedRows(new Set())
      setEditingCell(null)
      setFilters([])
    }
  }, [result])

  // 应用规则到表格数据
  const handleApplyRules = () => {
    if (!tableData.length || rules.length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      // 应用规则处理数据并更新表格
      const processedData = processData(tableData, rules, columns)
      setTableData(processedData)
      // 处理完成后清空规则
      clearRules()
      alert('处理完成！')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddRule = (rule: ProcessingRule) => {
    addRule(rule.column, rule.oldValue, rule.newValue, rule.replaceType)
  }

  const handleAddBatchRules = (newRules: ProcessingRule[]) => {
    newRules.forEach((rule) => {
      addRule(rule.column, rule.oldValue, rule.newValue, rule.replaceType)
    })
  }

  const doParse = useCallback(async (files: File[], zip: boolean, enc: string) => {
    setLoading(true)
    setError('')
    setResult(null)
    setTableData([])
    setProgress(0)
    setProgressMsg('')

    const validFiles = files.filter(f => f instanceof File && f.name)
    if (!validFiles.length) {
      setError('未找到有效文件')
      setLoading(false)
      return
    }

    const options: ShapefileParserOptions = {
      encoding: enc,
      onProgress: (pct, info) => {
        setProgress(pct)
        setProgressMsg(info.message)
      },
    }

    try {
      let res: ShapefileParseResult
      if (zip) {
        res = await ShapefileParser.parseShapefileZip(validFiles[0], options)
      } else {
        res = await ShapefileParser.parseShapefile(validFiles, options)
      }
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '解析失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFile = useCallback((input: File | File[]) => {
    const files = Array.isArray(input) ? input : [input]
    const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')
    setUploadedFiles(files)
    setIsZipFile(isZip)
    clearRules()
    doParse(files, isZip, encoding)
  }, [encoding, doParse])

  useEffect(() => {
    if (uploadedFiles && !loading) {
      doParse(uploadedFiles, isZipFile, encoding)
    }
  }, [encoding])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    const hasShapefile = files.some(f => ShapefileParser.isShapefile(f))
    if (hasShapefile) {
      const isSingleZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')
      handleFile(isSingleZip ? files[0] : files)
    } else {
      setError('请上传 .shp / .dbf / .prj 文件或 .zip 压缩包')
    }
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const filteredData = useMemo(() => {
    if (!filters.length) return tableData
    return tableData.filter(row =>
      filters.every(f => {
        const cell = String(row[f.column] ?? '')
        const val = f.value
        switch (f.operator) {
          case 'contains': return cell.toLowerCase().includes(val.toLowerCase())
          case 'notContains': return !cell.toLowerCase().includes(val.toLowerCase())
          case 'equals': return cell === val
          case 'startsWith': return cell.toLowerCase().startsWith(val.toLowerCase())
          case 'endsWith': return cell.toLowerCase().endsWith(val.toLowerCase())
          case 'isEmpty': return cell === ''
          case 'isNotEmpty': return cell !== ''
          default: return true
        }
      })
    )
  }, [tableData, filters])

  const handleExport = async () => {
    const dataToExport = selectedRows.size > 0
      ? filteredData.filter((_, i) => selectedRows.has(i))
      : filteredData

    if (!dataToExport.length) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (ShapefileParser as any).exportToShapefile(dataToExport, result?.fileName || 'export', {
        encoding: exportEncoding,
        projection: exportProjection,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导出失败')
    }
  }

  const handleClear = () => {
    setResult(null)
    setTableData([])
    setError('')
    setUploadedFiles(null)
    setIsZipFile(false)
    setSelectedRows(new Set())
    setEditingCell(null)
    setFilters([])
    setShowFilterPanel(false)
    setShowRulesPanel(false)
    setProgress(0)
    setProgressMsg('')
    clearRules()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredData.map((_, i) => i)))
    }
  }

  const toggleSelectRow = (idx: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const startEdit = (rowIdx: number, col: string) => {
    setEditingCell({ row: rowIdx, col })
    setEditValue(String(filteredData[rowIdx][col] ?? ''))
  }

  const commitEdit = () => {
    if (!editingCell) return
    const origIdx = tableData.indexOf(filteredData[editingCell.row])
    if (origIdx === -1) return
    setTableData(prev => {
      const next = [...prev]
      next[origIdx] = { ...next[origIdx], [editingCell.col]: editValue }
      return next
    })
    setEditingCell(null)
  }

  const cancelEdit = () => {
    setEditingCell(null)
  }

  const deleteSelected = () => {
    if (!selectedRows.size) return
    const toRemove = new Set(selectedRows)
    setTableData(prev => prev.filter((_, i) => {
      const filteredIdx = filteredData.indexOf(prev[i])
      return filteredIdx === -1 || !toRemove.has(filteredIdx)
    }))
    setSelectedRows(new Set())
  }

  const addFilter = () => {
    const firstCol = headers.length > 0 ? headers[0].prop : ''
    setFilters(prev => [...prev, { id: `filter-${Date.now()}-${prev.length}`, column: firstCol, operator: 'contains', value: '' }])
  }

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, patch: Partial<FilterRule>) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const clearFilters = () => {
    setFilters([])
    setSelectedRows(new Set())
  }


  const allSelected = filteredData.length > 0 && selectedRows.size === filteredData.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < filteredData.length

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return [
      {
        id: '__select__',
        header: () => (
          <div onClick={toggleSelectAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer' }}>
            {allSelected ? <CheckSquare size={16} color="var(--accent)" /> : someSelected ? <Square size={16} style={{ opacity: 0.4 }} /> : <Square size={16} style={{ opacity: 0.3 }} />}
          </div>
        ),
        cell: ({ row }) => {
          const isSelected = selectedRows.has(row.index)
          return (
            <div onClick={() => toggleSelectRow(row.index)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer' }}>
              {isSelected ? <CheckSquare size={15} color="var(--accent)" /> : <Square size={15} style={{ opacity: 0.3 }} />}
            </div>
          )
        },
        size: COL_W_CHECK,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
      },
      {
        id: '__idx__',
        header: '#',
        cell: ({ row }) => (
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            {String((row.original as Record<string, unknown>)._rowIndex ?? row.index)}
          </span>
        ),
        size: COL_W_IDX,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
      },
      ...headers.map((h) => ({
        accessorKey: h.prop,
        header: h.label,
        cell: ({ row, getValue }) => {
          const rowIdx = row.index
          const isEditing = editingCell?.row === rowIdx && editingCell?.col === h.prop
          return (
            <div
              onClick={() => !isEditing && startEdit(rowIdx, h.prop)}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                cursor: isEditing ? 'text' : 'pointer',
              }}
            >
              {isEditing ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                  style={{
                    width: '100%',
                    padding: '2px 6px',
                    fontSize: 13,
                    border: '1.5px solid var(--accent)',
                    borderRadius: 4,
                    background: 'var(--bg-input)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {String(getValue() ?? '')}
                </span>
              )}
            </div>
          )
        },
        size: COL_W_DATA,
        enableSorting: false,
      })) as ColumnDef<Record<string, unknown>>[],
    ]
  }, [allSelected, someSelected, cancelEdit, commitEdit, editValue, editingCell, headers, selectedRows, startEdit, toggleSelectAll, toggleSelectRow])

  return (
    <ToolLayout title="Shapefile 解析与导出" description="解析 Shapefile (.shp/.dbf/.prj) 或 ZIP 压缩包，查看属性表格并导出">
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label className="tool-label">DBF 编码</label>
          <Select
            value={encoding}
            onChange={v => setEncoding(v)}
            options={[
              { value: 'GB18030', label: 'GB18030' },
              { value: 'UTF-8', label: 'UTF-8' },
              { value: 'GBK', label: 'GBK' },
              { value: 'GB2312', label: 'GB2312' },
            ]}
          />
        </div>
        {uploadedFiles && (
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowRulesPanel(!showRulesPanel)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, borderColor: rules.length > 0 ? 'var(--accent)' : undefined }}
            >
              <BookOpen size={14} /> 处理规则 {rules.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, lineHeight: '18px' }}>{rules.length}</span>}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, borderColor: filters.length > 0 ? 'var(--accent)' : undefined }}
            >
              <Filter size={14} /> 筛选 {filters.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, lineHeight: '18px' }}>{filters.length}</span>}
            </button>
            <button className="btn btn-outline" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RotateCcw size={14} /> 清除重置
            </button>
          </>
        )}
      </div>

      {/* Rules Panel */}
      {showRulesPanel && (
        <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>处理规则</h3>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>添加数据替换规则，应用到表格数据</p>
          </div>
          <RuleManager
            rules={rules}
            columns={columns}
            onAddRule={handleAddRule}
            onAddBatchRules={handleAddBatchRules}
            onEditRule={editRule}
            onRemoveRule={removeRule}
            onMoveRuleUp={moveRuleUp}
            onMoveRuleDown={moveRuleDown}
            onClearRules={clearRules}
            onExportRules={exportRules}
            onImportRules={importRules}
          />
          {rules.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={handleApplyRules}
                disabled={isProcessing}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Download size={14} /> {isProcessing ? '处理中...' : '处理'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> 筛选条件
            </strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={addFilter} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <Plus size={14} /> 添加条件
              </button>
              {filters.length > 0 && (
                <button className="btn btn-outline" onClick={clearFilters} style={{ fontSize: 13, color: '#ef4444', borderColor: '#ef4444' }}>
                  清空筛选
                </button>
              )}
            </div>
          </div>
          {filters.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>暂无筛选条件，点击"添加条件"开始筛选</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filters.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 30 }}>
                    {i === 0 ? '其中' : '且'}
                  </span>
                  <Select
                    value={f.column}
                    onChange={v => updateFilter(f.id, { column: v })}
                    options={headers.map(h => ({ value: h.prop, label: h.label }))}
                    width={140}
                    fontSize={13}
                  />
                  <Select
                    value={f.operator}
                    onChange={v => updateFilter(f.id, { operator: v as FilterOp })}
                    options={[
                      { value: 'contains', label: '包含' },
                      { value: 'notContains', label: '不包含' },
                      { value: 'equals', label: '等于' },
                      { value: 'startsWith', label: '开头是' },
                      { value: 'endsWith', label: '结尾是' },
                      { value: 'isEmpty', label: '为空' },
                      { value: 'isNotEmpty', label: '不为空' },
                    ]}
                    width={120}
                    fontSize={13}
                  />
                  {f.operator !== 'isEmpty' && f.operator !== 'isNotEmpty' && (
                    <input
                      className="input"
                      value={f.value}
                      onChange={e => updateFilter(f.id, { value: e.target.value })}
                      placeholder="输入筛选值"
                      style={{ flex: 1, minWidth: 120, fontSize: 13, padding: '6px 10px' }}
                    />
                  )}
                  <button onClick={() => removeFilter(f.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      {!uploadedFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 16,
            transition: 'border-color 0.2s',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".shp,.dbf,.prj,.zip"
            multiple
            onChange={e => {
              if (e.target.files?.length) handleFile(Array.from(e.target.files))
            }}
            style={{ display: 'none' }}
          />
          <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>拖拽文件到此处，或点击上传</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            支持 .shp + .dbf + .prj 文件组，或 .zip 压缩包
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 14 }}>{progressMsg || '处理中...'}</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#ef4444', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Info bar */}
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileArchive size={16} />
                  {result.fileName}
                </strong>
                <span style={{ color: 'var(--text-dim)', fontSize: 13, marginLeft: 8 }}>
                  {tableData.length} 条要素 · 几何类型: {result.geometryType || 'Unknown'}
                  {filters.length > 0 && (
                    <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· 筛选后 {filteredData.length} 条</span>
                  )}
                  {selectedRows.size > 0 && (
                    <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· 已选 {selectedRows.size} 行</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Select
                  value={exportEncoding}
                  onChange={v => setExportEncoding(v)}
                  options={[
                    { value: 'GB18030', label: 'GB18030' },
                    { value: 'UTF-8', label: 'UTF-8' },
                    { value: 'GBK', label: 'GBK' },
                  ]}
                  width={120}
                  fontSize={13}
                />
                <Select
                  value={exportProjection}
                  onChange={v => setExportProjection(v)}
                  options={[
                    { value: 'WGS84', label: 'WGS84' },
                    { value: 'CGCS2000', label: 'CGCS2000' },
                    { value: 'GCJ02', label: 'GCJ02' },
                  ]}
                  width={120}
                  fontSize={13}
                />
                <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <Download size={14} /> {selectedRows.size > 0 ? `导出已选 (${selectedRows.size})` : '导出 Shapefile'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            data={filteredData}
            columns={tableColumns}
            virtualized
            rowHeight={ROW_HEIGHT}
            headerHeight={40}
            maxHeight={520}
            getRowStyle={(_, rowIndex) => {
              const isSelected = selectedRows.has(rowIndex)
              const isEven = rowIndex % 2 === 0
              const bg = isSelected
                ? 'rgba(var(--accent-rgb), 0.06)'
                : isEven
                  ? 'rgba(128,128,128,0.025)'
                  : 'transparent'
              return { background: bg }
            }}
          />

          {/* Toolbar below table */}
          {selectedRows.size > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={deleteSelected} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#ef4444', borderColor: '#ef4444' }}>
                <Trash2 size={14} /> 删除已选 ({selectedRows.size})
              </button>
            </div>
          )}

          {/* Pagination info */}
          {result.hasMore && (
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
              显示第 {result.page} 页，共 {result.totalPages} 页（{result.totalRows} 条），当前每页 {result.pageSize} 条
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}

const ROW_HEIGHT = 36
const COL_W_CHECK = 40
const COL_W_IDX = 50
const COL_W_DATA = 150
