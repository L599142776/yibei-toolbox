import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { FeatureCollection, Feature } from 'geojson'
import type { PathOptions } from 'leaflet'
import L from 'leaflet'
import { ShapefileParser } from '@microti/file-handler'
import type { ShapefileParseResult, ShapefileParserOptions } from '@microti/file-handler'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'
import DataTable from '../../components/DataTable'
import TileLayerSelector from './TileLayerSelector'
import { OSM_TILE_URL } from './tianditu'
import type { TiandituConfig } from './tianditu'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Upload, FileArchive, Loader2, RotateCcw, CheckSquare, Square,
  Filter, Plus, X, Download, ArrowUpDown,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// ── 常量 ──

const DEFAULT_COLOR = '#6366f1'
const HIGHLIGHT_COLOR = '#ef4444'
const ROW_HEIGHT = 36
const COL_W_IDX = 50
const COL_W_DATA = 150
const MIN_LEFT_WIDTH = 300
const MIN_RIGHT_WIDTH = 400
const DIVIDER_WIDTH = 6

// ── 筛选类型 ──

type FilterOp = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains' | 'isEmpty' | 'isNotEmpty'

interface FilterRule {
  id: string
  column: string
  operator: FilterOp
  value: string
}

// ── 地图点击处理器 ──

function MapClickHandler({ onClick }: { onClick: () => void }) {
  const map = useMap()
  useEffect(() => {
    map.on('click', onClick)
    return () => { map.off('click', onClick) }
  }, [map, onClick])
  return null
}

// ── 自动定位到选中要素 ──

function FitToFeature({ feature }: { feature: Feature | null }) {
  const map = useMap()
  useEffect(() => {
    if (!feature) return
    try {
      const layer = L.geoJSON(feature)
      map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 16 })
    } catch { /* ignore */ }
  }, [feature, map])
  return null
}

// ── 主组件 ──

export default function ShapefileExplorer() {
  // 解析状态
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // GeoJSON 数据
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)

  // 选中状态（双向联动核心）
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // 表格状态
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)

  // 分隔布局
  const [leftWidth, setLeftWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // 地图底图
  const [tileUrl, setTileUrl] = useState(OSM_TILE_URL)
  const [tileSubdomains, setTileSubdomains] = useState<string[]>(['a', 'b', 'c'])
  const [tileAttribution, setTileAttribution] = useState('')

  // 地图图层引用（用于手动更新样式）
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // ── 表头（排除几何字段）──

  const headers = useMemo(() => {
    if (!result?.headers) return []
    return result.headers.filter(h => h.prop !== 'GEOMETRY' && h.prop !== 'wkt' && h.prop !== 'wktType')
  }, [result])

  // ── 初始化分隔位置 ──

  useEffect(() => {
    if (containerRef.current && leftWidth === 0) {
      const w = containerRef.current.offsetWidth
      setLeftWidth(Math.floor(w * 0.5))
    }
  }, [leftWidth])

  // ── 底图配置 ──

  const handleTileConfig = useCallback((cfg: { url: string; subdomains: string[]; attribution: string; config: TiandituConfig }) => {
    setTileUrl(cfg.url)
    setTileSubdomains(cfg.subdomains)
    setTileAttribution(cfg.attribution)
  }, [])

  // ── 解析文件 ──

  const doParse = useCallback(async (files: File[], zip: boolean, enc: string) => {
    setLoading(true)
    setError('')
    setResult(null)
    setTableData([])
    setGeoData(null)
    setSelectedIdx(null)
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

      // 构建 GeoJSON FeatureCollection
      if (res.data?.length) {
        const features: Feature[] = []
        for (let i = 0; i < res.data.length; i++) {
          const row = res.data[i]
          const geomStr = row.GEOMETRY as string | undefined
          if (!geomStr) continue
          try {
            const geometry = JSON.parse(geomStr)
            // 过滤掉几何字段，只保留属性
            const properties: Record<string, unknown> = { _idx: i }
            for (const key of Object.keys(row)) {
              if (key !== 'GEOMETRY' && key !== 'wkt' && key !== 'wktType') {
                properties[key] = row[key]
              }
            }
            features.push({ type: 'Feature', geometry, properties })
          } catch { /* skip invalid geometry */ }
        }
        setGeoData({ type: 'FeatureCollection', features })
      }
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

  // ── 筛选 ──

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

  // ── 排序 ──

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData
    return [...filteredData].sort((a, b) => {
      const va = a[sortField]
      const vb = b[sortField]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      const na = Number(va), nb = Number(vb)
      let cmp: number
      if (!isNaN(na) && !isNaN(nb)) {
        cmp = na - nb
      } else {
        cmp = String(va).localeCompare(String(vb), 'zh-CN')
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [filteredData, sortField, sortDirection])

  // ── 分页 ──

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // ── 当前选中的 GeoJSON feature ──

  const selectedFeature = useMemo(() => {
    if (selectedIdx === null || !geoData) return null
    return geoData.features.find(f => f.properties?._idx === selectedIdx) ?? null
  }, [selectedIdx, geoData])

  // ── 地图高亮更新 ──

  useEffect(() => {
    const geoLayer = geoLayerRef.current
    if (!geoLayer) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers = (geoLayer as any)._layers as Record<string, L.Layer>
    if (!layers) return
    for (const key of Object.keys(layers)) {
      const child = layers[key]
      if (child instanceof L.Path) {
        const feature = (child as L.Layer & { feature?: Feature }).feature
        const idx = feature?.properties?._idx
        if (idx === selectedIdx) {
          child.setStyle({ color: HIGHLIGHT_COLOR, weight: 3, fillColor: HIGHLIGHT_COLOR, fillOpacity: 0.5 })
          child.bringToFront?.()
        } else {
          child.setStyle({ color: DEFAULT_COLOR, weight: 2, fillColor: DEFAULT_COLOR, fillOpacity: 0.3 })
        }
      }
    }
  }, [selectedIdx])

  // ── 地图点击 → 取消选中 ──

  const handleMapClick = useCallback(() => {
    setSelectedIdx(null)
  }, [])

  const handleFeatureClick = useCallback((feature: Feature, _layer: L.Layer) => {
    _layer.on('click', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e)
      const idx = feature.properties?._idx as number | undefined
      if (idx !== undefined) {
        setSelectedIdx(prev => prev === idx ? null : idx)
      }
    })
  }, [])

  // ── 表格行点击 → 选中要素 ──

  const handleRowClick = useCallback((rowIdx: number) => {
    const row = sortedData[rowIdx]
    if (!row) return
    const idx = row._idx as number | undefined
    if (idx !== undefined) {
      setSelectedIdx(prev => prev === idx ? null : idx)
      // 滚动到对应行
      const el = rowRefs.current.get(rowIdx)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [sortedData])

  // ── 导出 ──

  const handleExportGeoJSON = () => {
    if (!geoData) return
    const blob = new Blob([JSON.stringify(geoData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result?.fileName || 'export'}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportShapefile = async () => {
    const dataToExport = selectedRows.size > 0
      ? sortedData.filter((_, i) => selectedRows.has(i))
      : sortedData
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

  // ── 清除重置 ──

  const handleClear = () => {
    setResult(null)
    setTableData([])
    setGeoData(null)
    setError('')
    setUploadedFiles(null)
    setIsZipFile(false)
    setSelectedIdx(null)
    setSelectedRows(new Set())
    setEditingCell(null)
    setFilters([])
    setSortField('')
    setSortDirection('asc')
    setShowFilterPanel(false)
    setProgress(0)
    setProgressMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── 筛选操作 ──

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

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  // ── 行勾选 ──

  const toggleSelectAll = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(sortedData.map((_, i) => i)))
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

  // ── 单元格编辑 ──

  const startEdit = (rowIdx: number, col: string) => {
    setEditingCell({ row: rowIdx, col })
    setEditValue(String(sortedData[rowIdx][col] ?? ''))
  }

  const commitEdit = () => {
    if (!editingCell) return
    const origIdx = tableData.indexOf(sortedData[editingCell.row])
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

  // ── 分隔条拖拽 ──

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    const startX = e.clientX
    const startWidth = leftWidth

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth
      const diff = ev.clientX - startX
      const newWidth = Math.max(MIN_LEFT_WIDTH, Math.min(containerW - MIN_RIGHT_WIDTH - DIVIDER_WIDTH, startWidth + diff))
      setLeftWidth(newWidth)
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [leftWidth])

  // ── 表格列定义 ──

  const allSelected = sortedData.length > 0 && selectedRows.size === sortedData.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < sortedData.length

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
        size: 40,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
      },
      {
        id: '__idx__',
        header: '#',
        cell: ({ row }) => {
          const origIdx = (row.original as Record<string, unknown>)._idx as number | undefined
          const displayIdx = origIdx !== undefined ? origIdx + 1 : row.index + 1
          const isSelected = origIdx !== undefined && origIdx === selectedIdx
          return (
            <span
              style={{
                color: isSelected ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: 12,
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
              }}
              onClick={() => handleRowClick(row.index)}
            >
              {displayIdx}
            </span>
          )
        },
        size: COL_W_IDX,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
      },
      ...headers.map((h) => ({
        accessorKey: h.prop,
        header: h.label,
        cell: ({ row, getValue }: { row: { index: number; original: Record<string, unknown> }; getValue: () => unknown }) => {
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
  }, [allSelected, someSelected, selectedRows, toggleSelectAll, toggleSelectRow, headers, editingCell, editValue, selectedIdx, handleRowClick, startEdit, commitEdit, cancelEdit])

  // ── 行样式（选中高亮）──

  const getRowStyle = useCallback((row: { original: Record<string, unknown> }, rowIndex: number) => {
    const origIdx = row.original._idx as number | undefined
    const isMapSelected = origIdx !== undefined && origIdx === selectedIdx
    const isRowSelected = selectedRows.has(rowIndex)
    const isEven = rowIndex % 2 === 0

    if (isMapSelected) {
      return { background: 'rgba(var(--accent-rgb), 0.15)', cursor: 'pointer' }
    }
    if (isRowSelected) {
      return { background: 'rgba(var(--accent-rgb), 0.06)', cursor: 'pointer' }
    }
    return {
      background: isEven ? 'rgba(128,128,128,0.025)' : 'transparent',
      cursor: 'pointer',
    }
  }, [selectedIdx, selectedRows])

  // ── GeoJSON 样式 ──

  const geoStyle = useCallback((): PathOptions => ({
    color: DEFAULT_COLOR,
    weight: 2,
    fillColor: DEFAULT_COLOR,
    fillOpacity: 0.3,
  }), [])

  // ── 渲染 ──

  return (
    <ToolLayout title="Shapefile 地图数据浏览器" description="解析 Shapefile 文件，地图与属性表双向联动浏览">
      {/* 工具栏 */}
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
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, borderColor: filters.length > 0 ? 'var(--accent)' : undefined }}
            >
              <Filter size={14} /> 筛选 {filters.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, lineHeight: '18px' }}>{filters.length}</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={14} style={{ color: sortField ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }} />
              <Select
                value={sortField}
                onChange={v => { setSortField(v); setCurrentPage(1) }}
                options={[
                  { value: '', label: '不排序' },
                  ...headers.map(h => ({ value: h.prop, label: h.label })),
                ]}
                width={130}
                fontSize={13}
              />
              {sortField && (
                <button
                  className="btn btn-outline"
                  onClick={toggleSortDirection}
                  style={{ padding: '4px 8px', fontSize: 12, minWidth: 42 }}
                  title={sortDirection === 'asc' ? '当前：升序，点击切换为降序' : '当前：降序，点击切换为升序'}
                >
                  {sortDirection === 'asc' ? '↑ 升序' : '↓ 降序'}
                </button>
              )}
            </div>
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
            <button className="btn btn-outline" onClick={handleExportGeoJSON} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <Download size={14} /> GeoJSON
            </button>
            <button className="btn btn-outline" onClick={handleExportShapefile} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <Download size={14} /> {selectedRows.size > 0 ? `导出已选 (${selectedRows.size})` : 'Shapefile'}
            </button>
            <button className="btn btn-outline" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RotateCcw size={14} /> 清除重置
            </button>
          </>
        )}
      </div>

      {/* 筛选面板 */}
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

      {/* 上传区域 */}
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

      {/* 加载进度 */}
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

      {/* 错误提示 */}
      {error && (
        <div style={{ color: '#ef4444', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* 信息栏 */}
      {result && (
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
                {sortField && (
                  <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· 按 {headers.find(h => h.prop === sortField)?.label || sortField} {sortDirection === 'asc' ? '升序' : '降序'}</span>
                )}
                {selectedIdx !== null && (
                  <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· 已选中第 {selectedIdx + 1} 条</span>
                )}
                {selectedRows.size > 0 && (
                  <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· 已勾选 {selectedRows.size} 行</span>
                )}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              <TileLayerSelector onConfigChange={handleTileConfig} />
            </div>
          </div>
        </div>
      )}

      {/* 地图 + 属性表 分屏 */}
      {geoData && (
        <>
          <div
            ref={containerRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `${leftWidth}px ${DIVIDER_WIDTH}px 1fr`,
              gap: 0,
              height: 600,
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              marginBottom: 12,
            }}
          >
            {/* 左侧：地图 */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <MapContainer
                center={[35, 105]}
                zoom={4}
                style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution={tileAttribution}
                  url={tileUrl}
                  subdomains={tileSubdomains}
                />
                <MapClickHandler onClick={handleMapClick} />
                {selectedFeature && <FitToFeature feature={selectedFeature} />}
                <GeoJSON
                  key={`geo-${geoData.features.length}`}
                  data={geoData}
                  style={geoStyle}
                  onEachFeature={handleFeatureClick}
                  ref={(instance) => { geoLayerRef.current = instance as unknown as L.GeoJSON }}
                />
              </MapContainer>
            </div>

            {/* 分隔条 */}
            <div
              onMouseDown={handleDividerMouseDown}
              style={{
                background: 'var(--border)',
                cursor: 'col-resize',
                transition: isDraggingRef.current ? 'none' : 'background 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
            />

            {/* 右侧：属性表 */}
            <div style={{ overflow: 'auto', background: 'var(--bg)' }}>
              <DataTable
                data={paginatedData}
                columns={tableColumns}
                virtualized
                rowHeight={ROW_HEIGHT}
                headerHeight={40}
                maxHeight={600}
                getRowStyle={getRowStyle}
              />
            </div>
          </div>

          {/* 分页控件 */}
          {sortedData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                <span>每页</span>
                <Select
                  value={String(pageSize)}
                  onChange={v => { setPageSize(Number(v)); setCurrentPage(1) }}
                  options={[
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: '200', label: '200' },
                    { value: '500', label: '500' },
                  ]}
                  width={70}
                  fontSize={13}
                />
                <span>条</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '4px 8px', fontSize: 13 }}
                >
                  上一页
                </button>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '4px 8px', fontSize: 13 }}
                >
                  下一页
                </button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                共 {sortedData.length} 条
              </div>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
