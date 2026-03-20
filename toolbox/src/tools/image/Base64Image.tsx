// src/tools/image/Base64Image.tsx
import { useState } from 'react'
import { Copy, ImagePlus } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function Base64Image() {
  const [mode, setMode] = useState<'img2base64' | 'base642img'>('img2base64')
  const [base64, setBase64] = useState('')
  const [preview, setPreview] = useState('')

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const handleBase64Input = (val: string) => {
    setBase64(val)
    if (val.startsWith('data:image')) {
      setPreview(val)
    } else {
      setPreview('')
    }
  }

  return (
    <ToolLayout title="Base64 ↔ 图片" description="图片转 Base64 字符串，或 Base64 字符串转图片预览">
      <div className="btn-group">
        <button className={`btn ${mode === 'img2base64' ? '' : 'btn-outline'}`} onClick={() => setMode('img2base64')}>
          图片 → Base64
        </button>
        <button className={`btn ${mode === 'base642img' ? '' : 'btn-outline'}`} onClick={() => setMode('base642img')}>
          Base64 → 图片
        </button>
      </div>

      {mode === 'img2base64' ? (
        <>
          <div
            className="tool-output"
            style={{ textAlign: 'center', cursor: 'pointer', padding: 40, border: '2px dashed var(--border)' }}
            onClick={() => document.getElementById('b64-file')?.click()}
          >
            <ImagePlus size={32} style={{ marginBottom: 8 }} /><br />点击上传图片
            <input id="b64-file" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
          {base64 && (
            <>
              <div className="tool-output-label" style={{ marginTop: 16 }}>
                <span className="tool-label">Base64 ({base64.length} 字符)</span>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigator.clipboard.writeText(base64)}>
                  <Copy size={12} /> 复制
                </button>
              </div>
              <div className="tool-output" style={{ maxHeight: 150, overflow: 'auto', fontSize: 11, wordBreak: 'break-all' }}>
                {base64.substring(0, 200)}...
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <textarea className="textarea" value={base64} onChange={(e) => handleBase64Input(e.target.value)}
            placeholder="粘贴 Base64 字符串 (以 data:image 开头)..." style={{ minHeight: 100, fontSize: 11 }} />
          {preview && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <img src={preview} alt="预览" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }} />
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
