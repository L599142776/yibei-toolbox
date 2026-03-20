// src/tools/network/HttpTester.tsx
import { useState } from 'react'
import { Send } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export default function HttpTester() {
  const [url, setUrl] = useState('https://httpbin.org/get')
  const [method, setMethod] = useState<Method>('GET')
  const [headers, setHeaders] = useState('')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<{ status: number; statusText: string; headers: string; body: string; time: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setLoading(true)
    setError('')
    setResponse(null)
    const start = performance.now()
    try {
      const hdrs: Record<string, string> = {}
      if (headers.trim()) {
        headers.split('\n').forEach((line) => {
          const [k, ...v] = line.split(':')
          if (k && v.length) hdrs[k.trim()] = v.join(':').trim()
        })
      }
      const opts: RequestInit = { method, headers: hdrs }
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        opts.body = body
        if (!hdrs['Content-Type']) hdrs['Content-Type'] = 'application/json'
      }
      const res = await fetch(url, opts)
      const text = await res.text()
      const hdrStr = Array.from(res.headers.entries()).map(([k, v]) => `${k}: ${v}`).join('\n')
      setResponse({ status: res.status, statusText: res.statusText, headers: hdrStr, body: text, time: Math.round(performance.now() - start) })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = response ? (response.status < 300 ? '#10b981' : response.status < 400 ? '#f59e0b' : '#ef4444') : ''

  return (
    <ToolLayout title="HTTP 请求测试" description="API 接口调试工具，支持多种请求方法">
      <div className="tool-row">
        <select className="select" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[]).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" style={{ flex: 1 }} />
        <button className="btn" onClick={send} disabled={loading}>
          <Send size={16} /> {loading ? '发送中...' : '发送'}
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <span className="tool-label">请求头 (每行一个 key: value)</span>
        <textarea className="textarea" value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder="Content-Type: application/json&#10;Authorization: Bearer xxx" style={{ minHeight: 60, fontSize: 12 }} />
      </div>
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div style={{ marginTop: 12 }}>
          <span className="tool-label">请求体</span>
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' style={{ minHeight: 80, fontSize: 12 }} />
        </div>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '12px 0' }}>⚠ {error}</div>}
      {response && (
        <div style={{ marginTop: 16 }}>
          <div className="tool-output-label">
            <span className="tool-label">响应 <span style={{ color: statusColor, fontWeight: 700 }}>{response.status} {response.statusText}</span></span>
            <span className="tool-label">{response.time}ms</span>
          </div>
          <span className="tool-label" style={{ marginTop: 8, display: 'block' }}>响应头</span>
          <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 120 }}>{response.headers || '无'}</div>
          <span className="tool-label" style={{ marginTop: 12, display: 'block' }}>响应体</span>
          <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 300, overflow: 'auto' }}>{response.body}</div>
        </div>
      )}
    </ToolLayout>
  )
}
