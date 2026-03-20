// src/tools/text/TextDedup.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function TextDedup() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'line' | 'word' | 'char'>('line')
  const [caseSensitive, setCaseSensitive] = useState(true)

  let output = ''
  let removed = 0

  if (input.trim()) {
    if (mode === 'line') {
      const lines = input.split('\n')
      const seen = new Set<string>()
      const result: string[] = []
      for (const line of lines) {
        const key = caseSensitive ? line : line.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          result.push(line)
        } else {
          removed++
        }
      }
      output = result.join('\n')
    } else if (mode === 'word') {
      const words = input.split(/\s+/)
      const seen = new Set<string>()
      const result: string[] = []
      for (const w of words) {
        const key = caseSensitive ? w : w.toLowerCase()
        if (!seen.has(key)) { seen.add(key); result.push(w) } else removed++
      }
      output = result.join(' ')
    } else {
      const seen = new Set<string>()
      const result: string[] = []
      for (const c of input) {
        const key = caseSensitive ? c : c.toLowerCase()
        if (!seen.has(key)) { seen.add(key); result.push(c) } else removed++
      }
      output = result.join('')
    }
  }

  return (
    <ToolLayout title="文本去重" description="按行、按词、按字符去除重复内容">
      <div className="btn-group">
        <button className={`btn ${mode === 'line' ? '' : 'btn-outline'}`} onClick={() => setMode('line')}>按行去重</button>
        <button className={`btn ${mode === 'word' ? '' : 'btn-outline'}`} onClick={() => setMode('word')}>按词去重</button>
        <button className={`btn ${mode === 'char' ? '' : 'btn-outline'}`} onClick={() => setMode('char')}>按字符去重</button>
        <button className={`btn ${caseSensitive ? '' : 'btn-outline'}`} onClick={() => setCaseSensitive(!caseSensitive)}>
          {caseSensitive ? '区分大小写' : '忽略大小写'}
        </button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入文本..." />
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出 ({removed > 0 ? `去除 ${removed} 项重复` : '无重复'})</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }}>{output || '—'}</div>
    </ToolLayout>
  )
}
