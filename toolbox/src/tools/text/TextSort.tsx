// src/tools/text/TextSort.tsx
import { useState } from 'react'
import { Copy, ArrowUp, ArrowDown } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function TextSort() {
  const [input, setInput] = useState('')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [numeric, setNumeric] = useState(false)

  let output = ''
  if (input.trim()) {
    const lines = input.split('\n')
    const sorted = [...lines].sort((a, b) => {
      if (numeric) {
        const na = parseFloat(a) || 0
        const nb = parseFloat(b) || 0
        return order === 'asc' ? na - nb : nb - na
      }
      return order === 'asc' ? a.localeCompare(b, 'zh') : b.localeCompare(a, 'zh')
    })
    output = sorted.join('\n')
  }

  return (
    <ToolLayout title="文本排序" description="按行排序，支持升序/降序、数字/文本模式">
      <div className="btn-group">
        <button className={`btn ${order === 'asc' ? '' : 'btn-outline'}`} onClick={() => setOrder('asc')}>
          <ArrowUp size={14} /> 升序
        </button>
        <button className={`btn ${order === 'desc' ? '' : 'btn-outline'}`} onClick={() => setOrder('desc')}>
          <ArrowDown size={14} /> 降序
        </button>
        <button className={`btn ${numeric ? '' : 'btn-outline'}`} onClick={() => setNumeric(!numeric)}>
          {numeric ? '数字模式' : '文本模式'}
        </button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="每行一个条目..." />
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">排序结果</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }}>{output || '—'}</div>
    </ToolLayout>
  )
}
