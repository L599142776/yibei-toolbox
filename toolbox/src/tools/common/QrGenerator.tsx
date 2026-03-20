// src/tools/common/QrGenerator.tsx
import { useState, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'

// 轻量 QR 生成 — 使用在线 API (避免引入重依赖)
export default function QrGenerator() {
  const [text, setText] = useState('https://')
  const [size, setSize] = useState(256)
  const imgRef = useRef<HTMLImageElement>(null)

  const qrUrl = text
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : ''

  const download = () => {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = 'qrcode.png'
    a.click()
  }

  return (
    <ToolLayout title="二维码生成" description="输入文本或 URL，生成二维码图片">
      <div className="tool-row">
        <input
          className="input"
          style={{ flex: 1 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文本或 URL"
        />
      </div>
      <div className="tool-row">
        <label className="tool-label">尺寸:</label>
        <select className="select" value={size} onChange={(e) => setSize(Number(e.target.value))}>
          <option value={128}>128 x 128</option>
          <option value={256}>256 x 256</option>
          <option value={512}>512 x 512</option>
        </select>
      </div>
      {qrUrl && (
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <img ref={imgRef} src={qrUrl} alt="QR Code" style={{ maxWidth: size, borderRadius: 8 }} />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={download}>下载图片</button>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
