// src/tools/data/JsonFormatter.tsx
import { useState } from 'react'
import { Copy, Minimize2 } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState(2)
  const [error, setError] = useState('')

  let output = ''
  try {
    if (input.trim()) {
      const parsed = JSON.parse(input)
      output = JSON.stringify(parsed, null, indent)
      setError('')
    }
  } catch (e: any) {
    setError(e.message)
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setInput(JSON.stringify(parsed))
    } catch {}
  }

  return (
    <ToolLayout title="JSON 格式化" description="JSON 美化、压缩、验证">
      <div className="btn-group">
        <select className="select" value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
          <option value={2}>2 空格缩进</option>
          <option value={4}>4 空格缩进</option>
          <option value={1}>Tab 缩进</option>
        </select>
        <button className="btn btn-outline" onClick={minify}><Minimize2 size={14} /> 压缩</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder='粘贴 JSON 数据...&#10;例如: {"name": "test"}' style={{ minHeight: 200 }} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      {output && (
        <>
          <div className="tool-output-label" style={{ marginTop: 16 }}>
            <span className="tool-label" style={{ color: '#10b981' }}>✓ 格式化结果</span>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <div className="tool-output" style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>{output}</div>
        </>
      )}
    </ToolLayout>
  )
}
