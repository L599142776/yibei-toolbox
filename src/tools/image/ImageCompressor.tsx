// src/tools/image/ImageCompressor.tsx
import { useState, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function ImageCompressor() {
  const [quality, setQuality] = useState(0.8)
  const [original, setOriginal] = useState<{ file: File; url: string; size: number } | null>(null)
  const [compressed, setCompressed] = useState<{ url: string; size: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setOriginal({ file, url, size: file.size })
    compress(file, quality)
  }

  const compress = (file: File, q: number) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          setCompressed({ url: URL.createObjectURL(blob), size: blob.size })
        }
      }, 'image/jpeg', q)
    }
    img.src = URL.createObjectURL(file)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const download = () => {
    if (!compressed) return
    const a = document.createElement('a')
    a.href = compressed.url
    a.download = `compressed_${original?.file.name || 'image'}.jpg`
    a.click()
  }

  return (
    <ToolLayout title="图片压缩" description="纯前端图片压缩，支持 JPEG 质量调节">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div
        className="tool-output"
        style={{ textAlign: 'center', cursor: 'pointer', padding: 40, border: '2px dashed var(--border)' }}
        onClick={() => document.getElementById('img-input')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
      >
        {original ? '点击或拖拽更换图片' : '点击或拖拽上传图片'}
        <input id="img-input" type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {original && (
        <>
          <div className="tool-row" style={{ marginTop: 16 }}>
            <label className="tool-label">质量: {Math.round(quality * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={quality}
              onChange={(e) => { setQuality(Number(e.target.value)); compress(original.file, Number(e.target.value)) }}
              style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <span className="tool-label">原始 ({formatSize(original.size)})</span>
              <img src={original.url} alt="原始" style={{ width: '100%', borderRadius: 8, marginTop: 8 }} />
            </div>
            {compressed && (
              <div>
                <span className="tool-label">压缩后 ({formatSize(compressed.size)}) · 节省 {Math.round((1 - compressed.size / original.size) * 100)}%</span>
                <img src={compressed.url} alt="压缩后" style={{ width: '100%', borderRadius: 8, marginTop: 8 }} />
              </div>
            )}
          </div>
          {compressed && (
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={download}>下载压缩图片</button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
