// src/tools/image/IconGenerator.tsx
import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { Upload, Download, Image as ImageIcon, Check, Package } from 'lucide-react'
import JSZip from 'jszip'

// ICO 文件格式辅助函数
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

// ICNS 文件格式辅助函数
function createIcnsHeader(totalSize: number): Uint8Array {
  const header = new ArrayBuffer(8)
  const view = new DataView(header)
  // Magic number: 'icns'
  view.setUint8(0, 0x69) // 'i'
  view.setUint8(1, 0x63) // 'c'
  view.setUint8(2, 0x6E) // 'n'
  view.setUint8(3, 0x73) // 's'
  view.setUint32(4, totalSize, false) // File size (big-endian)
  return new Uint8Array(header)
}

function createIcnsEntry(type: string, dataSize: number): Uint8Array {
  const entry = new ArrayBuffer(8)
  const view = new DataView(entry)
  // Icon type (4 bytes ASCII)
  for (let i = 0; i < 4; i++) {
    view.setUint8(i, type.charCodeAt(i))
  }
  // Entry size (including header, big-endian)
  view.setUint32(4, dataSize + 8, false)
  return new Uint8Array(entry)
}

// 将图片绘制到指定尺寸的 canvas 并返回 PNG Blob
async function imageToPngBlob(img: HTMLImageElement, width: number, height: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // 使用高质量缩放
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 绘制图片，保持宽高比
    const scale = Math.min(width / img.width, height / img.height)
    const x = (width - img.width * scale) / 2
    const y = (height - img.height * scale) / 2

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

// 生成 ICO 文件
async function generateIco(image: HTMLImageElement): Promise<Blob> {
  const sizes = [16, 32, 48, 64, 128, 256]
  const imageDataList: { size: number; data: Uint8Array }[] = []

  for (const size of sizes) {
    const blob = await imageToPngBlob(image, size, size)
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

// 生成 ICNS 文件
async function generateIcns(image: HTMLImageElement): Promise<Blob> {
  // ICNS 支持的尺寸和对应的类型代码
  const icnsSizes = [
    { size: 16, type: 'icp4' },
    { size: 32, type: 'icp5' },
    { size: 64, type: 'icp6' },
    { size: 128, type: 'ic07' },
    { size: 256, type: 'ic08' },
    { size: 512, type: 'ic09' },
    { size: 1024, type: 'ic10' },
  ]

  const entries: { type: string; data: Uint8Array }[] = []

  for (const { size, type } of icnsSizes) {
    const blob = await imageToPngBlob(image, size, size)
    const buffer = await blob.arrayBuffer()
    entries.push({ type, data: new Uint8Array(buffer) })
  }

  // Calculate total size
  const headerSize = 8
  const entriesSize = entries.reduce((sum, e) => sum + 8 + e.data.length, 0)
  const totalSize = headerSize + entriesSize

  // Build ICNS file
  const icnsData = new Uint8Array(totalSize)

  // Write header
  const header = createIcnsHeader(totalSize)
  icnsData.set(header, 0)

  // Write entries
  let offset = headerSize
  for (const { type, data } of entries) {
    // Write entry header
    const entryHeader = createIcnsEntry(type, data.length)
    icnsData.set(entryHeader, offset)
    offset += 8

    // Write entry data
    icnsData.set(data, offset)
    offset += data.length
  }

  return new Blob([icnsData], { type: 'image/icns' })
}

// 生成单个 PNG 文件
async function generatePng(image: HTMLImageElement, width: number, height: number): Promise<Blob> {
  return imageToPngBlob(image, width, height)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function IconGenerator() {
  const [image, setImage] = useState<{ file: File; url: string; img: HTMLImageElement } | null>(null)
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['png-32', 'png-128', 'png-128-2x', 'ico', 'icns'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [generatedFiles, setGeneratedFiles] = useState<{ name: string; blob: Blob; url: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage({ file, url, img })
      setGeneratedFiles([])
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

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    )
  }

  const generateAll = async () => {
    if (!image || selectedFormats.length === 0) return

    setIsGenerating(true)
    setGeneratedFiles([])

    try {
      const files: { name: string; blob: Blob; url: string }[] = []
      const baseName = image.file.name.replace(/\.[^.]+$/, '')

      // Generate PNG files
      if (selectedFormats.includes('png-32')) {
        const blob = await generatePng(image.img, 32, 32)
        const url = URL.createObjectURL(blob)
        files.push({ name: `${baseName}-32x32.png`, blob, url })
      }

      if (selectedFormats.includes('png-128')) {
        const blob = await generatePng(image.img, 128, 128)
        const url = URL.createObjectURL(blob)
        files.push({ name: `${baseName}-128x128.png`, blob, url })
      }

      if (selectedFormats.includes('png-128-2x')) {
        const blob = await generatePng(image.img, 256, 256)
        const url = URL.createObjectURL(blob)
        files.push({ name: `${baseName}-128x128@2x.png`, blob, url })
      }

      // Generate ICO file
      if (selectedFormats.includes('ico')) {
        const blob = await generateIco(image.img)
        const url = URL.createObjectURL(blob)
        files.push({ name: `${baseName}.ico`, blob, url })
      }

      // Generate ICNS file
      if (selectedFormats.includes('icns')) {
        const blob = await generateIcns(image.img)
        const url = URL.createObjectURL(blob)
        files.push({ name: `${baseName}.icns`, blob, url })
      }

      setGeneratedFiles(files)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFile = (file: { name: string; url: string }) => {
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.click()
  }

  const downloadAll = async () => {
    if (generatedFiles.length === 0) return

    if (generatedFiles.length === 1) {
      downloadFile(generatedFiles[0])
      return
    }

    // 使用 JSZip 打包所有文件
    const zip = new JSZip()
    for (const file of generatedFiles) {
      zip.file(file.name, file.blob)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    const baseName = image?.file.name.replace(/\.[^.]+$/, '') || 'icons'
    a.download = `${baseName}-icons.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout
      title="图标生成器"
      description="将 PNG 图片转换为多种图标格式：32×32、128×128、128×128@2x、ICO、ICNS"
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
                  <span>{image.img.width}×{image.img.height}</span>
                  <span>{formatSize(image.file.size)}</span>
                </div>
              </div>
            </div>

            {/* Format Selector */}
            <div className="format-selector">
              <h3 className="section-title">选择输出格式</h3>
              <div className="format-grid">
                {/* PNG Formats */}
                <label className="format-option">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('png-32')}
                    onChange={() => toggleFormat('png-32')}
                  />
                  <span className="format-box">
                    {selectedFormats.includes('png-32') ? (
                      <Check size={16} />
                    ) : (
                      <span className="format-icon">32</span>
                    )}
                  </span>
                  <span className="format-label">32×32.png</span>
                </label>

                <label className="format-option">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('png-128')}
                    onChange={() => toggleFormat('png-128')}
                  />
                  <span className="format-box">
                    {selectedFormats.includes('png-128') ? (
                      <Check size={16} />
                    ) : (
                      <span className="format-icon">128</span>
                    )}
                  </span>
                  <span className="format-label">128×128.png</span>
                </label>

                <label className="format-option">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('png-128-2x')}
                    onChange={() => toggleFormat('png-128-2x')}
                  />
                  <span className="format-box">
                    {selectedFormats.includes('png-128-2x') ? (
                      <Check size={16} />
                    ) : (
                      <span className="format-icon">2x</span>
                    )}
                  </span>
                  <span className="format-label">128×128@2x.png</span>
                </label>

                {/* ICO Format */}
                <label className="format-option">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('ico')}
                    onChange={() => toggleFormat('ico')}
                  />
                  <span className="format-box">
                    {selectedFormats.includes('ico') ? (
                      <Check size={16} />
                    ) : (
                      <span className="format-icon">ICO</span>
                    )}
                  </span>
                  <span className="format-label">icon.ico</span>
                </label>

                {/* ICNS Format */}
                <label className="format-option">
                  <input
                    type="checkbox"
                    checked={selectedFormats.includes('icns')}
                    onChange={() => toggleFormat('icns')}
                  />
                  <span className="format-box">
                    {selectedFormats.includes('icns') ? (
                      <Check size={16} />
                    ) : (
                      <span className="format-icon">ICNS</span>
                    )}
                  </span>
                  <span className="format-label">icon.icns</span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="btn btn-primary"
              onClick={generateAll}
              disabled={selectedFormats.length === 0 || isGenerating}
            >
              {isGenerating ? '生成中...' : '生成图标文件'}
            </button>

            {/* Generated Results */}
            {generatedFiles.length > 0 && (
              <div className="result-section">
                <div className="result-card">
                  <div className="result-header">
                    <Check size={20} className="success-icon" />
                    <span>图标文件已生成</span>
                  </div>

                  <div className="result-files">
                    {generatedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatSize(file.blob.size)}</span>
                        </div>
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => downloadFile(file)}
                        >
                          <Download size={14} />
                          下载
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="result-actions">
                    <button className="btn btn-success" onClick={downloadAll}>
                      <Package size={18} />
                      {generatedFiles.length > 1 ? '打包下载 ZIP' : '下载文件'}
                    </button>
                  </div>
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

        .format-selector {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .format-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        .format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .format-option input {
          display: none;
        }

        .format-box {
          width: 56px;
          height: 56px;
          border: 2px solid var(--border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--bg);
        }

        .format-option input:checked + .format-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .format-icon {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .format-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-align: center;
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

        .btn-small {
          padding: 8px 16px;
          font-size: 13px;
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

        .result-files {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .file-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .file-size {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .result-actions {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .format-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </ToolLayout>
  )
}
