// src/tools/network/IpLookup.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

interface IpInfo {
  ip?: string
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  timezone?: string
  [key: string]: unknown
}

export default function IpLookup() {
  const [ip, setIp] = useState('')
  const [info, setInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    setLoading(true)
    setError('')
    setInfo(null)
    try {
      const url = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json'
      const res = await fetch(url)
      if (!res.ok) throw new Error('查询失败')
      const data: unknown = await res.json()
      if (typeof data === 'object' && data !== null) {
        setInfo(data as IpInfo)
      } else {
        setError('返回数据格式异常')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="IP 地址查询" description="查询 IP 地址的地理位置和运营商信息">
      <div className="tool-row">
        <input className="input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="输入 IP 地址 (留空查本机)" style={{ flex: 1 }} />
        <button className="btn" onClick={lookup} disabled={loading}>
          <Search size={16} /> {loading ? '查询中...' : '查询'}
        </button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      {info && (
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {[
            ['IP', info.ip],
            ['城市', info.city],
            ['地区', info.region],
            ['国家', info.country],
            ['坐标', info.loc],
            ['运营商', info.org],
            ['时区', info.timezone],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string} className="tool-row" style={{ justifyContent: 'space-between' }}>
              <span className="tool-label">{label}</span>
              <span>{value as string}</span>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
