// src/tools/text/TextDiff.tsx
import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'

function diffLines(a: string, b: string) {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const result: { type: 'same' | 'add' | 'remove'; line: string; num: number }[] = []

  let ai = 0, bi = 0
  const aSet = new Set(aLines)
  const bSet = new Set(bLines)

  for (const line of aLines) {
    if (bSet.has(line)) {
      result.push({ type: 'same', line, num: ++ai })
    } else {
      result.push({ type: 'remove', line, num: ++ai })
    }
  }
  for (const line of bLines) {
    if (!aSet.has(line)) {
      result.push({ type: 'add', line, num: ++bi })
    }
  }

  return result
}

export default function TextDiff() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const diff = useMemo(() => diffLines(left, right), [left, right])
  const adds = diff.filter((d) => d.type === 'add').length
  const removes = diff.filter((d) => d.type === 'remove').length

  return (
    <ToolLayout title="文本 Diff 对比" description="逐行对比两段文本的差异">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <span className="tool-label">原始文本</span>
          <textarea className="textarea" value={left} onChange={(e) => setLeft(e.target.value)} placeholder="粘贴原始文本..." style={{ minHeight: 200 }} />
        </div>
        <div>
          <span className="tool-label">新文本</span>
          <textarea className="textarea" value={right} onChange={(e) => setRight(e.target.value)} placeholder="粘贴新文本..." style={{ minHeight: 200 }} />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <span className="tool-label">差异结果 ({adds > 0 ? `+${adds}` : ''} {removes > 0 ? `-${removes}` : ''})</span>
        <div className="tool-output" style={{ maxHeight: 300, overflow: 'auto' }}>
          {diff.map((d, i) => (
            <div key={i} style={{
              padding: '2px 8px',
              background: d.type === 'add' ? '#10b98122' : d.type === 'remove' ? '#ef444422' : 'transparent',
              color: d.type === 'add' ? '#10b981' : d.type === 'remove' ? '#ef4444' : 'var(--text)',
              fontFamily: 'monospace',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-dim)', marginRight: 8 }}>{d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '}</span>
              {d.line}
            </div>
          ))}
          {diff.length === 0 && <span style={{ color: 'var(--text-dim)' }}>输入文本开始对比...</span>}
        </div>
      </div>
    </ToolLayout>
  )
}
