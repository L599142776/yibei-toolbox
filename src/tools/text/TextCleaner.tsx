// src/tools/text/TextCleaner.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

type Mode = 'trim-lines' | 'remove-blank' | 'collapse-spaces' | 'remove-all-spaces' | 'one-line'

const modes: { id: Mode; label: string; fn: (s: string) => string }[] = [
  { id: 'trim-lines', label: '去除首尾空格', fn: (s) => s.split('\n').map((l) => l.trim()).join('\n') },
  { id: 'remove-blank', label: '去除空行', fn: (s) => s.split('\n').filter((l) => l.trim()).join('\n') },
  { id: 'collapse-spaces', label: '合并连续空格', fn: (s) => s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') },
  { id: 'remove-all-spaces', label: '去除所有空格', fn: (s) => s.replace(/\s/g, '') },
  { id: 'one-line', label: '合并为一行', fn: (s) => s.replace(/\s+/g, ' ').trim() },
]

export default function TextCleaner() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('trim-lines')

  const currentMode = modes.find((m) => m.id === mode)!
  const output = input ? currentMode.fn(input) : ''

  return (
    <ToolLayout title="文本去空格换行" description="多种模式清理文本中的空格和换行">
      <div className="btn-group">
        {modes.map((m) => (
          <button key={m.id} className={`btn ${mode === m.id ? '' : 'btn-outline'}`} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入文本..." />
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap' }}>{output}</div>
    </ToolLayout>
  )
}
