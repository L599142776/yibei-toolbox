import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon as LeafletPolygon, Polyline, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import 'leaflet/dist/leaflet.css'

type Point = [number, number] // [lng, lat]

function MapClickHandler({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick })
  return null
}

export default function AreaCalculator() {
  const [points, setPoints] = useState<Point[]>([])
  const [mode, setMode] = useState<'draw' | 'input'>('draw')
  const [inputText, setInputText] = useState('')

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (mode !== 'draw') return
    setPoints(prev => [...prev, [e.latlng.lng, e.latlng.lat]])
  }

  const handleInputParse = () => {
    try {
      const pts: Point[] = inputText.trim().split('\n').map(line => {
        const parts = line.trim().split(/[,\s\t]+/).map(Number)
        if (parts.length < 2 || parts.some(isNaN)) throw new Error('格式错误')
        return [parts[0], parts[1]] as Point
      })
      setPoints(pts)
    } catch {
      alert('解析失败，请按 "经度,纬度" 格式每行一组输入')
    }
  }

  const undoLast = () => setPoints(prev => prev.slice(0, -1))
  const clearAll = () => { setPoints([]); setInputText('') }

  const liveResults = useMemo(() => {
    if (points.length < 3) return null
    const closed = [...points, points[0]]
    const poly = turf.polygon([closed])
    const area_m2 = turf.area(poly)
    const line = turf.lineString(closed)
    const perimeter_km = turf.length(line, { units: 'kilometers' })
    return {
      area_km2: area_m2 / 1e6,
      area_mu: area_m2 / 666.667,
      area_ha: area_m2 / 1e4,
      perimeter_km,
    }
  }, [points])

  const latLngs: LatLngExpression[] = points.map(p => [p[1], p[0]])

  const center: LatLngExpression = points.length > 0
    ? [points.reduce((s, p) => s + p[1], 0) / points.length, points.reduce((s, p) => s + p[0], 0) / points.length]
    : [35, 105]

  return (
    <ToolLayout title="多边形面积计算" description="在地图上点击绘制多边形，实时计算面积和周长">
      <div className="btn-group">
        <button className={`btn ${mode === 'draw' ? '' : 'btn-outline'}`} onClick={() => setMode('draw')}>🖊️ 地图绘制</button>
        <button className={`btn ${mode === 'input' ? '' : 'btn-outline'}`} onClick={() => setMode('input')}>📝 坐标输入</button>
        <button className="btn btn-outline" onClick={undoLast} disabled={points.length === 0}>↩️ 撤销</button>
        <button className="btn btn-outline" onClick={clearAll} disabled={points.length === 0}>🗑️ 清空</button>
      </div>

      {mode === 'input' && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="textarea"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={'每行输入一组坐标，格式：经度,纬度\n例如：\n116.397,39.908\n116.407,39.918\n116.417,39.908'}
            style={{ minHeight: 120, marginBottom: 8 }}
          />
          <button className="btn" onClick={handleInputParse}>解析并计算</button>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 450, marginBottom: 16 }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onClick={handleMapClick} />
          {latLngs.length >= 2 && <Polyline positions={latLngs} color="#6366f1" weight={2} dashArray="6" />}
          {latLngs.length >= 3 && <LeafletPolygon positions={latLngs} color="#6366f1" fillColor="#6366f1" fillOpacity={0.25} />}
        </MapContainer>
      </div>

      <div style={{ marginBottom: 12, color: 'var(--text-dim)', fontSize: 13 }}>
        已添加 <strong>{points.length}</strong> 个顶点
        {points.length > 0 && points.length < 3 && <span>（至少需要 3 个点才能计算面积）</span>}
      </div>

      {/* Results */}
      {liveResults && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12,
        }}>
          {[
            { label: '面积 (km²)', value: liveResults.area_km2.toFixed(6) },
            { label: '面积 (公顷)', value: liveResults.area_ha.toFixed(4) },
            { label: '面积 (亩)', value: liveResults.area_mu.toFixed(2) },
            { label: '周长 (km)', value: liveResults.perimeter_km.toFixed(4) },
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
      )}
    </ToolLayout>
  )
}
