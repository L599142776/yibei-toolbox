// src/tools/text/WordCounter.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function WordCounter() {
  const [text, setText] = useState('')

  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const lines = text ? text.split('\n').length : 0
  const paragraphs = text ? text.split(/\n\s*\n/).filter(Boolean).length : 0
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length

  return (
    <ToolLayout title="字数统计" description="统计文本的字符数、词数、行数等">
      <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="在此输入或粘贴文本..." style={{ minHeight: 200 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
        {[
          ['总字符', chars],
          ['不含空格', charsNoSpace],
          ['中文字数', chineseChars],
          ['英文词数', words],
          ['行数', lines],
          ['段落数', paragraphs],
        ].map(([label, val]) => (
          <div key={label as string} className="tool-output" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{val as number}</div>
            <div className="tool-label">{label}</div>
          </div>
        ))}
      </div>
    </ToolLayout>
  )
}
