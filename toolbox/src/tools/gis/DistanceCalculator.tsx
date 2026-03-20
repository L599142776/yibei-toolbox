import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import 'leaflet/dist/leaflet.css'

type Point = [number, number] // [lng, lat]

function MapClickHandler({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick })
  return null
}

export default function DistanceCalculator() {
  const [points, setPoints] = useState<Point[]>([])
  const [mode, setMode] = useState<'map' | 'input'>('map')
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')


  const handleMapClick = (e: LeafletMouseEvent) => {
    if (mode !== 'map') return
    setPoints(prev => {
      if (prev.length >= 2) return [[e.latlng.lng, e.latlng.lat]]
      return [...prev, [e.latlng.lng, e.latlng.lat]]
    })
  }

  const calcResults = useMemo(() => {
    if (points.length < 2) return null
    const from = turf.point(points[0])
    const to = turf.point(points[1])
    const direct_km = turf.distance(from, to, { units: 'kilometers' })
    const direct_mi = turf.distance(from, to, { units: 'miles' })
    const bearing = turf.bearing(from, to)
    const mid = turf.midpoint(from, to)

    // If more than 2 points, calculate path segments
    const segments: { km: number; bearing: number }[] = []
    if (points.length > 2) {
      for (let i = 0; i < points.length - 1; i++) {
        const a = turf.point(points[i])
        const b = turf.point(points[i + 1])
        segments.push({
          km: turf.distance(a, b, { units: 'kilometers' }),
          bearing: turf.bearing(a, b),
        })
      }
    }

    return {
      direct_km, direct_mi, bearing,
      midpoint: mid.geometry.coordinates as [number, number],
      segments,
    }
  }, [points])

  const handleInputCalc = () => {
    try {
      const parseCoord = (s: string): Point => {
        const parts = s.trim().split(/[,\s\t]+/).map(Number)
        if (parts.length < 2 || parts.some(isNaN)) throw new Error('')
        return [parts[0], parts[1]]
      }
      const a = parseCoord(inputA)
      const b = parseCoord(inputB)
      setPoints([a, b])
    } catch {
      alert('请输入 "经度,纬度" 格式')
    }
  }

  const latLngs: LatLngExpression[] = points.map(p => [p[1], p[0]])
  const center: LatLngExpression = points.length > 0
    ? [points.reduce((s, p) => s + p[1], 0) / points.length, points.reduce((s, p) => s + p[0], 0) / points.length]
    : [35, 105]

  return (
    <ToolLayout title="距离与方位计算" description="计算两点之间的大圆距离、方位角和中点">
      <div className="btn-group">
        <button className={`btn ${mode === 'map' ? '' : 'btn-outline'}`} onClick={() => setMode('map')}>🗺️ 地图选点</button>
        <button className={`btn ${mode === 'input' ? '' : 'btn-outline'}`} onClick={() => setMode('input')}>📝 坐标输入</button>
        <button className="btn btn-outline" onClick={() => setPoints([])} disabled={points.length === 0}>🗑️ 清空</button>
      </div>

      {mode === 'input' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="tool-label">起点 (经度,纬度)</div>
            <input className="input" value={inputA} onChange={e => setInputA(e.target.value)} placeholder="116.397,39.908" style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="tool-label">终点 (经度,纬度)</div>
            <input className="input" value={inputB} onChange={e => setInputB(e.target.value)} placeholder="121.473,31.230" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn" onClick={handleInputCalc}>计算</button>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 400, marginBottom: 16 }}>
        <MapContainer center={center} zoom={points.length > 0 ? 6 : 4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onClick={handleMapClick} />
          {latLngs.length >= 2 && <Polyline positions={latLngs} color="#ef4444" weight={3} />}
          {latLngs.map((ll, i) => (
            <Marker key={i} position={ll}>
              <Popup>{i === 0 ? '起点' : i === latLngs.length - 1 ? '终点' : `途经点 ${i}`}<br />坐标: {points[i][1].toFixed(6)}, {points[i][0].toFixed(6)}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
        {mode === 'map' ? '在地图上点击选择两个点，自动计算距离' : `已选择 ${points.length} 个点`}
      </div>

      {/* Results */}
      {calcResults && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { label: '直线距离 (km)', value: calcResults.direct_km.toFixed(4) },
            { label: '直线距离 (mi)', value: calcResults.direct_mi.toFixed(4) },
            { label: '方位角 (°)', value: calcResults.bearing.toFixed(2) },
            { label: '中点坐标', value: `${calcResults.midpoint[1].toFixed(6)}, ${calcResults.midpoint[0].toFixed(6)}` },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '16px', textAlign: 'center',
            }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
