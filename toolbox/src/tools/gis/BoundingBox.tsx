import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Rectangle, Polygon as LeafletPolygon, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import type { LatLngExpression, LeafletMouseEvent, LatLngBoundsLiteral } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import 'leaflet/dist/leaflet.css'

type Point = [number, number]

function MapClickHandler({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({ click: onClick })
  return null
}

export default function BoundingBox() {
  const [points, setPoints] = useState<Point[]>([])
  const [manualInput, setManualInput] = useState('')
  const [mode, setMode] = useState<'map' | 'input'>('map')

  const handleMapClick = (e: LeafletMouseEvent) => {
    if (mode !== 'map') return
    setPoints(prev => {
      if (prev.length >= 2) return [[e.latlng.lng, e.latlng.lat]]
      return [...prev, [e.latlng.lng, e.latlng.lat]]
    })
  }

  const handleInputParse = () => {
    try {
      const parts = manualInput.trim().split(/[,\s\t]+/).map(Number)
      if (parts.length === 4 && parts.every(v => !isNaN(v))) {
        // bbox format: minLng, minLat, maxLng, maxLat
        setPoints([
          [parts[0], parts[1]], // SW
          [parts[2], parts[3]], // NE
        ])
      } else {
        alert('请输入 bbox 格式：minLng,minLat,maxLng,maxLat')
      }
    } catch { /* ignore */ }
  }

  const bbox = useMemo(() => {
    if (points.length < 2) return null
    const fc = turf.featureCollection(points.map(p => turf.point(p)))
    const b = turf.bbox(fc)
    return { minLng: b[0], minLat: b[1], maxLng: b[2], maxLat: b[3] }
  }, [points])

  const outputs = useMemo(() => {
    if (!bbox) return {}
    const { minLng, minLat, maxLng, maxLat } = bbox
    const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
    const poly = turf.bboxPolygon([minLng, minLat, maxLng, maxLat])
    const area = turf.area(poly)

    return {
      'bbox (minLng, minLat, maxLng, maxLat)': `${minLng.toFixed(6)}, ${minLat.toFixed(6)}, ${maxLng.toFixed(6)}, ${maxLat.toFixed(6)}`,
      'SW (左下角)': `${minLat.toFixed(6)}, ${minLng.toFixed(6)}`,
      'NE (右上角)': `${maxLat.toFixed(6)}, ${maxLng.toFixed(6)}`,
      '中心点': `${center[1].toFixed(6)}, ${center[0].toFixed(6)}`,
      '宽度 (km)': turf.distance(turf.point([minLng, center[1]]), turf.point([maxLng, center[1]]), { units: 'kilometers' }).toFixed(4),
      '高度 (km)': turf.distance(turf.point([center[0], minLat]), turf.point([center[0], maxLat]), { units: 'kilometers' }).toFixed(4),
      '面积': area > 1e6 ? `${(area / 1e6).toFixed(4)} km²` : `${area.toFixed(2)} m²`,
      'GeoJSON Polygon': JSON.stringify(poly.geometry),
      'Leaflet bounds': `[[${minLat}, ${minLng}], [${maxLat}, ${maxLng}]]`,
      'Google Maps URL': `https://www.google.com/maps/@${center[1]},${center[0]},8z`,
    }
  }, [bbox])

  const bounds: LatLngBoundsLiteral | null = bbox
    ? [[bbox.minLat, bbox.minLng], [bbox.maxLat, bbox.maxLng]]
    : null

  const center: LatLngExpression = bbox
    ? [(bbox.minLat + bbox.maxLat) / 2, (bbox.minLng + bbox.maxLng) / 2]
    : [35, 105]

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <ToolLayout title="边界框工具" description="生成和可视化地理边界框 (Bounding Box)，支持多种格式输出">
      <div className="btn-group">
        <button className={`btn ${mode === 'map' ? '' : 'btn-outline'}`} onClick={() => setMode('map')}>🗺️ 地图选点</button>
        <button className={`btn ${mode === 'input' ? '' : 'btn-outline'}`} onClick={() => setMode('input')}>📝 输入 bbox</button>
        <button className="btn btn-outline" onClick={() => setPoints([])} disabled={points.length === 0}>🗑️ 清空</button>
      </div>

      {mode === 'input' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            className="input"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="minLng,minLat,maxLng,maxLat  例如: 116.0,39.5,117.0,40.5"
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={handleInputParse}>解析</button>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 400, marginBottom: 16 }}>
        <MapContainer center={center} zoom={bbox ? 8 : 4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onClick={handleMapClick} />
          {bounds && (
            <>
              <Rectangle bounds={bounds} color="#ef4444" weight={2} fillOpacity={0.1} />
              <LeafletPolygon
                positions={[
                  [bounds[0][0], bounds[0][1]],
                  [bounds[0][0], bounds[1][1]],
                  [bounds[1][0], bounds[1][1]],
                  [bounds[1][0], bounds[0][1]],
                ]}
                color="#ef4444"
                weight={2}
                fillOpacity={0.1}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
        {mode === 'map' ? '在地图上点击两个点（左下角和右上角）定义边界框' : `已选择 ${points.length} 个点`}
      </div>

      {/* Output formats */}
      {bbox && Object.keys(outputs).length > 0 && (
        <div>
          <div className="tool-label" style={{ marginBottom: 8 }}>输出格式</div>
          {Object.entries(outputs).map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 14,
              gap: 12,
            }}>
              <span style={{ color: 'var(--text-dim)', minWidth: 180, flexShrink: 0 }}>{k}</span>
              <code style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</code>
              <button
                onClick={() => copy(v)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                复制
              </button>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
