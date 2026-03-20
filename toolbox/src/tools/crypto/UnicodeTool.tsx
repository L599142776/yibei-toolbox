// src/tools/crypto/UnicodeTool.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function UnicodeTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'toUnicode' | 'toChinese'>('toUnicode')

  let output = ''
  if (mode === 'toUnicode') {
    output = Array.from(input).map((c) => {
      const code = c.charCodeAt(0)
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : c
    }).join('')
  } else {
    output = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  }

  return (
    <ToolLayout title="Unicode 中文互转" description="Unicode 编码与中文字符互相转换">
      <div className="btn-group">
        <button className={`btn ${mode === 'toUnicode' ? '' : 'btn-outline'}`} onClick={() => setMode('toUnicode')}>中文 → Unicode</button>
        <button className={`btn ${mode === 'toChinese' ? '' : 'btn-outline'}`} onClick={() => setMode('toChinese')}>Unicode → 中文</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'toUnicode' ? '输入中文...' : '输入 Unicode (如 \\u4f60\\u597d)...'} style={{ minHeight: 100 }} />
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
