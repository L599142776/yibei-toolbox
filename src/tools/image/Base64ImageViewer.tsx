// src/tools/image/Base64ImageViewer.tsx
// Base64 图片预览工具 - 支持拖拽、格式检测、图片信息查看

import ToolLayout from '../../components/ToolLayout'
import { Download, Copy, Upload, Image as ImageIcon, X, Check } from 'lucide-react'
import { useState, useCallback, useRef } from 'react'

interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
  mimeType: string
}

interface ParseResult {
  success: boolean
  dataUrl?: string
  mimeType?: string
  error?: string
}

// 解析 Base64 字符串，提取 MIME 类型和数据
function parseBase64(input: string): ParseResult {
  const trimmed = input.trim()
  
  // 情况1: 已经是完整 data URL
  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s)
    if (match) {
      return {
        success: true,
        dataUrl: trimmed,
        mimeType: match[1]
      }
    }
    return { success: false, error: '无效的 Base64 Data URL 格式' }
  }
  
  // 情况2: 纯 Base64 字符串（无 data: 前缀）
  // 自动检测 MIME 类型
  try {
    // 清理可能的空格和换行
    const cleanBase64 = trimmed.replace(/\s/g, '')
    
    // 检查是否为有效 Base64
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
      return { success: false, error: '无效的 Base64 字符' }
    }
    
    // 尝试解码并检测图片类型
    const binary = atob(cleanBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return { success: true, dataUrl: `data:image/png;base64,${cleanBase64}`, mimeType: 'image/png' }
    }
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { success: true, dataUrl: `data:image/jpeg;base64,${cleanBase64}`, mimeType: 'image/jpeg' }
    }
    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { success: true, dataUrl: `data:image/gif;base64,${cleanBase64}`, mimeType: 'image/gif' }
    }
    // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return { success: true, dataUrl: `data:image/webp;base64,${cleanBase64}`, mimeType: 'image/webp' }
    }
    // ICO: 00 00 (or header pattern)
    if (bytes[0] === 0x00 && bytes[1] === 0x00) {
      return { success: true, dataUrl: `data:image/x-icon;base64,${cleanBase64}`, mimeType: 'image/x-icon' }
    }
    // SVG: starts with <?xml or <svg
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<svg')) {
      return { success: true, dataUrl: `data:image/svg+xml;base64,${btoa(trimmed)}`, mimeType: 'image/svg+xml' }
    }
    
    // 尝试作为 PNG 处理（最常见）
    return { success: true, dataUrl: `data:image/png;base64,${cleanBase64}`, mimeType: 'image/png' }
  } catch {
    return { success: false, error: '无法解码 Base64 字符串' }
  }
}

// 获取图片尺寸
function getImageInfo(dataUrl: string, mimeType: string): Promise<ImageInfo | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: Math.round((dataUrl.length - `data:${mimeType};base64,`.length) * 0.75), // Base64 约 4/3
        type: mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        mimeType
      })
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function Base64ImageViewer() {
  const [input, setInput] = useState('')
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // 处理 Base64 输入
  const processInput = useCallback(async (value: string) => {
    setInput(value)
    if (!value.trim()) {
      setDataUrl('')
      setImageInfo(null)
      setError('')
      return
    }

    const result = parseBase64(value)
    if (!result.success) {
      setError(result.error || '解析失败')
      setDataUrl('')
      setImageInfo(null)
      return
    }

    setError('')
    setDataUrl(result.dataUrl!)
    
    const info = await getImageInfo(result.dataUrl!, result.mimeType!)
    if (info) {
      setImageInfo(info)
    } else {
      setError('无法加载图片')
    }
  }, [])

  // 处理文件上传
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 提取纯 Base64 部分
      const base64 = result.replace(/^data:image\/\w+;base64,/, '')
      processInput(base64)
    }
    reader.onerror = () => setError('文件读取失败')
    reader.readAsDataURL(file)
  }, [processInput])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // 下载图片
  const handleDownload = useCallback(() => {
    if (!dataUrl || !imageInfo) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `image.${imageInfo.type.toLowerCase()}`
    a.click()
  }, [dataUrl, imageInfo])

  // 复制 Data URL
  const handleCopy = useCallback(async () => {
    if (!dataUrl) return
    try {
      await navigator.clipboard.writeText(dataUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败，请手动复制')
    }
  }, [dataUrl])

  // 清空
  const handleClear = useCallback(() => {
    setInput('')
    setDataUrl('')
    setImageInfo(null)
    setError('')
  }, [])

  // 点击上传区域
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 文件选择
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // 重置 input 以允许重复选择同一文件
    e.target.value = ''
  }, [handleFile])

  return (
    <ToolLayout title="Base64 图片预览" description="Base64 字符串转图片预览，支持拖拽上传和多种格式检测">
      <div className="base64-image-viewer">
        {/* 上传区域 */}
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
        >
          <Upload size={32} />
          <span>点击或拖拽上传图片</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* 输入区域 */}
        <div className="input-section">
          <div className="tool-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="tool-label">Base64 字符串</label>
            {input && (
              <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleClear}>
                <X size={12} /> 清空
              </button>
            )}
          </div>
          <textarea
            className="textarea"
            value={input}
            onChange={(e) => processInput(e.target.value)}
            placeholder="粘贴 Base64 字符串，或上传图片自动转换..."
            style={{ minHeight: 120, fontSize: 11, fontFamily: 'monospace' }}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-message" style={{ color: 'var(--error)', padding: 12, background: 'rgba(255,0,0,0.1)', borderRadius: 8, marginTop: 12 }}>
            {error}
          </div>
        )}

        {/* 预览和图片信息 */}
        {dataUrl && imageInfo && (
          <div className="preview-section">
            {/* 图片预览 */}
            <div className="preview-box">
              <img
                ref={imgRef}
                src={dataUrl}
                alt="预览"
                style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }}
              />
            </div>

            {/* 图片信息 */}
            <div className="info-panel">
              <div className="info-header">
                <ImageIcon size={18} />
                <span>图片信息</span>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">格式</span>
                  <span className="info-value">{imageInfo.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">尺寸</span>
                  <span className="info-value">{imageInfo.width} × {imageInfo.height}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">大小</span>
                  <span className="info-value">{formatSize(imageInfo.size)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">MIME</span>
                  <span className="info-value">{imageInfo.mimeType}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="action-buttons">
                <button className="btn" onClick={handleDownload}>
                  <Download size={16} /> 下载
                </button>
                <button className={`btn ${copied ? 'btn-success' : 'btn-outline'}`} onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制' : '复制 URL'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 格式说明 */}
        {!dataUrl && !error && (
          <div className="format-hint">
            <h4>支持格式</h4>
            <div className="format-list">
              <span className="format-tag">PNG</span>
              <span className="format-tag">JPEG</span>
              <span className="format-tag">GIF</span>
              <span className="format-tag">WebP</span>
              <span className="format-tag">SVG</span>
              <span className="format-tag">ICO</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
              自动检测 Base64 编码中的图片格式，或粘贴已带 data:image/ 前缀的完整 Data URL
            </p>
          </div>
        )}
      </div>

      <style>{`
        .base64-image-viewer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 32px;
          border: 2px dashed var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-secondary);
        }

        .upload-zone:hover,
        .upload-zone.dragging {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }

        .input-section {
          margin-top: 8px;
        }

        .preview-section {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 16px;
          margin-top: 8px;
        }

        @media (max-width: 768px) {
          .preview-section {
            grid-template-columns: 1fr;
          }
        }

        .preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 12px;
          min-height: 200px;
        }

        .preview-box img {
          object-fit: contain;
        }

        .info-panel {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text);
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          font-family: monospace;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .action-buttons .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-success {
          background: var(--success) !important;
          border-color: var(--success) !important;
          color: white !important;
        }

        .format-hint {
          padding: 24px;
          background: var(--bg-secondary);
          border-radius: 12px;
          text-align: center;
        }

        .format-hint h4 {
          margin: 0 0 12px;
          color: var(--text);
        }

        .format-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .format-tag {
          padding: 4px 12px;
          background: var(--bg-primary);
          border-radius: 16px;
          font-size: 12px;
          font-family: monospace;
          color: var(--text-secondary);
        }

        .error-message {
          font-size: 13px;
        }
      `}</style>
    </ToolLayout>
  )
}
