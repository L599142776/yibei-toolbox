// src/tools/common/BaseConverter.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import Select from '../../components/ui/Select'

export default function BaseConverter() {
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)

  const bases = [2, 8, 10, 16]
  const num = parseInt(input, fromBase)

  const results = bases.map((b) => ({
    base: b,
    label: { 2: '二进制', 8: '八进制', 10: '十进制', 16: '十六进制' }[b],
    value: Number.isNaN(num) ? '—' : num.toString(b).toUpperCase(),
  }))

  const copy = (val: string) => navigator.clipboard.writeText(val)

  return (
    <ToolLayout title="进制转换" description="二进制、八进制、十进制、十六进制互转">
      <div className="tool-row">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入数值"
          style={{ flex: 1 }}
        />
        <Select
          value={String(fromBase)}
          onChange={v => setFromBase(Number(v))}
          options={bases.map(b => ({ value: String(b), label: `${b} 进制` }))}
        />
      </div>
      <hr className="tool-divider" />
      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((r) => (
          <div key={r.base} className="tool-row" style={{ justifyContent: 'space-between' }}>
            <span className="tool-label" style={{ width: 80 }}>{r.label}</span>
            <div className="tool-output" style={{ flex: 1, fontFamily: 'monospace' }}>{r.value}</div>
            <button className="btn btn-outline" onClick={() => copy(r.value)} style={{ padding: '8px 12px' }}>
              <Copy size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToolLayout>
  )
}
