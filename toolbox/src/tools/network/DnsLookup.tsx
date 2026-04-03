// src/tools/network/DnsLookup.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

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
      const data = await res.json()
      if (data.Answer) {
        setResults(data.Answer.map((a: any) => `${a.type === 1 ? 'A' : a.type === 28 ? 'AAAA' : a.type === 5 ? 'CNAME' : a.type === 15 ? 'MX' : a.type === 16 ? 'TXT' : a.type}: ${a.data}`))
      } else if (data.Authority) {
        setResults(['无直接记录，由以下 NS 负责:', ...data.Authority.map((a: any) => `${a.name} → ${a.data}`)])
      } else {
        setResults(['无结果'])
      }
    } catch (e: any) {
      setError(e.message)
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
