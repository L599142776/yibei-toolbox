import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon, LineString, MultiLineString } from 'geojson'
import type { PathOptions } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import 'leaflet/dist/leaflet.css'

const SAMPLE: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: '示例多边形' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [116.3, 39.9], [116.4, 39.9], [116.4, 40.0], [116.3, 40.0], [116.3, 39.9],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { name: '示例点' },
      geometry: { type: 'Point', coordinates: [116.397, 39.908] },
    },
    {
      type: 'Feature',
      properties: { name: '示例线' },
      geometry: {
        type: 'LineString',
        coordinates: [[116.3, 39.95], [116.35, 39.92], [116.4, 39.95]],
      },
    },
  ],
}

export default function GeoJsonEditor() {
  const [input, setInput] = useState(JSON.stringify(SAMPLE, null, 2))
  const [geoData, setGeoData] = useState<FeatureCollection | null>(SAMPLE)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<string[]>([])
  const [format, setFormat] = useState<'pretty' | 'compact'>('pretty')

  const analyze = useCallback((data: FeatureCollection): string[] => {
    const s: string[] = []
    s.push(`要素总数: ${data.features.length}`)

    const typeCount: Record<string, number> = {}
    data.features.forEach(f => {
      const t = f.geometry?.type || 'unknown'
      typeCount[t] = (typeCount[t] || 0) + 1
    })
    Object.entries(typeCount).forEach(([t, c]) => s.push(`  ${t}: ${c}`))

    // Properties analysis
    const allProps = new Set<string>()
    data.features.forEach(f => Object.keys(f.properties || {}).forEach(k => allProps.add(k)))
    if (allProps.size > 0) s.push(`属性字段: ${[...allProps].join(', ')}`)

    // Bounding box
    try {
      const bbox = turf.bbox(data)
      s.push(`范围: [${bbox.map(v => v.toFixed(4)).join(', ')}]`)
    } catch { /* ignore */ }

    // Total area for polygons
    try {
      const polygons = data.features.filter(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
      if (polygons.length > 0) {
        const fc = turf.featureCollection(polygons as Feature<Polygon | MultiPolygon>[])
        const area = turf.area(fc)
        s.push(`多边形总面积: ${area > 1e6 ? (area / 1e6).toFixed(4) + ' km²' : area.toFixed(2) + ' m²'}`)
      }
    } catch { /* ignore */ }

    // Total length for lines
    try {
      const lines = data.features.filter(f => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
      if (lines.length > 0) {
        const fc = turf.featureCollection(lines as Feature<LineString | MultiLineString>[])
        const len = turf.length(fc, { units: 'kilometers' })
        s.push(`线要素总长度: ${len.toFixed(4)} km`)
      }
    } catch { /* ignore */ }

    return s
  }, [])

  const handleParse = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const data: FeatureCollection = parsed.type === 'FeatureCollection'
        ? parsed
        : { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: parsed, properties: {} }] }
      setGeoData(data)
      setError('')
      setStats(analyze(data))
    } catch (e: unknown) {
      setError(`JSON 解析错误: ${e instanceof Error ? e.message : '未知错误'}`)
      setGeoData(null)
      setStats([])
    }
  }, [input, analyze])

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed, null, format === 'pretty' ? 2 : undefined))
    } catch { /* ignore */ }
  }

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed))
    } catch { /* ignore */ }
  }

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(input)
      const data = parsed.type === 'FeatureCollection' ? parsed : { type: 'FeatureCollection', features: [parsed] }
      // Check each feature geometry validity
      let issues = 0
      data.features.forEach((f: { geometry?: Geometry }, i: number) => {
        if (!f.geometry) { console.warn(`Feature ${i}: missing geometry`); issues++ }
        if (f.geometry?.type === 'Polygon') {
          const coords = (f.geometry as { coordinates: number[][][] }).coordinates
          coords.forEach((ring: number[][], j: number) => {
            if (ring.length < 4) { console.warn(`Feature ${i}, ring ${j}: less than 4 points`); issues++ }
            const first = ring[0]
            const last = ring[ring.length - 1]
            if (first[0] !== last[0] || first[1] !== last[1]) { console.warn(`Feature ${i}, ring ${j}: ring not closed`); issues++ }
          })
        }
      })
      if (issues === 0) alert('✅ GeoJSON 有效，无问题')
      else alert(`⚠️ 发现 ${issues} 个问题，请查看控制台`)
    } catch (e: unknown) {
      alert(`❌ 无效 JSON: ${e instanceof Error ? e.message : ''}`)
    }
  }

  const handleExport = () => {
    const blob = new Blob([input], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'geojson-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const addPolygonTemplate = () => {
    const template = {
      type: 'Feature', properties: { name: '新多边形' },
      geometry: { type: 'Polygon', coordinates: [[[116, 39], [117, 39], [117, 40], [116, 40], [116, 39]]] },
    }
    try {
      const parsed = JSON.parse(input)
      if (parsed.type === 'FeatureCollection') {
        parsed.features.push(template)
        setInput(JSON.stringify(parsed, null, 2))
      }
    } catch { /* ignore */ }
  }

  const geoStyle = (): PathOptions => ({
    color: '#6366f1', weight: 2, fillColor: '#6366f1', fillOpacity: 0.3,
  })

  return (
    <ToolLayout title="GeoJSON 编辑器" description="编辑、验证、分析 GeoJSON 数据，实时地图预览">
      <div className="btn-group">
        <button className="btn" onClick={handleParse}>🔍 解析</button>
        <button className="btn btn-outline" onClick={handleValidate}>✅ 验证</button>
        <button className="btn btn-outline" onClick={() => { setFormat(f => f === 'pretty' ? 'compact' : 'pretty'); handleFormat() }}>
          {format === 'pretty' ? '📦 压缩' : '📄 格式化'}
        </button>
        <button className="btn btn-outline" onClick={handleMinify}>⚡ 最小化</button>
        <button className="btn btn-outline" onClick={addPolygonTemplate}>➕ 多边形模板</button>
        <button className="btn btn-outline" onClick={handleExport}>💾 导出</button>
        <button className="btn btn-outline" onClick={() => { setInput(JSON.stringify(SAMPLE, null, 2)); handleParse() }}>📋 示例</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Editor */}
        <div>
          <div className="tool-label">GeoJSON 编辑区</div>
          <textarea
            className="textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ minHeight: 380, fontSize: 13 }}
            spellCheck={false}
          />
        </div>
        {/* Preview */}
        <div>
          <div className="tool-label">地图预览</div>
          <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 380 }}>
            <MapContainer center={[39.9, 116.4]} zoom={8} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {geoData && <GeoJSON data={geoData} style={geoStyle} />}
            </MapContainer>
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {stats.length > 0 && (
        <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '16px' }}>
          <div className="tool-label" style={{ marginBottom: 8 }}>数据统计</div>
          {stats.map((s, i) => (
            <div key={i} style={{ fontSize: 14, padding: '2px 0', color: s.startsWith('  ') ? 'var(--text-dim)' : 'var(--text)' }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
