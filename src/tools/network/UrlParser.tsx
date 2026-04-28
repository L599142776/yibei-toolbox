// src/tools/network/UrlParser.tsx
import { useState, useMemo } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function UrlParser() {
  const [input, setInput] = useState('')

  const parsed = useMemo(() => {
    if (!input.trim()) return null
    try {
      const u = new URL(input)
      const params: [string, string][] = []
      u.searchParams.forEach((v, k) => params.push([k, v]))
      return {
        protocol: u.protocol,
        host: u.host,
        hostname: u.hostname,
        port: u.port || '(默认)',
        pathname: u.pathname,
        search: u.search || '(无)',
        hash: u.hash || '(无)',
        origin: u.origin,
        params,
      }
    } catch {
      return null
    }
  }, [input])

  return (
    <ToolLayout title="URL 解析器" description="解析 URL 各组成部分和查询参数">
      <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.com/path?foo=bar#hash" style={{ width: '100%' }} />
      {parsed && (
        <div style={{ marginTop: 16 }}>
          {[
            ['协议', parsed.protocol],
            ['主机', parsed.host],
            ['主机名', parsed.hostname],
            ['端口', parsed.port],
            ['路径', parsed.pathname],
            ['查询', parsed.search],
            ['锚点', parsed.hash],
            ['来源', parsed.origin],
          ].map(([label, val]) => (
            <div key={label as string} className="tool-row" style={{ justifyContent: 'space-between' }}>
              <span className="tool-label" style={{ width: 60 }}>{label}</span>
              <div className="tool-output" style={{ flex: 1, fontSize: 13 }}>{val as string}</div>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigator.clipboard.writeText(val as string)}>
                <Copy size={12} />
              </button>
            </div>
          ))}
          {parsed.params.length > 0 && (
            <>
              <hr className="tool-divider" />
              <span className="tool-label">查询参数 ({parsed.params.length})</span>
              <div className="tool-output" style={{ marginTop: 8, fontSize: 13 }}>
                {parsed.params.map(([k, v], i) => (
                  <div key={i} style={{ padding: '3px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)', minWidth: 100 }}>{k}</span>
                    <span>=</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {!parsed && input.trim() && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>⚠ 无效的 URL</div>}
    </ToolLayout>
  )
}
