// src/tools/data/JsonFormatter.tsx
import { useMemo, useState } from 'react'
import { Copy, Minimize2 } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/Select'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState(2)

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed: unknown = JSON.parse(input)
      return { output: JSON.stringify(parsed, null, indent), error: '' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'JSON 解析失败'
      return { output: '', error: msg }
    }
  }, [input, indent])

  const minify = () => {
    try {
      const parsed: unknown = JSON.parse(input)
      setInput(JSON.stringify(parsed))
    } catch {
      setInput(v => v)
    }
  }

  return (
    <ToolLayout title="JSON 格式化" description="JSON 美化、压缩、验证">
      <div className="btn-group">
        <Select
          value={String(indent)}
          onChange={v => setIndent(Number(v))}
          options={[
            { value: '2', label: '2 空格缩进' },
            { value: '4', label: '4 空格缩进' },
            { value: '1', label: 'Tab 缩进' },
          ]}
        />
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
