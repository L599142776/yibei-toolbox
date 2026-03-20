// src/tools/crypto/UrlEncode.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function UrlEncode() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  let output = ''
  try {
    output = mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
  } catch {
    output = '⚠ 无效的 URL 编码字符串'
  }

  return (
    <ToolLayout title="URL 编解码" description="URL 特殊字符的编码与解码">
      <div className="btn-group">
        <button className={`btn ${mode === 'encode' ? '' : 'btn-outline'}`} onClick={() => setMode('encode')}>编码</button>
        <button className={`btn ${mode === 'decode' ? '' : 'btn-outline'}`} onClick={() => setMode('decode')}>解码</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入文本..." style={{ minHeight: 100 }} />
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{output}</div>
    </ToolLayout>
  )
}
