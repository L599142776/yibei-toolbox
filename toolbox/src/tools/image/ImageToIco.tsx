// src/tools/image/ImageToIco.tsx
import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { Upload, Download, Image as ImageIcon, Check } from 'lucide-react'

const ICO_SIZES = [16, 32, 48, 64, 128, 256]

// ICO file format helpers
function createIcoHeader(numImages: number): Uint8Array {
  const header = new ArrayBuffer(6)
  const view = new DataView(header)
  view.setUint16(0, 0, true) // Reserved
  view.setUint16(2, 1, true) // Type: 1 = ICO
  view.setUint16(4, numImages, true) // Number of images
  return new Uint8Array(header)
}

function createIcoEntry(size: number, dataSize: number, offset: number): Uint8Array {
  const entry = new ArrayBuffer(16)
  const view = new DataView(entry)
  // Width and Height: 0 means 256
  view.setUint8(0, size === 256 ? 0 : size)
  view.setUint8(1, size === 256 ? 0 : size)
  view.setUint8(2, 0) // Color palette (0 = no palette)
  view.setUint8(3, 0) // Reserved
  view.setUint16(4, 1, true) // Color planes
  view.setUint16(6, 32, true) // Bits per pixel
  view.setUint32(8, dataSize, true) // Size of image data
  view.setUint32(12, offset, true) // Offset to image data
  return new Uint8Array(entry)
}

async function imageToPngBlob(img: HTMLImageElement, size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    
    // Calculate crop to maintain aspect ratio
    const srcSize = Math.min(img.width, img.height)
    const srcX = (img.width - srcSize) / 2
    const srcY = (img.height - srcSize) / 2
    
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size)
    
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

async function generateIco(image: HTMLImageElement, sizes: number[]): Promise<Blob> {
  // Get PNG data for each size
  const imageDataList: { size: number; data: Uint8Array }[] = []
  
  for (const size of sizes) {
    const blob = await imageToPngBlob(image, size)
    const buffer = await blob.arrayBuffer()
    imageDataList.push({ size, data: new Uint8Array(buffer) })
  }
  
  // Calculate header and entries size
  const headerSize = 6
  const entriesSize = sizes.length * 16
  
  // Build ICO file
  const totalSize = headerSize + entriesSize + imageDataList.reduce((sum, i) => sum + i.data.length, 0)
  const icoData = new Uint8Array(totalSize)
  
  // Write header
  const header = createIcoHeader(sizes.length)
  icoData.set(header, 0)
  
  // Write entries and image data
  let dataOffset = headerSize + entriesSize
  for (let i = 0; i < imageDataList.length; i++) {
    const { size, data } = imageDataList[i]
    // Write entry
    const entry = createIcoEntry(size, data.length, dataOffset)
    const entryOffset = 6 + i * 16
    icoData.set(entry, entryOffset)
    
    // Write image data
    icoData.set(data, dataOffset)
    dataOffset += data.length
  }
  
  return new Blob([icoData], { type: 'image/x-icon' })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function ImageToIco() {
  const [image, setImage] = useState<{ file: File; url: string; img: HTMLImageElement } | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 48])
  const [icoBlob, setIcoBlob] = useState<{ blob: Blob; url: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage({ file, url, img })
      setIcoBlob(null)
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

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    )
  }

  const generateIcoFile = async () => {
    if (!image || selectedSizes.length === 0) return
    
    setIsGenerating(true)
    try {
      const blob = await generateIco(image.img, selectedSizes)
      const url = URL.createObjectURL(blob)
      setIcoBlob({ blob, url })
    } finally {
      setIsGenerating(false)
    }
  }

  const download = () => {
    if (!icoBlob || !image) return
    const a = document.createElement('a')
    a.href = icoBlob.url
    const baseName = image.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}.ico`
    a.click()
  }

  const estimatedSizes = selectedSizes.map((size) => {
    // Rough estimation: PNG at this size
    const pixels = size * size
    const estimatedBytes = Math.ceil(pixels * 0.5) // Roughly 0.5 bytes per pixel for PNG
    return { size, bytes: estimatedBytes }
  })

  return (
    <ToolLayout
      title="图片转 ICO"
      description="将图片转换为 Windows ICO 图标格式，支持多种尺寸"
    >
      <div className="tool-content-inner">
        {/* Upload Area */}
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} strokeWidth={1.5} />
          <p className="upload-text">
            {image ? '点击或拖拽更换图片' : '点击或拖拽上传图片'}
          </p>
          <p className="upload-hint">支持 PNG、JPG、GIF、WebP 等格式</p>
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
            {/* Preview */}
            <div className="preview-section">
              <div className="preview-card">
                <div className="preview-header">
                  <ImageIcon size={16} />
                  <span>原图预览</span>
                </div>
                <div className="preview-image-container">
                  <img src={image.url} alt="Preview" className="preview-image" />
                </div>
                <div className="preview-info">
                  <span>{image.file.name}</span>
                  <span>{formatSize(image.file.size)}</span>
                </div>
              </div>
            </div>

            {/* Size Selector */}
            <div className="size-selector">
              <h3 className="section-title">选择图标尺寸</h3>
              <div className="size-grid">
                {ICO_SIZES.map((size) => (
                  <label key={size} className="size-option">
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(size)}
                      onChange={() => toggleSize(size)}
                    />
                    <span className="size-box">
                      {selectedSizes.includes(size) ? (
                        <Check size={16} />
                      ) : (
                        <span className="size-num">{size}</span>
                      )}
                    </span>
                    <span className="size-label">{size}×{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Estimated Size */}
            <div className="estimated-size">
              <div className="size-bar">
                {estimatedSizes.map(({ size, bytes }) => (
                  <div
                    key={size}
                    className="size-bar-item"
                    style={{
                      flex: bytes,
                      backgroundColor: selectedSizes.includes(size)
                        ? 'var(--primary)'
                        : 'var(--border)',
                    }}
                    title={`${size}×${size}: ${formatSize(bytes)}`}
                  />
                ))}
              </div>
              <div className="size-info">
                <span>预计输出大小: </span>
                <strong>
                  {formatSize(
                    estimatedSizes.reduce((sum, s) => sum + s.bytes, 0) +
                    6 +
                    selectedSizes.length * 16
                  )}
                </strong>
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="btn btn-primary"
              onClick={generateIcoFile}
              disabled={selectedSizes.length === 0 || isGenerating}
            >
              {isGenerating ? '生成中...' : '生成 ICO 文件'}
            </button>

            {/* Generated Result */}
            {icoBlob && (
              <div className="result-section">
                <div className="result-card">
                  <div className="result-header">
                    <Check size={20} className="success-icon" />
                    <span>ICO 文件已生成</span>
                  </div>
                  <div className="result-preview">
                    <img src={image.url} alt="ICO Preview" className="ico-preview" />
                    <div className="ico-sizes">
                      {selectedSizes.map((size) => (
                        <div key={size} className="ico-size-preview">
                          <img
                            src={image.url}
                            alt={`${size}×${size}`}
                            style={{ width: size, height: size, imageRendering: 'pixelated' }}
                          />
                          <span>{size}×{size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="result-info">
                    <span>文件大小: {formatSize(icoBlob.blob.size)}</span>
                    <span>包含 {selectedSizes.length} 种尺寸</span>
                  </div>
                  <button className="btn btn-success" onClick={download}>
                    <Download size={18} />
                    下载 ICO 文件
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .tool-content-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .upload-area {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .upload-area:hover,
        .upload-area.dragging {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .upload-area svg {
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .upload-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--text);
        }

        .upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .preview-section {
          display: flex;
          justify-content: center;
        }

        .preview-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          max-width: 280px;
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .preview-image-container {
          padding: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: repeating-conic-gradient(
            var(--bg-tertiary) 0% 25%,
            var(--bg) 0% 50%
          ) 50% / 16px 16px;
          min-height: 150px;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 4px;
        }

        .preview-info {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          font-size: 13px;
          color: var(--text-secondary);
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .size-selector {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .size-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .size-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .size-option input {
          display: none;
        }

        .size-box {
          width: 48px;
          height: 48px;
          border: 2px solid var(--border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--bg);
        }

        .size-option input:checked + .size-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .size-num {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .size-label {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .estimated-size {
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .size-bar {
          display: flex;
          height: 24px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .size-bar-item {
          min-width: 4px;
          transition: background-color 0.2s;
        }

        .size-info {
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
        }

        .size-info strong {
          color: var(--text);
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

        .result-section {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .success-icon {
          color: #22c55e;
        }

        .result-preview {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .ico-preview {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
        }

        .ico-sizes {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          flex-wrap: wrap;
          justify-content: center;
        }

        .ico-size-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .ico-size-preview img {
          border: 1px solid var(--border);
          border-radius: 4px;
          background: repeating-conic-gradient(
            var(--bg-tertiary) 0% 25%,
            var(--bg) 0% 50%
          ) 50% / 8px 8px;
        }

        .ico-size-preview span {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .result-info {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        @media (max-width: 480px) {
          .size-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .result-preview {
            flex-direction: column;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
