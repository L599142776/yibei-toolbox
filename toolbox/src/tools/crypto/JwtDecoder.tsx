// src/tools/crypto/JwtDecoder.tsx
import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function JwtDecoder() {
  const [token, setToken] = useState('')

  let header = ''
  let payload = ''
  let error = ''

  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('JWT 格式不正确，应包含三段')
      header = JSON.stringify(JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'))), null, 2)
      payload = JSON.stringify(JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))), null, 2)
    } catch (e: any) {
      error = e.message
    }
  }

  return (
    <ToolLayout title="JWT 解析验证" description="解码 JSON Web Token 的 Header 和 Payload">
      <textarea className="textarea" value={token} onChange={(e) => setToken(e.target.value)} placeholder="粘贴 JWT token..." style={{ minHeight: 80, fontSize: 13 }} />
      {error && <div style={{ color: '#ef4444', fontSize: 13, margin: '8px 0' }}>⚠ {error}</div>}
      {(header || payload) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            <span className="tool-label">Header</span>
            <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{header}</div>
          </div>
          <div>
            <span className="tool-label">Payload</span>
            <div className="tool-output" style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{payload}</div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
