import { useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon as LeafletPolygon, Polyline, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import DataTable from '../../components/DataTable'
import TileLayerSelector from './TileLayerSelector'
import { OSM_TILE_URL } from './tianditu'
import type { TiandituConfig } from './tianditu'
import 'leaflet/dist/leaflet.css'
import type { ColumnDef } from '@tanstack/react-table'

type Point = [number, number] // [lng, lat]

function MapClickHandler({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick })
  return null
}

// WKT 解析器：支持 POLYGON / MULTIPOLYGON
function parseWKT(wkt: string): { rings: Point[][]; error?: string } {
  const text = wkt.trim().toUpperCase()

  const polygonMatch = text.match(/^POLYGON\s*\(\s*(.+)\s*\)$/s)
  if (polygonMatch) {
    return parseWKTRings(polygonMatch[1])
  }

  const multiMatch = text.match(/^MULTIPOLYGON\s*\(\s*(.+)\s*\)$/s)
  if (multiMatch) {
    return parseMultiWKTRings(multiMatch[1])
  }

  const gcMatch = text.match(/^GEOMETRYCOLLECTION\s*\(\s*(.+)\s*\)$/s)
  if (gcMatch) {
    const polygonStrs = gcMatch[1].match(/POLYGON\s*\(\s*\([^)]+\)\s*\)/g)
    if (polygonStrs) {
      const allRings: Point[][] = []
      for (const ps of polygonStrs) {
        const inner = ps.match(/POLYGON\s*\(\s*(.+)\s*\)/s)
        if (inner) {
          const result = parseWKTRings(inner[1])
          if (result.error) return result
          allRings.push(...result.rings)
        }
      }
      return { rings: allRings }
    }
  }

  return { rings: [], error: '不支持的 WKT 类型，仅支持 POLYGON / MULTIPOLYGON' }
}

function parseWKTRings(ringStr: string): { rings: Point[][]; error?: string } {
  const rings: Point[][] = []
  const parts = ringStr.split(/\)\s*,\s*\(/)
  for (const part of parts) {
    const cleaned = part.replace(/[()]/g, '').trim()
    const coords = cleaned.split(',').map(pair => {
      const nums = pair.trim().split(/\s+/).map(Number)
      if (nums.length < 2 || nums.some(isNaN)) return null
      return [nums[0], nums[1]] as Point
    })
    if (coords.some(c => c === null)) {
      return { rings: [], error: '坐标格式错误，应为：POLYGON ((lng lat, lng lat, ...))' }
    }
    rings.push(coords as Point[])
  }
  return { rings }
}

function parseMultiWKTRings(str: string): { rings: Point[][]; error?: string } {
  const allRings: Point[][] = []
  const groups = str.match(/\(\s*\([^)]+\)\s*\)/g)
  if (!groups) return { rings: [], error: 'MULTIPOLYGON 格式错误' }
  for (const group of groups) {
    const inner = group.match(/\(\s*(.+)\s*\)/s)
    if (inner) {
      const result = parseWKTRings(inner[1])
      if (result.error) return result
      allRings.push(...result.rings)
    }
  }
  return { rings: allRings }
}

type InputMode = 'draw' | 'coord' | 'wkt'

export default function AreaCalculator() {
  const [points, setPoints] = useState<Point[]>([])
  const [wktRings, setWktRings] = useState<Point[][]>([])
  const [mode, setMode] = useState<InputMode>('draw')
  const [inputText, setInputText] = useState('')
  const [wktText, setWktText] = useState('')
  const [wktError, setWktError] = useState('')

  const [tileUrl, setTileUrl] = useState(OSM_TILE_URL)
  const [tileSubdomains, setTileSubdomains] = useState<string[]>(['a', 'b', 'c'])
  const [tileAttribution, setTileAttribution] = useState('')

  const handleTileConfig = useCallback((cfg: { url: string; subdomains: string[]; attribution: string; config: TiandituConfig }) => {
    setTileUrl(cfg.url)
    setTileSubdomains(cfg.subdomains)
    setTileAttribution(cfg.attribution)
  }, [])

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (mode !== 'draw') return
    setPoints(prev => [...prev, [e.latlng.lng, e.latlng.lat]])
    setWktRings([])
  }

  const handleCoordParse = () => {
    try {
      const pts: Point[] = inputText.trim().split('\n').map(line => {
        const parts = line.trim().split(/[,\s\t]+/).map(Number)
        if (parts.length < 2 || parts.some(isNaN)) throw new Error('格式错误')
        return [parts[0], parts[1]] as Point
      })
      setPoints(pts)
      setWktRings([])
    } catch {
      alert('解析失败，请按 "经度,纬度" 格式每行一组输入')
    }
  }

  const handleWKTParse = () => {
    setWktError('')
    const result = parseWKT(wktText)
    if (result.error) {
      setWktError(result.error)
      return
    }
    if (result.rings.length === 0) {
      setWktError('未解析到任何多边形')
      return
    }
    setWktRings(result.rings)
    setPoints(result.rings[0])
  }

  const undoLast = () => setPoints(prev => prev.slice(0, -1))
  const clearAll = () => { setPoints([]); setWktRings([]); setInputText(''); setWktText(''); setWktError('') }

  const allResults = useMemo(() => {
    const rings = wktRings.length > 0 ? wktRings : (points.length >= 3 ? [points] : [])
    if (rings.length === 0) return null

    let totalArea = 0
    let totalPerimeter = 0
    const details: { area_km2: number; perimeter_km: number; vertices: number }[] = []

    for (const ring of rings) {
      if (ring.length < 3) continue
      const closed = [...ring, ring[0]]
      const poly = turf.polygon([closed])
      totalArea += turf.area(poly)
      const line = turf.lineString(closed)
      totalPerimeter += turf.length(line, { units: 'kilometers' })
      details.push({
        area_km2: turf.area(poly) / 1e6,
        perimeter_km: turf.length(line, { units: 'kilometers' }),
        vertices: ring.length,
      })
    }

    return {
      total: {
        area_km2: totalArea / 1e6,
        area_mu: totalArea / 666.667,
        area_ha: totalArea / 1e4,
        perimeter_km: totalPerimeter,
      },
      details,
      polygonCount: details.length,
    }
  }, [points, wktRings])

  const displayRings = wktRings.length > 0 ? wktRings : (points.length >= 3 ? [points] : [])
  const allLatLngs: LatLngExpression[][] = displayRings.map(r => r.map(p => [p[1], p[0]]))

  const center: LatLngExpression = (() => {
    const allPts = displayRings.flat()
    if (allPts.length === 0) return [35, 105]
    return [
      allPts.reduce((s, p) => s + p[1], 0) / allPts.length,
      allPts.reduce((s, p) => s + p[0], 0) / allPts.length,
    ]
  })()

  const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']

  type DetailRow = { idx: number; color: string; vertices: number; areaKm2: string; areaMu: string; perimeterKm: string }

  const detailRows = useMemo<DetailRow[]>(() => {
    if (!allResults) return []
    return allResults.details.map((d, i) => ({
      idx: i + 1,
      color: COLORS[i % COLORS.length],
      vertices: d.vertices,
      areaKm2: d.area_km2.toFixed(6),
      areaMu: (d.area_km2 * 100 / 0.0666667).toFixed(2),
      perimeterKm: d.perimeter_km.toFixed(4),
    }))
  }, [COLORS, allResults])

  const detailColumns = useMemo<ColumnDef<DetailRow>[]>(() => {
    return [
      {
        accessorKey: 'idx',
        header: '#',
        size: 70,
        meta: { pin: 'left', align: 'center' },
        enableSorting: false,
        cell: ({ row, getValue }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: row.original.color }} />
            {String(getValue() ?? '')}
          </div>
        ),
      },
      { accessorKey: 'vertices', header: '顶点数', size: 90, enableSorting: false, meta: { align: 'center' } },
      { accessorKey: 'areaKm2', header: '面积 (km²)', size: 140, enableSorting: false, meta: { align: 'right' }, cell: ({ getValue }) => <span style={{ fontFamily: 'monospace' }}>{String(getValue() ?? '')}</span> },
      { accessorKey: 'areaMu', header: '面积 (亩)', size: 120, enableSorting: false, meta: { align: 'right' }, cell: ({ getValue }) => <span style={{ fontFamily: 'monospace' }}>{String(getValue() ?? '')}</span> },
      { accessorKey: 'perimeterKm', header: '周长 (km)', size: 120, enableSorting: false, meta: { align: 'right' }, cell: ({ getValue }) => <span style={{ fontFamily: 'monospace' }}>{String(getValue() ?? '')}</span> },
    ]
  }, [])

  return (
    <ToolLayout title="多边形面积计算" description="地图绘制 / 坐标输入 / WKT 导入，实时计算面积和周长">
      {/* 底图选择器 */}
      <TileLayerSelector onConfigChange={handleTileConfig} />

      <div className="btn-group">
        <button className={`btn ${mode === 'draw' ? '' : 'btn-outline'}`} onClick={() => setMode('draw')}>🖊️ 地图绘制</button>
        <button className={`btn ${mode === 'coord' ? '' : 'btn-outline'}`} onClick={() => setMode('coord')}>📝 坐标输入</button>
        <button className={`btn ${mode === 'wkt' ? '' : 'btn-outline'}`} onClick={() => setMode('wkt')}>📐 WKT 导入</button>
        <button className="btn btn-outline" onClick={undoLast} disabled={mode !== 'draw' || points.length === 0}>↩️ 撤销</button>
        <button className="btn btn-outline" onClick={clearAll}>🗑️ 清空</button>
      </div>

      {/* 坐标输入模式 */}
      {mode === 'coord' && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="textarea"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={'每行输入一组坐标，格式：经度,纬度\n例如：\n116.397,39.908\n116.407,39.918\n116.417,39.908'}
            style={{ minHeight: 120, marginBottom: 8 }}
          />
          <button className="btn" onClick={handleCoordParse}>解析并计算</button>
        </div>
      )}

      {/* WKT 输入模式 */}
      {mode === 'wkt' && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="textarea"
            value={wktText}
            onChange={e => setWktText(e.target.value)}
            placeholder={'输入 WKT 格式的多边形：\n\nPOLYGON ((116.3 39.9, 116.4 39.9, 116.4 40.0, 116.3 40.0, 116.3 39.9))\n\n或带洞的多边形：\nPOLYGON ((outer ring...), (hole...))\n\n或多个多边形：\nMULTIPOLYGON (((ring1...)), ((ring2...)))'}
            style={{ minHeight: 140, marginBottom: 8 }}
          />
          {wktError && (
            <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
              ⚠️ {wktError}
            </div>
          )}
          <button className="btn" onClick={handleWKTParse}>解析 WKT 并计算</button>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 450, marginBottom: 16 }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom key={JSON.stringify(center)}>
          <TileLayer attribution={tileAttribution} url={tileUrl} subdomains={tileSubdomains} />
          <MapClickHandler onClick={handleMapClick} />
          {allLatLngs.map((latLngs, idx) => (
            <div key={idx}>
              {latLngs.length >= 2 && <Polyline positions={latLngs} color={COLORS[idx % COLORS.length]} weight={2} dashArray="6" />}
              {latLngs.length >= 3 && (
                <LeafletPolygon
                  positions={latLngs}
                  color={COLORS[idx % COLORS.length]}
                  fillColor={COLORS[idx % COLORS.length]}
                  fillOpacity={0.2}
                />
              )}
            </div>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: 13 }}>
        {mode === 'draw' && (
          <>
            已添加 <strong>{points.length}</strong> 个顶点
            {points.length > 0 && points.length < 3 && <span>（至少需要 3 个点才能计算面积）</span>}
          </>
        )}
        {mode === 'wkt' && wktRings.length > 0 && (
          <>已解析 <strong>{wktRings.length}</strong> 个多边形，共 <strong>{wktRings.flat().length}</strong> 个顶点</>
        )}
        {mode === 'coord' && points.length > 0 && (
          <>已输入 <strong>{points.length}</strong> 个顶点</>
        )}
      </div>

      {/* Results */}
      {allResults && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16,
          }}>
            {[
              { label: `${allResults.polygonCount > 1 ? '总面积' : '面积'} (km²)`, value: allResults.total.area_km2.toFixed(6) },
              { label: `${allResults.polygonCount > 1 ? '总面积' : '面积'} (公顷)`, value: allResults.total.area_ha.toFixed(4) },
              { label: `${allResults.polygonCount > 1 ? '总面积' : '面积'} (亩)`, value: allResults.total.area_mu.toFixed(2) },
              { label: `${allResults.polygonCount > 1 ? '总周长' : '周长'} (km)`, value: allResults.total.perimeter_km.toFixed(4) },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '16px', textAlign: 'center',
              }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {allResults.details.length > 1 && (
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '16px' }}>
              <div className="tool-label" style={{ marginBottom: 8 }}>各多边形明细</div>
              <DataTable data={detailRows} columns={detailColumns} maxHeight={260} rowHeight={34} headerHeight={40} />
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
