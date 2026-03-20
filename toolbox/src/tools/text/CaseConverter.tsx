// src/tools/text/CaseConverter.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type CaseType = 'upper' | 'lower' | 'capitalize' | 'camel' | 'snake' | 'kebab' | 'constant'

const cases: { id: CaseType; label: string; fn: (s: string) => string }[] = [
  { id: 'upper', label: 'UPPER CASE', fn: (s) => s.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: (s) => s.toLowerCase() },
  { id: 'capitalize', label: 'Capitalize', fn: (s) => s.replace(/\b\w/g, (c) => c.toUpperCase()) },
  { id: 'camel', label: 'camelCase', fn: (s) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) },
  { id: 'snake', label: 'snake_case', fn: (s) => s.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toLowerCase() },
  { id: 'kebab', label: 'kebab-case', fn: (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase() },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (s) => s.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s\-]+/g, '_').toUpperCase() },
]

export default function CaseConverter() {
  const [input, setInput] = useState('')

  return (
    <ToolLayout title="大小写转换" description="UPPER / lower / camelCase / snake_case 等格式互转">
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入文本..." style={{ minHeight: 100 }} />
      <hr className="tool-divider" />
      <div style={{ display: 'grid', gap: 10 }}>
        {cases.map((c) => {
          const result = input ? c.fn(input) : ''
          return (
            <div key={c.id} className="tool-row">
              <span className="tool-label" style={{ width: 120, flexShrink: 0 }}>{c.label}</span>
              <div className="tool-output" style={{ flex: 1, fontSize: 13 }}>{result || '—'}</div>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => navigator.clipboard.writeText(result)}>
                <Copy size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToolLayout>
  )
}
