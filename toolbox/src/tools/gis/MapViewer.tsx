import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import type { FeatureCollection, GeoJsonObject } from 'geojson'
import type { PathOptions } from 'leaflet'
import ToolLayout from '../../components/ToolLayout'
import TileLayerSelector from './TileLayerSelector'
import { OSM_TILE_URL } from './tianditu'
import type { TiandituConfig } from './tianditu'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon issue with bundlers
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316']

function StyleReset({ data }: { data: GeoJsonObject }) {
  const map = useMap()
  if (data) {
    const layer = L.geoJSON(data as FeatureCollection)
    try {
      map.fitBounds(layer.getBounds(), { padding: [40, 40] })
    } catch { /* ignore */ }
  }
  return null
}

export default function MapViewer() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState<{ features: number; types: string[] } | null>(null)
  const [layerName, setLayerName] = useState('')
  const [layers, setLayers] = useState<{ name: string; data: FeatureCollection; color: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tileUrl, setTileUrl] = useState(OSM_TILE_URL)
  const [tileSubdomains, setTileSubdomains] = useState<string[]>(['a', 'b', 'c'])
  const [tileAttribution, setTileAttribution] = useState('')

  const handleTileConfig = useCallback((cfg: { url: string; subdomains: string[]; attribution: string; config: TiandituConfig }) => {
    setTileUrl(cfg.url)
    setTileSubdomains(cfg.subdomains)
    setTileAttribution(cfg.attribution)
  }, [])

  const geoStyle = (layerIndex: number): PathOptions => ({
    color: COLORS[layerIndex % COLORS.length],
    weight: 2,
    fillColor: COLORS[layerIndex % COLORS.length],
    fillOpacity: 0.3,
  })

  const handleFile = useCallback(async (file: File) => {
    setError('')
    setFileName(file.name)
    const ext = file.name.split('.').pop()?.toLowerCase()

    try {
      let data: FeatureCollection

      if (ext === 'geojson' || ext === 'json') {
        const text = await file.text()
        const parsed = JSON.parse(text)
        data = parsed.type === 'FeatureCollection' ? parsed : { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: parsed, properties: {} }] }
      } else if (ext === 'zip' || ext === 'shp') {
        const shp = (await import('shpjs')).default
        const buf = await file.arrayBuffer()
        const result = await shp(buf)
        data = result as FeatureCollection
      } else if (ext === 'kml' || ext === 'gpx') {
        const text = await file.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/xml')
        if (ext === 'kml') {
          data = kmlToGeoJSON(doc)
        } else {
          data = gpxToGeoJSON(doc)
        }
      } else {
        setError(`不支持的文件格式: .${ext}。支持 .geojson/.json/.zip (Shapefile)/.kml/.gpx`)
        return
      }

      const types = [...new Set(data.features.map(f => f.geometry?.type || 'unknown'))]
      setGeoData(data)
      setInfo({ features: data.features.length, types })
      setLayerName(file.name.replace(/\.\w+$/, ''))
    } catch (e: unknown) {
      setError(`解析失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }, [])

  const addCurrentLayer = () => {
    if (!geoData) return
    setLayers(prev => [...prev, { name: layerName || `图层 ${prev.length + 1}`, data: geoData, color: COLORS[prev.length % COLORS.length] }])
    setGeoData(null)
    setFileName('')
    setInfo(null)
    setLayerName('')
  }

  const removeLayer = (idx: number) => {
    setLayers(prev => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const exportGeoJSON = () => {
    const data = layers.length > 0
      ? { type: 'FeatureCollection', features: layers.flatMap(l => l.data.features) }
      : geoData
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'map-data.geojson'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Simplified KML parser
  const kmlToGeoJSON = (doc: Document): FeatureCollection => {
    const features: GeoJSON.Feature[] = []
    const placemarks = doc.querySelectorAll('Placemark')
    placemarks.forEach(pm => {
      const name = pm.querySelector('name')?.textContent || ''
      const outer = pm.querySelector('outerBoundaryIs LinearRing coordinates')
      if (outer) {
        const coords = outer.textContent?.trim().split(/\s+/).map(c => {
          const [lng, lat] = c.split(',').map(Number)
          return [lng, lat] as [number, number]
        }) || []
        if (coords.length > 0) features.push({ type: 'Feature', properties: { name }, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } })
      }
      const line = pm.querySelector('LineString coordinates')
      if (line) {
        const coords = line.textContent?.trim().split(/\s+/).map(c => {
          const [lng, lat] = c.split(',').map(Number)
          return [lng, lat] as [number, number]
        }) || []
        features.push({ type: 'Feature', properties: { name }, geometry: { type: 'LineString', coordinates: coords } })
      }
      const point = pm.querySelector('Point coordinates')
      if (point) {
        const [lng, lat] = point.textContent?.trim().split(',').map(Number) || [0, 0]
        features.push({ type: 'Feature', properties: { name }, geometry: { type: 'Point', coordinates: [lng, lat] } })
      }
    })
    return { type: 'FeatureCollection', features }
  }

  // Simplified GPX parser
  const gpxToGeoJSON = (doc: Document): FeatureCollection => {
    const features: GeoJSON.Feature[] = []
    doc.querySelectorAll('trk').forEach(trk => {
      const name = trk.querySelector('name')?.textContent || ''
      const segments = trk.querySelectorAll('trkseg')
      segments.forEach(seg => {
        const coords: [number, number][] = []
        seg.querySelectorAll('trkpt').forEach(pt => {
          const lat = parseFloat(pt.getAttribute('lat') || '0')
          const lng = parseFloat(pt.getAttribute('lon') || '0')
          coords.push([lng, lat])
        })
        if (coords.length > 1) features.push({ type: 'Feature', properties: { name }, geometry: { type: 'LineString', coordinates: coords } })
      })
    })
    doc.querySelectorAll('wpt').forEach(wpt => {
      const name = wpt.querySelector('name')?.textContent || ''
      const lat = parseFloat(wpt.getAttribute('lat') || '0')
      const lng = parseFloat(wpt.getAttribute('lon') || '0')
      features.push({ type: 'Feature', properties: { name }, geometry: { type: 'Point', coordinates: [lng, lat] } })
    })
    return { type: 'FeatureCollection', features }
  }

  const allData: GeoJsonObject | null = layers.length > 0
    ? { type: 'FeatureCollection', features: layers.flatMap(l => l.data.features) } as FeatureCollection
    : geoData

  return (
    <ToolLayout title="地图文件解析与展示" description="在线解析 Shapefile / GeoJSON / KML / GPX 文件，可视化地图数据">
      {/* 底图选择器 */}
      <TileLayerSelector onConfigChange={handleTileConfig} />

      {/* Upload area */}
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
          marginBottom: '16px',
          transition: 'border-color 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json,.zip,.shp,.kml,.gpx"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <p style={{ fontSize: 16, marginBottom: 8 }}>📂 拖拽文件到此处，或点击上传</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          支持 .geojson / .json / .zip (Shapefile) / .kml / .gpx
        </p>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}

      {/* File info */}
      {fileName && info && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong>{fileName}</strong>
              <span style={{ color: 'var(--text-dim)', marginLeft: 12 }}>
                {info.features} 个要素 · {info.types.join(', ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={layerName}
                onChange={e => setLayerName(e.target.value)}
                placeholder="图层名称"
                style={{ width: 160 }}
              />
              <button className="btn" onClick={addCurrentLayer}>添加为图层</button>
              <button className="btn btn-outline" onClick={exportGeoJSON}>导出 GeoJSON</button>
            </div>
          </div>
        </div>
      )}

      {/* Layer list */}
      {layers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="tool-label">图层列表 ({layers.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {layers.map((l, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 13,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                {l.name}
                <button onClick={() => removeLayer(i)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', height: 500 }}>
        <MapContainer center={[35, 105]} zoom={4} style={{ height: '100%', width: '100%', background: '#1a1a2e' }} scrollWheelZoom>
          <TileLayer
            attribution={tileAttribution}
            url={tileUrl}
            subdomains={tileSubdomains}
          />
          {allData && (
            <>
              <StyleReset data={allData} />
              {layers.length > 0 ? (
                layers.map((l, i) => (
                  <GeoJSON key={i} data={l.data} style={() => geoStyle(i)} />
                ))
              ) : geoData ? (
                <GeoJSON data={geoData} style={() => geoStyle(0)} />
              ) : null}
            </>
          )}
        </MapContainer>
      </div>
    </ToolLayout>
  )
}
