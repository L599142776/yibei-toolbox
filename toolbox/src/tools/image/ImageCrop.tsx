// src/tools/image/ImageCrop.tsx
import { useState, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'

export default function ImageCrop() {
  const [original, setOriginal] = useState<{ file: File; url: string; w: number; h: number } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 })
  const [cropped, setCropped] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setOriginal({ file, url, w: img.width, h: img.height })
      setCrop({ x: 0, y: 0, w: img.width, h: img.height })
    }
    img.src = url
  }

  const doCrop = () => {
    if (!original) return
    const canvas = canvasRef.current!
    canvas.width = crop.w
    canvas.height = crop.h
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)
      setCropped(canvas.toDataURL('image/png'))
    }
    img.src = original.url
  }

  const download = () => {
    if (!cropped) return
    const a = document.createElement('a')
    a.href = cropped
    a.download = 'cropped.png'
    a.click()
  }

  return (
    <ToolLayout title="图片裁剪" description="上传图片，指定区域裁剪">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div
        className="tool-output"
        style={{ textAlign: 'center', cursor: 'pointer', padding: 40, border: '2px dashed var(--border)' }}
        onClick={() => document.getElementById('crop-input')?.click()}
      >
        {original ? '点击更换图片' : '点击上传图片'}
        <input id="crop-input" type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
      {original && (
        <>
          <div style={{ marginTop: 16 }}>
            <span className="tool-label">原图: {original.w} × {original.h}px</span>
            <img src={original.url} alt="原图" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div>
              <label className="tool-label">X: {crop.x}px</label>
              <input type="range" min={0} max={original.w - 1} value={crop.x} onChange={(e) => setCrop({ ...crop, x: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label className="tool-label">Y: {crop.y}px</label>
              <input type="range" min={0} max={original.h - 1} value={crop.y} onChange={(e) => setCrop({ ...crop, y: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label className="tool-label">宽度: {crop.w}px</label>
              <input type="range" min={1} max={original.w - crop.x} value={crop.w} onChange={(e) => setCrop({ ...crop, w: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div>
              <label className="tool-label">高度: {crop.h}px</label>
              <input type="range" min={1} max={original.h - crop.y} value={crop.h} onChange={(e) => setCrop({ ...crop, h: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </div>
          <div className="btn-group" style={{ marginTop: 12 }}>
            <button className="btn" onClick={doCrop}>裁剪</button>
          </div>
          {cropped && (
            <div style={{ marginTop: 16 }}>
              <span className="tool-label">裁剪结果 ({crop.w} × {crop.h}px)</span>
              <img src={cropped} alt="裁剪结果" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
              <button className="btn" onClick={download} style={{ marginTop: 12 }}>下载</button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
