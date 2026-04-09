// src/tools/network/DnsLookup.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'

// 使用 DNS over HTTPS (Google/Cloudflare)
export default function DnsLookup() {
  const [domain, setDomain] = useState('')
  const [type, setType] = useState('A')
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`)
      const raw: unknown = await res.json()
      const data = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {}
      const answer = Array.isArray(data.Answer) ? data.Answer : null
      const authority = Array.isArray(data.Authority) ? data.Authority : null

      if (answer) {
        setResults(answer.map((item) => {
          const a = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
          const typeNum = typeof a.type === 'number' ? a.type : Number(a.type)
          const dataStr = typeof a.data === 'string' ? a.data : String(a.data ?? '')
          const typeLabel =
            typeNum === 1 ? 'A'
              : typeNum === 28 ? 'AAAA'
                : typeNum === 5 ? 'CNAME'
                  : typeNum === 15 ? 'MX'
                    : typeNum === 16 ? 'TXT'
                      : String(a.type ?? typeNum)
          return `${typeLabel}: ${dataStr}`
        }))
      } else if (authority) {
        setResults([
          '无直接记录，由以下 NS 负责:',
          ...authority.map((item) => {
            const a = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
            const name = typeof a.name === 'string' ? a.name : String(a.name ?? '')
            const dataStr = typeof a.data === 'string' ? a.data : String(a.data ?? '')
            return `${name} → ${dataStr}`
          }),
        ])
      } else {
        setResults(['无结果'])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout title="DNS 查询" description="通过 DNS over HTTPS 查询域名解析记录">
      <div className="tool-row">
        <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" style={{ flex: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && lookup()} />
        <Select
          value={type}
          onChange={v => setType(v)}
          options={[
            { value: 'A', label: 'A' },
            { value: 'AAAA', label: 'AAAA' },
            { value: 'CNAME', label: 'CNAME' },
            { value: 'MX', label: 'MX' },
            { value: 'TXT', label: 'TXT' },
            { value: 'NS', label: 'NS' },
          ]}
        />
        <button className="btn" onClick={lookup} disabled={loading}><Search size={16} /> 查询</button>
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      {results.length > 0 && (
        <div className="tool-output" style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 13 }}>
          {results.map((r, i) => <div key={i} style={{ padding: '4px 0' }}>{r}</div>)}
        </div>
      )}
    </ToolLayout>
  )
}
