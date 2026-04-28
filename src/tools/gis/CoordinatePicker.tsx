import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import TileLayerSelector from './TileLayerSelector'
import { OSM_TILE_URL } from './tianditu'
import type { TiandituConfig } from './tianditu'
import { Copy, Trash2, MapPin, Download, Target } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export interface Point {
  id: number
  lat: number
  lng: number
  timestamp: Date
}

type CoordFormat = 'decimal' | 'dms' | 'utm'

interface MapClickHandlerProps {
  onClick: (e: LeafletMouseEvent) => void
}

function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({ click: onClick })
  return null
}

// ============================================================
// Coordinate Conversion Functions
// ============================================================

function ddToDms(dd: number, isLat: boolean): string {
  const dir = isLat ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W')
  const abs = Math.abs(dd)
  const d = Math.floor(abs)
  const mFloat = (abs - d) * 60
  const m = Math.floor(mFloat)
  const s = ((mFloat - m) * 60).toFixed(2)
  return `${d}° ${m}' ${s}" ${dir}`
}

function wgs84ToUtm(lng: number, lat: number): { zone: string; easting: number; northing: number } {
  const zoneNumber = Math.floor((lng + 180) / 6) + 1
  const zoneLetter = getUtmZoneLetter(lat)
  const k0 = 0.9996
  const a = 6378137
  const f = 1 / 298.257223563
  const e = Math.sqrt(2 * f - f * f)
  const latRad = lat * Math.PI / 180
  const lngRad = lng * Math.PI / 180
  const lngOrigin = (zoneNumber - 1) * 6 - 177
  const lngOriginRad = lngOrigin * Math.PI / 180
  const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad))
  const T = Math.tan(latRad) * Math.tan(latRad)
  const C = (e * e / (1 - e * e)) * Math.cos(latRad) * Math.cos(latRad)
  const A = Math.cos(latRad) * (lngRad - lngOriginRad)
  const M = a * ((1 - e * e / 4 - 3 * e * e * e * e / 64) * latRad
    - (3 * e * e / 8 + 3 * e * e * e * e / 32) * Math.sin(2 * latRad)
    + (15 * e * e * e * e / 256) * Math.sin(4 * latRad))
  const easting = k0 * N * (A + (1 - T + C) * A * A * A / 6) + 500000
  let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24))
  if (lat < 0) northing += 10000000
  return {
    zone: `${zoneNumber}${zoneLetter}`,
    easting: parseFloat(easting.toFixed(2)),
    northing: parseFloat(northing.toFixed(2)),
  }
}

function getUtmZoneLetter(lat: number): string {
  const letters = 'CDEFGHJKLMNPQRSTUVWXX'
  if (lat >= -80 && lat <= 84) return letters[Math.floor((lat + 80) / 8)]
  return 'Z'
}

function formatCoordinate(lat: number, lng: number, format: CoordFormat): string {
  switch (format) {
    case 'decimal':
      return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`
    case 'dms':
      return `${ddToDms(lat, true)}, ${ddToDms(lng, false)}`
    case 'utm': {
      const utm = wgs84ToUtm(lng, lat)
      return `${utm.zone} E: ${utm.easting} N: ${utm.northing}`
    }
    default:
      return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`
  }
}

function formatCoordinateForDisplay(lat: number, lng: number, format: CoordFormat): { label: string; value: string } {
  switch (format) {
    case 'decimal':
      return {
        label: 'WGS84 (Decimal Degrees)',
        value: `${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`,
      }
    case 'dms':
      return {
        label: 'DMS (Degrees Minutes Seconds)',
        value: `${ddToDms(lat, true)}, ${ddToDms(lng, false)}`,
      }
    case 'utm': {
      const utm = wgs84ToUtm(lng, lat)
      return {
        label: 'UTM',
        value: `${utm.zone} E: ${utm.easting} N: ${utm.northing}`,
      }
    }
    default:
      return {
        label: 'WGS84',
        value: `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`,
      }
  }
}

// ============================================================
// Main Component
// ============================================================

export default function CoordinatePicker() {
  const [points, setPoints] = useState<Point[]>([])
  const [selectedFormat, setSelectedFormat] = useState<CoordFormat>('decimal')
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const [tileUrl, setTileUrl] = useState(OSM_TILE_URL)
  const [tileSubdomains, setTileSubdomains] = useState<string[]>(['a', 'b', 'c'])
  const [tileAttribution, setTileAttribution] = useState('')

  const handleTileConfig = useCallback((cfg: { url: string; subdomains: string[]; attribution: string; config: TiandituConfig }) => {
    setTileUrl(cfg.url)
    setTileSubdomains(cfg.subdomains)
    setTileAttribution(cfg.attribution)
  }, [])

  const handleMapClick = useCallback((e: LeafletMouseEvent) => {
    const newPoint: Point = {
      id: Date.now(),
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      timestamp: new Date(),
    }
    setPoints(prev => [...prev, newPoint])
    setSelectedPointId(newPoint.id)
  }, [])

  const handleMarkerClick = useCallback((pointId: number) => {
    setSelectedPointId(pointId)
  }, [])

  const handleRemovePoint = useCallback((e: React.MouseEvent, pointId: number) => {
    e.stopPropagation()
    setPoints(prev => prev.filter(p => p.id !== pointId))
    if (selectedPointId === pointId) {
      setSelectedPointId(null)
    }
  }, [selectedPointId])

  const handleClearAll = useCallback(() => {
    setPoints([])
    setSelectedPointId(null)
  }, [])

  const handleCopy = useCallback(async (point: Point, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const formatted = formatCoordinate(point.lat, point.lng, selectedFormat)
    await navigator.clipboard.writeText(formatted)
    setCopiedId(point.id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [selectedFormat])

  const handleCopyAll = useCallback(async () => {
    const allCoords = points
      .map(p => formatCoordinate(p.lat, p.lng, selectedFormat))
      .join('\n')
    await navigator.clipboard.writeText(allCoords)
  }, [points, selectedFormat])

  const handleExportGeoJSON = useCallback(() => {
    const geojson = {
      type: 'FeatureCollection',
      features: points.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
        properties: {
          id: p.id,
          timestamp: p.timestamp.toISOString(),
        },
      })),
    }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coordinates-${new Date().toISOString().slice(0, 10)}.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }, [points])

  const selectedPoint = points.find(p => p.id === selectedPointId)
  const mapCenter: [number, number] = selectedPoint
    ? [selectedPoint.lat, selectedPoint.lng]
    : points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng]
      : [39.9042, 116.4074] // Beijing

  const mapZoom = selectedPoint || points.length > 0 ? 12 : 4

  return (
    <ToolLayout title="地图坐标拾取" description="点击地图获取坐标，支持多种坐标系格式">
      {/* Map Layer Selector */}
      <TileLayerSelector onConfigChange={handleTileConfig} />

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12,
        padding: '8px 12px',
        background: 'var(--bg-input)',
        borderRadius: 8,
      }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>坐标格式：</span>
        {(['decimal', 'dms', 'utm'] as CoordFormat[]).map(fmt => (
          <button
            key={fmt}
            className={`btn ${selectedFormat === fmt ? '' : 'btn-outline'}`}
            onClick={() => setSelectedFormat(fmt)}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {fmt === 'decimal' ? 'Decimal' : fmt === 'dms' ? 'DMS' : 'UTM'}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className="btn btn-outline"
            onClick={handleCopyAll}
            disabled={points.length === 0}
            style={{ fontSize: 12, padding: '4px 10px' }}
            title="复制所有坐标"
          >
            <Copy size={14} style={{ marginRight: 4 }} />
            复制全部
          </button>
          <button
            className="btn btn-outline"
            onClick={handleExportGeoJSON}
            disabled={points.length === 0}
            style={{ fontSize: 12, padding: '4px 10px' }}
            title="导出为 GeoJSON"
          >
            <Download size={14} style={{ marginRight: 4 }} />
            导出 GeoJSON
          </button>
          <button
            className="btn btn-outline"
            onClick={handleClearAll}
            disabled={points.length === 0}
            style={{ fontSize: 12, padding: '4px 10px' }}
            title="清空所有标记"
          >
            <Trash2 size={14} style={{ marginRight: 4 }} />
            清空
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, minHeight: 500 }}>
        {/* Map */}
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', minHeight: 500 }}
            scrollWheelZoom
          >
            <TileLayer attribution={tileAttribution} url={tileUrl} subdomains={tileSubdomains} />
            <MapClickHandler onClick={handleMapClick} />
            {points.map(point => (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                eventHandlers={{
                  click: () => handleMarkerClick(point.id),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      <MapPin size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      点 #{point.id}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8, wordBreak: 'break-all' }}>
                      {formatCoordinateForDisplay(point.lat, point.lng, selectedFormat).value}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                      {point.timestamp.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn"
                        onClick={(e) => handleCopy(point, e)}
                        style={{ fontSize: 11, padding: '2px 8px', flex: 1 }}
                      >
                        <Copy size={12} style={{ marginRight: 4 }} />
                        {copiedId === point.id ? '已复制!' : '复制'}
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={(e) => handleRemovePoint(e, point.id)}
                        style={{ fontSize: 11, padding: '2px 8px', flex: 1 }}
                      >
                        <Trash2 size={12} style={{ marginRight: 4 }} />
                        删除
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 500,
          overflow: 'hidden',
        }}>
          {/* Selected Point Info */}
          {selectedPoint && (
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                fontWeight: 600,
              }}>
                <Target size={16} style={{ color: 'var(--accent)' }} />
                当前选中
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                  {formatCoordinateForDisplay(selectedPoint.lat, selectedPoint.lng, selectedFormat).label}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: 'var(--accent)',
                  wordBreak: 'break-all',
                }}>
                  {formatCoordinateForDisplay(selectedPoint.lat, selectedPoint.lng, selectedFormat).value}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn"
                  onClick={(e) => handleCopy(selectedPoint, e)}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  <Copy size={14} style={{ marginRight: 4 }} />
                  {copiedId === selectedPoint.id ? '已复制!' : '复制'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={(e) => handleRemovePoint(e, selectedPoint.id)}
                  style={{ flex: 1, fontSize: 12 }}
                >
                  <Trash2 size={14} style={{ marginRight: 4 }} />
                  删除
                </button>
              </div>
            </div>
          )}

          {/* Point History */}
          <div style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600 }}>
                <MapPin size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                坐标列表 ({points.length})
              </span>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 8,
            }}>
              {points.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-dim)',
                  padding: 24,
                  fontSize: 13,
                }}>
                  点击地图添加坐标点
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...points].reverse().map((point, idx) => (
                    <div
                      key={point.id}
                      onClick={() => setSelectedPointId(point.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: selectedPointId === point.id ? 'var(--accent-bg)' : 'transparent',
                        border: selectedPointId === point.id ? '1px solid var(--accent)' : '1px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: 11,
                        color: 'var(--text-dim)',
                        marginBottom: 2,
                      }}>
                        点 #{points.length - idx} • {point.timestamp.toLocaleTimeString()}
                      </div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: selectedPointId === point.id ? 'var(--accent)' : 'var(--text)',
                        wordBreak: 'break-all',
                      }}>
                        {formatCoordinate(point.lat, point.lng, selectedFormat)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: 12,
        padding: '8px 12px',
        background: 'var(--bg-input)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-dim)',
      }}>
        💡 点击地图添加坐标点 | 点击标记查看详情并复制 | 支持多种坐标格式切换
      </div>
    </ToolLayout>
  )
}
