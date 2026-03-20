// src/tools/data/JsonToCsv.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function JsonToCsv() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'json2csv' | 'csv2json'>('json2csv')

  let output = ''
  let error = ''

  try {
    if (input.trim()) {
      if (mode === 'json2csv') {
        const data = JSON.parse(input)
        const arr = Array.isArray(data) ? data : [data]
        if (arr.length > 0) {
          const headers = [...new Set(arr.flatMap((r: any) => Object.keys(r)))]
          const rows = arr.map((r: any) => headers.map((h) => {
            const v = r[h] ?? ''
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
          }).join(','))
          output = [headers.join(','), ...rows].join('\n')
        }
      } else {
        const lines = input.trim().split('\n')
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim())
          const data = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim())
            const obj: Record<string, string> = {}
            headers.forEach((h, i) => { obj[h] = vals[i] || '' })
            return obj
          })
          output = JSON.stringify(data, null, 2)
        }
      }
    }
  } catch (e: any) {
    error = e.message
  }

  return (
    <ToolLayout title="JSON ↔ CSV" description="JSON 数组与 CSV 格式互转">
      <div className="btn-group">
        <button className={`btn ${mode === 'json2csv' ? '' : 'btn-outline'}`} onClick={() => setMode('json2csv')}>JSON → CSV</button>
        <button className={`btn ${mode === 'csv2json' ? '' : 'btn-outline'}`} onClick={() => setMode('csv2json')}>CSV → JSON</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'json2csv' ? '粘贴 JSON 数组...' : '粘贴 CSV (首行为表头)...'} style={{ minHeight: 150 }} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>{output || '—'}</div>
    </ToolLayout>
  )
}
