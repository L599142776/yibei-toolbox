// src/tools/crypto/Base64Tool.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function Base64Tool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  let output = ''
  let error = ''
  try {
    output = mode === 'encode' ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)))
  } catch (e: any) {
    error = mode === 'decode' ? '无效的 Base64 字符串' : ''
  }

  return (
    <ToolLayout title="Base64 编解码" description="Base64 文本编码与解码">
      <div className="btn-group">
        <button className={`btn ${mode === 'encode' ? '' : 'btn-outline'}`} onClick={() => setMode('encode')}>编码</button>
        <button className={`btn ${mode === 'decode' ? '' : 'btn-outline'}`} onClick={() => setMode('decode')}>解码</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      <div className="tool-output-label" style={{ marginTop: 16 }}>
        <span className="tool-label">输出</span>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(output)}>
          <Copy size={12} /> 复制
        </button>
      </div>
      <div className="tool-output" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{output || '—'}</div>
    </ToolLayout>
  )
}
