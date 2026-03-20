// src/tools/data/JsonToYaml.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// 轻量 JSON↔YAML (简单场景，不需要引入重依赖)
function jsonToYaml(obj: any, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (obj === null) return 'null'
  if (typeof obj === 'boolean') return String(obj)
  if (typeof obj === 'number') return String(obj)
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.includes('"') || obj.includes("'")) {
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
    }
    return obj
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map((item) => {
      const val = jsonToYaml(item, indent + 1)
      if (typeof item === 'object' && item !== null) {
        return `${pad}-\n${val}`
      }
      return `${pad}- ${val}`
    }).join('\n')
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'
    return keys.map((k) => {
      const v = obj[k]
      if (typeof v === 'object' && v !== null) {
        return `${pad}${k}:\n${jsonToYaml(v, indent + 1)}`
      }
      return `${pad}${k}: ${jsonToYaml(v, indent + 1)}`
    }).join('\n')
  }
  return String(obj)
}

export default function JsonToYaml() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml')

  let output = ''
  let error = ''

  try {
    if (input.trim()) {
      if (mode === 'json2yaml') {
        const parsed = JSON.parse(input)
        output = jsonToYaml(parsed)
      } else {
        // 简易 YAML → JSON (基本格式)
        const lines = input.split('\n')
        const result: Record<string, any> = {}
        for (const line of lines) {
          const match = line.match(/^(\s*)([\w.-]+):\s*(.*)$/)
          if (match) {
            const [, , key, val] = match
            if (val === '') continue
            try { result[key] = JSON.parse(val) } catch { result[key] = val }
          }
        }
        output = JSON.stringify(result, null, 2)
      }
    }
  } catch (e: any) {
    error = e.message
  }

  return (
    <ToolLayout title="JSON ↔ YAML" description="JSON 与 YAML 格式互转 (轻量版)">
      <div className="btn-group">
        <button className={`btn ${mode === 'json2yaml' ? '' : 'btn-outline'}`} onClick={() => setMode('json2yaml')}>JSON → YAML</button>
        <button className={`btn ${mode === 'yaml2json' ? '' : 'btn-outline'}`} onClick={() => setMode('yaml2json')}>YAML → JSON</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'json2yaml' ? '粘贴 JSON...' : '粘贴 YAML...'} style={{ minHeight: 150 }} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }}>{output || '—'}</div>
    </ToolLayout>
  )
}
