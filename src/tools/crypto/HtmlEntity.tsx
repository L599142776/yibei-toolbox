// src/tools/crypto/HtmlEntity.tsx
import { useState } from 'react'
import { Copy } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function HtmlEntity() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  let output = ''
  if (mode === 'encode') {
    output = input.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
  } else {
    output = input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
  }

  return (
    <ToolLayout title="HTML 实体编解码" description="HTML 特殊字符实体编码与解码">
      <div className="btn-group">
        <button className={`btn ${mode === 'encode' ? '' : 'btn-outline'}`} onClick={() => setMode('encode')}>编码</button>
        <button className={`btn ${mode === 'decode' ? '' : 'btn-outline'}`} onClick={() => setMode('decode')}>解码</button>
      </div>
      <textarea className="textarea" value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'encode' ? '输入包含 <>&"\' 的文本...' : '输入 &lt;div&gt; 这样的实体...'} style={{ minHeight: 100 }} />
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
