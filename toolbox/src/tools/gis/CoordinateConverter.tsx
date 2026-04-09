import { useState, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'

// WGS84 → GCJ-02 (火星坐标) 偏移算法
function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat]
  const d = delta(lng, lat)
  return [lng + d[0], lat + d[1]]
}

function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat]
  const d = delta(lng, lat)
  return [lng - d[0], lat - d[1]]
}

// WGS84 → BD-09 (百度坐标)
function wgs84ToBd09(lng: number, lat: number): [number, number] {
  const gcj = wgs84ToGcj02(lng, lat)
  return gcj02ToBd09(gcj[0], gcj[1])
}

function bd09ToWgs84(lng: number, lat: number): [number, number] {
  const gcj = bd09ToGcj02(lng, lat)
  return gcj02ToWgs84(gcj[0], gcj[1])
}

function gcj02ToBd09(lng: number, lat: number): [number, number] {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * Math.PI * 3000 / 180)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * Math.PI * 3000 / 180)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]
}

function bd09ToGcj02(lng: number, lat: number): [number, number] {
  const x = lng - 0.0065, y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI * 3000 / 180)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI * 3000 / 180)
  return [z * Math.cos(theta), z * Math.sin(theta)]
}

function delta(lng: number, lat: number): [number, number] {
  const a = 6378245.0
  const ee = Number('0.00669342162296594323')
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * Math.PI
  let magic = Math.sin(radLat)
  magic = 1 - ee * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
  return [dLng, dLat]
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

// WGS84 ↔ Web Mercator (EPSG:3857)
function wgs84ToMercator(lng: number, lat: number): [number, number] {
  const x = lng * 20037508.34 / 180
  let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)
  y = y * 20037508.34 / 180
  return [x, y]
}

// WGS84 ↔ UTM (简化版)
function wgs84ToUtm(lng: number, lat: number): string {
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
  const northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24))
  return `${zoneNumber}${zoneLetter} E: ${easting.toFixed(2)} N: ${northing.toFixed(2)}`
}

function getUtmZoneLetter(lat: number): string {
  const letters = 'CDEFGHJKLMNPQRSTUVWXX'
  if (lat >= -80 && lat <= 84) return letters[Math.floor((lat + 80) / 8)]
  return 'Z'
}

// Decimal Degrees ↔ DMS
function ddToDms(dd: number, isLat: boolean): string {
  const dir = isLat ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W')
  const abs = Math.abs(dd)
  const d = Math.floor(abs)
  const mFloat = (abs - d) * 60
  const m = Math.floor(mFloat)
  const s = ((mFloat - m) * 60).toFixed(4)
  return `${d}° ${m}' ${s}" ${dir}`
}

type System = 'wgs84' | 'gcj02' | 'bd09' | 'mercator'

export default function CoordinateConverter() {
  const [lng, setLng] = useState('116.397428')
  const [lat, setLat] = useState('39.907445')
  const [results, setResults] = useState<Record<string, string>>({})

  const convert = useCallback(() => {
    const nLng = parseFloat(lng)
    const nLat = parseFloat(lat)
    if (isNaN(nLng) || isNaN(nLat)) { alert('请输入有效坐标'); return }

    const gcj = wgs84ToGcj02(nLng, nLat)
    const bd = wgs84ToBd09(nLng, nLat)
    const merc = wgs84ToMercator(nLng, nLat)
    const utm = wgs84ToUtm(nLng, nLat)

    setResults({
      'WGS84 (GPS)': `${nLng.toFixed(8)}, ${nLat.toFixed(8)}`,
      'GCJ-02 (高德/腾讯)': `${gcj[0].toFixed(8)}, ${gcj[1].toFixed(8)}`,
      'BD-09 (百度)': `${bd[0].toFixed(8)}, ${bd[1].toFixed(8)}`,
      'Web Mercator (m)': `${merc[0].toFixed(2)}, ${merc[1].toFixed(2)}`,
      'UTM': utm,
      'DMS (度分秒)': `${ddToDms(nLng, false)}  ${ddToDms(nLat, true)}`,
    })
  }, [lng, lat])

  // Batch convert
  const [batchInput, setBatchInput] = useState('')
  const [batchOutput, setBatchOutput] = useState('')
  const [batchFrom, setBatchFrom] = useState<System>('gcj02')
  const [batchTo, setBatchTo] = useState<System>('wgs84')

  const batchConvert = () => {
    const lines = batchInput.trim().split('\n')
    const results: string[] = []
    for (const line of lines) {
      const parts = line.trim().split(/[,\s\t]+/).map(Number)
      if (parts.length < 2 || parts.some(isNaN)) { results.push(`ERROR: ${line}`); continue }
      let p: [number, number] = [parts[0], parts[1]]
      // Convert from source to WGS84
      if (batchFrom === 'gcj02') p = gcj02ToWgs84(p[0], p[1])
      else if (batchFrom === 'bd09') p = bd09ToWgs84(p[0], p[1])
      // Convert from WGS84 to target
      if (batchTo === 'gcj02') p = wgs84ToGcj02(p[0], p[1])
      else if (batchTo === 'bd09') p = wgs84ToBd09(p[0], p[1])
      results.push(`${p[0].toFixed(8)}, ${p[1].toFixed(8)}`)
    }
    setBatchOutput(results.join('\n'))
  }

  return (
    <ToolLayout title="坐标系转换" description="WGS84 / GCJ-02 / BD-09 / Mercator / UTM 坐标互转">
      {/* Single point */}
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>单点转换（输入 WGS84 坐标）</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="tool-label">经度 (Longitude)</div>
          <input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder="116.397428" />
        </div>
        <div>
          <div className="tool-label">纬度 (Latitude)</div>
          <input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder="39.907445" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn" onClick={convert}>转换</button>
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          {Object.entries(results).map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 14,
            }}>
              <span style={{ color: 'var(--text-dim)', minWidth: 160 }}>{k}</span>
              <code style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{v}</code>
            </div>
          ))}
        </div>
      )}

      <hr className="tool-divider" />

      {/* Batch convert */}
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>批量坐标转换</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div className="tool-label">源坐标系</div>
          <Select
            value={batchFrom}
            onChange={v => setBatchFrom(v as System)}
            options={[
              { value: 'wgs84', label: 'WGS84' },
              { value: 'gcj02', label: 'GCJ-02 (高德)' },
              { value: 'bd09', label: 'BD-09 (百度)' },
            ]}
          />
        </div>
        <span style={{ color: 'var(--text-dim)', fontSize: 20, alignSelf: 'flex-end', paddingBottom: 10 }}>→</span>
        <div>
          <div className="tool-label">目标坐标系</div>
          <Select
            value={batchTo}
            onChange={v => setBatchTo(v as System)}
            options={[
              { value: 'wgs84', label: 'WGS84' },
              { value: 'gcj02', label: 'GCJ-02 (高德)' },
              { value: 'bd09', label: 'BD-09 (百度)' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn" onClick={batchConvert}>批量转换</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="tool-label">输入（每行一个：经度,纬度）</div>
          <textarea className="textarea" value={batchInput} onChange={e => setBatchInput(e.target.value)}
            placeholder="116.397,39.908&#10;121.473,31.230" style={{ minHeight: 120 }} />
        </div>
        <div>
          <div className="tool-label">输出</div>
          <textarea className="textarea" value={batchOutput} readOnly
            style={{ minHeight: 120, color: 'var(--accent)' }} />
        </div>
      </div>
    </ToolLayout>
  )
}
