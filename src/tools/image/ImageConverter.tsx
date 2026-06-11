import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { Upload, Download, Image as ImageIcon, Check, RefreshCw } from 'lucide-react'

interface OutputFormat {
  mime: string
  extension: string
  name: string
  lossy: boolean
}

const OUTPUT_FORMATS: OutputFormat[] = [
  { mime: 'image/png', extension: 'png', name: 'PNG', lossy: false },
  { mime: 'image/jpeg', extension: 'jpg', name: 'JPEG', lossy: true },
  { mime: 'image/webp', extension: 'webp', name: 'WebP', lossy: true },
  { mime: 'image/bmp', extension: 'bmp', name: 'BMP', lossy: false },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function detectFormat(file: File): string {
  const name = file.name.toLowerCase()
  if (name.endsWith('.png')) return 'PNG'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPEG'
  if (name.endsWith('.webp')) return 'WebP'
  if (name.endsWith('.gif')) return 'GIF'
  if (name.endsWith('.bmp')) return 'BMP'
  if (name.endsWith('.svg')) return 'SVG'
  if (name.endsWith('.ico')) return 'ICO'
  if (name.endsWith('.avif')) return 'AVIF'
  if (name.endsWith('.tiff') || name.endsWith('.tif')) return 'TIFF'
  return file.type.split('/')[1]?.toUpperCase() || ''
}

export default function ImageConverter() {
  const [image, setImage] = useState<{ file: File; url: string; img: HTMLImageElement } | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('image/png')
  const [quality, setQuality] = useState(0.92)
  const [converted, setConverted] = useState<{ blob: Blob; url: string } | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentFormat = OUTPUT_FORMATS.find((f) => f.mime === selectedFormat)!

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage({ file, url, img })
      setConverted(null)
    }
    img.src = url
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const convert = async () => {
    if (!image) return
    setIsConverting(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = image.img.width
      canvas.height = image.img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(image.img, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), selectedFormat, quality)
      })
      if (blob) {
        if (converted) URL.revokeObjectURL(converted.url)
        setConverted({ blob, url: URL.createObjectURL(blob) })
      }
    } finally {
      setIsConverting(false)
    }
  }

  const download = () => {
    if (!converted || !image) return
    const a = document.createElement('a')
    a.href = converted.url
    const baseName = image.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}.${currentFormat.extension}`
    a.click()
  }

  const sourceFormat = image ? detectFormat(image.file) : ''

  return (
    <ToolLayout
      title="图片格式转换"
      description="将图片转换为 PNG、JPEG、WebP、BMP 等格式"
    >
      <div className="imconv-inner">
        <div
          className={`imconv-upload ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} strokeWidth={1.5} />
          <p className="imconv-upload-text">
            {image ? '点击或拖拽更换图片' : '点击或拖拽上传图片'}
          </p>
          <p className="imconv-upload-hint">支持 PNG、JPG、WebP、GIF、BMP、SVG、ICO 等格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {image && (
          <>
            <div className="imconv-preview-section">
              <div className="imconv-preview-card">
                <div className="imconv-preview-header">
                  <ImageIcon size={16} />
                  <span>原始图片</span>
                </div>
                <div className="imconv-preview-image-container">
                  <img src={image.url} alt="Preview" className="imconv-preview-image" />
                </div>
                <div className="imconv-preview-info">
                  <span className="imconv-filename">{image.file.name}</span>
                  <span>{sourceFormat} · {formatSize(image.file.size)}</span>
                </div>
              </div>
            </div>

            <div className="imconv-format-section">
              <h3 className="imconv-section-title">目标格式</h3>
              <div className="imconv-format-grid">
                {OUTPUT_FORMATS.map((fmt) => (
                  <label key={fmt.mime} className={`imconv-format-option${selectedFormat === fmt.mime ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value={fmt.mime}
                      checked={selectedFormat === fmt.mime}
                      onChange={() => {
                        setSelectedFormat(fmt.mime)
                        setConverted(null)
                      }}
                    />
                    <span className="imconv-format-box">
                      {selectedFormat === fmt.mime ? <Check size={20} /> : fmt.name}
                    </span>
                    <span className="imconv-format-label">{fmt.name}</span>
                    {fmt.lossy && <span className="imconv-badge">有损</span>}
                  </label>
                ))}
              </div>
            </div>

            {currentFormat.lossy && (
              <div className="imconv-quality-section">
                <label className="imconv-section-title">质量: {Math.round(quality * 100)}%</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="imconv-slider"
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={convert}
              disabled={isConverting}
            >
              {isConverting ? (
                <><RefreshCw size={18} className="imconv-spin" /> 转换中...</>
              ) : (
                <><RefreshCw size={18} /> 转换为 {currentFormat.name}</>
              )}
            </button>

            {converted && (
              <div className="imconv-result">
                <div className="imconv-result-card">
                  <div className="imconv-result-header">
                    <Check size={20} className="imconv-success-icon" />
                    <span>转换完成</span>
                  </div>
                  <div className="imconv-compare">
                    <div className="imconv-compare-item">
                      <div className="imconv-compare-label">原始 ({sourceFormat})</div>
                      <img src={image.url} alt="Original" className="imconv-compare-image" />
                      <div className="imconv-compare-size">{formatSize(image.file.size)}</div>
                    </div>
                    <div className="imconv-compare-arrow">→</div>
                    <div className="imconv-compare-item">
                      <div className="imconv-compare-label">转换后 ({currentFormat.name})</div>
                      <img src={converted.url} alt="Converted" className="imconv-compare-image" />
                      <div className="imconv-compare-size">{formatSize(converted.blob.size)}</div>
                    </div>
                  </div>
                  <div className="imconv-stats">
                    {converted.blob.size < image.file.size ? (
                      <span className="imconv-saved">缩小 {formatSize(image.file.size - converted.blob.size)} ({Math.round((1 - converted.blob.size / image.file.size) * 100)}%)</span>
                    ) : converted.blob.size > image.file.size ? (
                      <span className="imconv-increased">增大 {formatSize(converted.blob.size - image.file.size)}</span>
                    ) : (
                      <span>大小不变</span>
                    )}
                  </div>
                  <button className="btn btn-success" onClick={download}>
                    <Download size={18} /> 下载 {currentFormat.name} 文件
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .imconv-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .imconv-upload {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .imconv-upload:hover, .imconv-upload.dragging {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .imconv-upload svg {
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .imconv-upload-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--text);
        }

        .imconv-upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .imconv-preview-section {
          display: flex;
          justify-content: center;
        }

        .imconv-preview-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          max-width: 280px;
        }

        .imconv-preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .imconv-preview-image-container {
          padding: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: repeating-conic-gradient(var(--bg-tertiary) 0% 25%, var(--bg) 0% 50%) 50% / 16px 16px;
          min-height: 150px;
        }

        .imconv-preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 4px;
        }

        .imconv-preview-info {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-secondary);
          gap: 8px;
        }

        .imconv-filename {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .imconv-format-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .imconv-section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .imconv-format-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .imconv-format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
        }

        .imconv-format-option input {
          display: none;
        }

        .imconv-format-box {
          width: 56px;
          height: 56px;
          border: 2px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--bg);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .imconv-format-option.active .imconv-format-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .imconv-format-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .imconv-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          background: #fef3c7;
          color: #92400e;
          position: absolute;
          top: -4px;
          right: -4px;
        }

        .imconv-quality-section {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .imconv-slider {
          width: 100%;
          margin-top: 8px;
          accent-color: var(--primary);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-success {
          background: #22c55e;
          color: white;
        }

        .btn-success:hover {
          filter: brightness(1.1);
        }

        .imconv-result {
          animation: imconvFadeIn 0.3s ease;
        }

        @keyframes imconvFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes imconvSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .imconv-spin {
          animation: imconvSpin 1s linear infinite;
        }

        .imconv-result-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .imconv-result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .imconv-success-icon {
          color: #22c55e;
        }

        .imconv-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .imconv-compare-item {
          flex: 1;
          min-width: 120px;
          max-width: 200px;
        }

        .imconv-compare-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .imconv-compare-image {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .imconv-compare-arrow {
          font-size: 24px;
          color: var(--text-secondary);
        }

        .imconv-compare-size {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .imconv-stats {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .imconv-saved {
          color: #22c55e;
        }

        .imconv-increased {
          color: #ef4444;
        }

        @media (max-width: 480px) {
          .imconv-format-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .imconv-compare {
            flex-direction: column;
          }

          .imconv-compare-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </ToolLayout>
  )
}
