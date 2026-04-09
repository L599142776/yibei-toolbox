// 文件上传组件

import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, Map, FileText, AlertCircle, Settings2 } from 'lucide-react'
import type { FileParseOptions } from '../types'
import Select from '../../../components/ui/Select'

interface FileUploaderProps {
  onFileSelect: (file: File, options?: FileParseOptions) => void
  isLoading?: boolean
  error?: string | null
}

export function FileUploader({ onFileSelect, isLoading, error }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [headerRow, setHeaderRow] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const headerRowOptions = Array.from({ length: 11 }, (_, i) => ({
    value: String(i),
    label: `第 ${i + 1} 行`,
  }))

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFile(files[0])
    // 重置 input 值，允许再次选择相同文件时仍能触发 onChange 事件
    e.target.value = ''
  }

  const handleFile = (file: File) => {
    onFileSelect(file, { headerRow })
  }

  return (
    <div className="file-uploader">
      {/* Excel 表头行设置 */}
      <div className="file-uploader-header-row">
        <Settings2 className="file-uploader-icon" />
        <label className="file-uploader-label">Excel 表头行:</label>
        <Select
          value={String(headerRow)}
          onChange={(value) => setHeaderRow(Number(value))}
          options={headerRowOptions}
          width={100}
        />
        <span className="file-uploader-hint">(从 0 开始计数)</span>
      </div>

      {/* 拖拽上传区域 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`file-uploader-dropzone ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.zip,.csv,.json"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={isLoading}
        />

        <div className="file-uploader-content">
          {/* 上传图标 */}
          <div className={`file-uploader-icon-wrap ${isDragOver ? 'drag-over' : ''}`}>
            {isLoading ? (
              <div className="file-uploader-spinner"><Upload className="file-uploader-upload-icon" /></div>
            ) : (
              <Upload className={`file-uploader-upload-icon ${isDragOver ? 'bounce' : ''}`} />
            )}
          </div>

          {/* 主标题 */}
          <div className="file-uploader-main">
            <p className="file-uploader-title">
              {isLoading ? '正在解析文件...' : (
                <><span className="file-uploader-highlight">点击上传</span><span className="file-uploader-sub"> 或拖拽文件到此处</span></>
              )}
            </p>
            <p className="file-uploader-desc">支持 Excel、Shapefile、CSV、JSON 格式</p>
          </div>

          {/* 支持的文件类型 */}
          <div className="file-uploader-types">
            <div className="file-uploader-type">
              <div className="file-uploader-type-icon green">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="file-uploader-type-name">Excel</span>
            </div>
            <div className="file-uploader-type">
              <div className="file-uploader-type-icon blue">
                <Map className="w-5 h-5" />
              </div>
              <span className="file-uploader-type-name">Shapefile</span>
            </div>
            <div className="file-uploader-type">
              <div className="file-uploader-type-icon orange">
                <FileText className="w-5 h-5" />
              </div>
              <span className="file-uploader-type-name">CSV/JSON</span>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="file-uploader-error">
          <AlertCircle className="file-uploader-error-icon" />
          <span className="file-uploader-error-text">{error}</span>
        </div>
      )}
    </div>
  )
}
