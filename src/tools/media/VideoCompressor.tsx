import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { useFFmpeg, formatSize, formatDuration, getFileExtension } from '../../hooks/useFFmpeg'
import { Upload, Download, Minimize2, Check, RefreshCw, X, Settings } from 'lucide-react'

interface VideoInfo {
  file: File
  url: string
  duration: number
  width: number
  height: number
}

type QualityPreset = 'high' | 'medium' | 'low' | 'custom'

interface QualityOption {
  value: QualityPreset
  label: string
  description: string
  crf: number
  scale?: string
}

const QUALITY_OPTIONS: QualityOption[] = [
  { value: 'high', label: '高质量', description: '画质优先，文件较大', crf: 18 },
  { value: 'medium', label: '平衡', description: '画质与大小平衡', crf: 23 },
  { value: 'low', label: '高压缩', description: '文件最小，画质降低', crf: 28 },
  { value: 'custom', label: '自定义', description: '手动调节参数', crf: 23 },
]

export default function VideoCompressor() {
  const [video, setVideo] = useState<VideoInfo | null>(null)
  const [quality, setQuality] = useState<QualityPreset>('medium')
  const [customCrf, setCustomCrf] = useState(23)
  const [resolution, setResolution] = useState<string>('original')
  const [targetSize, setTargetSize] = useState<number>(0)
  const [compressed, setCompressed] = useState<{ blob: Blob; url: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { loading: ffmpegLoading, progress, load: loadFfmpeg, execCommand, writeFile, readFile, deleteFile } = useFFmpeg()

  const currentQuality = QUALITY_OPTIONS.find((q) => q.value === quality)!

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/') && !getFileExtension(file.name).match(/^(mp4|avi|mov|mkv|webm|flv|wmv|m4v|3gp)$/)) {
      setError('请上传视频文件')
      return
    }

    setError(null)
    const url = URL.createObjectURL(file)

    const videoEl = document.createElement('video')
    videoEl.preload = 'metadata'

    videoEl.onloadedmetadata = () => {
      setVideo({
        file,
        url,
        duration: videoEl.duration,
        width: videoEl.videoWidth,
        height: videoEl.videoHeight,
      })
      setCompressed(null)
    }

    videoEl.onerror = () => {
      setVideo({
        file,
        url,
        duration: 0,
        width: 0,
        height: 0,
      })
      setCompressed(null)
    }

    videoEl.src = url
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

  const compress = async () => {
    if (!video) return
    setIsCompressing(true)
    setError(null)

    try {
      await loadFfmpeg()

      const inputExt = getFileExtension(video.file.name)
      const inputFileName = `input.${inputExt}`
      const outputFileName = `output.mp4`

      // 写入输入文件
      const { fetchFile } = await import('@ffmpeg/util')
      await writeFile(inputFileName, await fetchFile(video.file))

      // 构建压缩命令
      const args = ['-i', inputFileName]

      // 设置 CRF（质量因子）
      const crfValue = quality === 'custom' ? customCrf : currentQuality.crf
      args.push('-crf', crfValue.toString())

      // 设置分辨率
      if (resolution !== 'original') {
        const [w, h] = resolution.split('x')
        args.push('-vf', `scale=${w}:${h}`)
      }

      // 如果设置了目标大小，计算比特率
      if (targetSize > 0 && video.duration > 0) {
        const targetBitrate = Math.floor((targetSize * 8 * 1024) / video.duration)
        args.push('-b:v', `${targetBitrate}k`)
        args.push('-maxrate', `${Math.floor(targetBitrate * 1.5)}k`)
        args.push('-bufsize', `${targetBitrate * 2}k`)
      }

      // 使用 H.264 编码，优化压缩
      args.push('-c:v', 'libx264', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k')

      // 如果没有设置目标大小，限制最大码率
      if (targetSize === 0) {
        args.push('-maxrate', '5M', '-bufsize', '10M')
      }

      args.push(outputFileName)

      // 执行压缩
      await execCommand(args)

      // 读取输出文件
      const data = await readFile(outputFileName)
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' })

      if (compressed) URL.revokeObjectURL(compressed.url)
      setCompressed({ blob, url: URL.createObjectURL(blob) })

      // 清理临时文件
      await deleteFile(inputFileName)
      await deleteFile(outputFileName)
    } catch (err) {
      setError('压缩失败，请检查文件格式是否支持')
      console.error('Video compression error:', err)
    } finally {
      setIsCompressing(false)
    }
  }

  const download = () => {
    if (!compressed || !video) return
    const a = document.createElement('a')
    a.href = compressed.url
    const baseName = video.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}_compressed.mp4`
    a.click()
  }

  const removeFile = () => {
    if (video) URL.revokeObjectURL(video.url)
    if (compressed) URL.revokeObjectURL(compressed.url)
    setVideo(null)
    setCompressed(null)
    setError(null)
  }

  const compressionRatio = compressed && video
    ? Math.round((1 - compressed.blob.size / video.file.size) * 100)
    : 0

  return (
    <ToolLayout
      title="视频压缩"
      description="压缩视频文件大小，支持质量调节和分辨率调整"
    >
      <div className="vc-inner">
        {/* 上传区域 */}
        <div
          className={`vc-upload ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} strokeWidth={1.5} />
          <p className="vc-upload-text">
            {video ? '点击或拖拽更换视频' : '点击或拖拽上传视频'}
          </p>
          <p className="vc-upload-hint">支持 MP4、AVI、MOV、MKV、WebM 等格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {/* 加载提示 */}
        {ffmpegLoading && (
          <div className="vc-loading">
            <RefreshCw size={18} className="vc-spin" />
            <span>正在加载压缩引擎...</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="vc-error">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 文件信息 */}
        {video && (
          <>
            <div className="vc-info-card">
              <div className="vc-info-header">
                <Minimize2 size={16} />
                <span>视频信息</span>
                <button className="vc-remove-btn" onClick={removeFile} title="移除文件">
                  <X size={16} />
                </button>
              </div>
              <div className="vc-info-content">
                <div className="vc-info-row">
                  <span className="vc-info-label">文件名</span>
                  <span className="vc-info-value vc-filename">{video.file.name}</span>
                </div>
                <div className="vc-info-row">
                  <span className="vc-info-label">大小</span>
                  <span className="vc-info-value">{formatSize(video.file.size)}</span>
                </div>
                {video.duration > 0 && (
                  <>
                    <div className="vc-info-row">
                      <span className="vc-info-label">时长</span>
                      <span className="vc-info-value">{formatDuration(video.duration)}</span>
                    </div>
                    {video.width > 0 && (
                      <div className="vc-info-row">
                        <span className="vc-info-label">分辨率</span>
                        <span className="vc-info-value">{video.width} × {video.height}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 预览 */}
            <div className="vc-preview">
              <video src={video.url} controls className="vc-video" />
            </div>

            {/* 质量选择 */}
            <div className="vc-quality-section">
              <h3 className="vc-section-title">压缩质量</h3>
              <div className="vc-quality-grid">
                {QUALITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`vc-quality-option${quality === opt.value ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="quality"
                      value={opt.value}
                      checked={quality === opt.value}
                      onChange={() => setQuality(opt.value)}
                    />
                    <div className="vc-quality-box">
                      <span className="vc-quality-label">{opt.label}</span>
                      <span className="vc-quality-desc">{opt.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* 自定义 CRF */}
              {quality === 'custom' && (
                <div className="vc-crf-section">
                  <label className="vc-setting-label">
                    CRF 值: {customCrf} <span className="vc-crf-hint">(值越小质量越高，推荐 18-28)</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={35}
                    value={customCrf}
                    onChange={(e) => setCustomCrf(Number(e.target.value))}
                    className="vc-slider"
                  />
                  <div className="vc-slider-marks">
                    <span>高质量</span>
                    <span>平衡</span>
                    <span>高压缩</span>
                  </div>
                </div>
              )}
            </div>

            {/* 分辨率设置 */}
            <div className="vc-settings-section">
              <div className="vc-settings-header">
                <Settings size={16} />
                <span>分辨率</span>
              </div>
              <div className="vc-settings-content">
                <div className="vc-resolution-options">
                  {['original', '1920x1080', '1280x720', '854x480', '640x360'].map((res) => (
                    <button
                      key={res}
                      className={`vc-resolution-btn${resolution === res ? ' active' : ''}`}
                      onClick={() => setResolution(res)}
                    >
                      {res === 'original' ? '原始' : res.split('x')[1] + 'p'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 目标大小 */}
            <div className="vc-target-section">
              <label className="vc-setting-label">
                目标大小 (MB) <span className="vc-target-hint">可选，0 表示不限制</span>
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={targetSize}
                onChange={(e) => setTargetSize(Number(e.target.value))}
                className="vc-target-input"
                placeholder="0"
              />
            </div>

            {/* 压缩按钮 */}
            <button
              className="btn btn-primary"
              onClick={compress}
              disabled={isCompressing || ffmpegLoading}
            >
              {isCompressing ? (
                <><RefreshCw size={18} className="vc-spin" /> 压缩中 {progress}%...</>
              ) : ffmpegLoading ? (
                <><RefreshCw size={18} className="vc-spin" /> 加载引擎中...</>
              ) : (
                <><Minimize2 size={18} /> 开始压缩</>
              )}
            </button>

            {/* 压缩进度 */}
            {isCompressing && (
              <div className="vc-progress">
                <div className="vc-progress-bar">
                  <div className="vc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="vc-progress-text">{progress}%</span>
              </div>
            )}

            {/* 压缩结果 */}
            {compressed && (
              <div className="vc-result">
                <div className="vc-result-card">
                  <div className="vc-result-header">
                    <Check size={20} className="vc-success-icon" />
                    <span>压缩完成</span>
                  </div>
                  <div className="vc-compare">
                    <div className="vc-compare-item">
                      <div className="vc-compare-label">原始</div>
                      <div className="vc-compare-size">{formatSize(video.file.size)}</div>
                    </div>
                    <div className="vc-compare-arrow">→</div>
                    <div className="vc-compare-item">
                      <div className="vc-compare-label">压缩后</div>
                      <div className="vc-compare-size">{formatSize(compressed.blob.size)}</div>
                    </div>
                  </div>
                  <div className="vc-stats">
                    {compressionRatio > 0 ? (
                      <span className="vc-saved">
                        缩小 {formatSize(video.file.size - compressed.blob.size)} ({compressionRatio}%)
                      </span>
                    ) : (
                      <span className="vc-increased">文件增大 {formatSize(compressed.blob.size - video.file.size)}</span>
                    )}
                  </div>
                  <button className="btn btn-success" onClick={download}>
                    <Download size={18} /> 下载压缩视频
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .vc-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vc-upload {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .vc-upload:hover, .vc-upload.dragging {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .vc-upload svg {
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .vc-upload-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--text);
        }

        .vc-upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .vc-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .vc-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }

        .vc-info-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .vc-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .vc-remove-btn {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .vc-remove-btn:hover {
          background: var(--bg-hover);
          color: #ef4444;
        }

        .vc-info-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vc-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .vc-info-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .vc-info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vc-filename {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
        }

        .vc-preview {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .vc-video {
          width: 100%;
          max-height: 300px;
          display: block;
        }

        .vc-quality-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .vc-section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .vc-quality-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .vc-quality-option {
          display: flex;
          cursor: pointer;
        }

        .vc-quality-option input {
          display: none;
        }

        .vc-quality-box {
          flex: 1;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s;
        }

        .vc-quality-option.active .vc-quality-box {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .vc-quality-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }

        .vc-quality-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .vc-crf-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .vc-setting-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
          display: block;
          margin-bottom: 8px;
        }

        .vc-crf-hint, .vc-target-hint {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: normal;
        }

        .vc-slider {
          width: 100%;
          accent-color: var(--primary);
        }

        .vc-slider-marks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .vc-settings-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .vc-settings-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .vc-settings-content {
          padding: 16px;
        }

        .vc-resolution-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vc-resolution-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vc-resolution-btn:hover {
          border-color: var(--primary);
        }

        .vc-resolution-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .vc-target-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .vc-target-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
        }

        .vc-target-input:focus {
          outline: none;
          border-color: var(--primary);
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

        .vc-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vc-progress-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .vc-progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .vc-progress-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          min-width: 40px;
          text-align: right;
        }

        .vc-result {
          animation: vcFadeIn 0.3s ease;
        }

        @keyframes vcFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes vcSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vc-spin {
          animation: vcSpin 1s linear infinite;
        }

        .vc-result-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .vc-result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .vc-success-icon {
          color: #22c55e;
        }

        .vc-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 16px;
        }

        .vc-compare-item {
          text-align: center;
        }

        .vc-compare-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .vc-compare-size {
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
        }

        .vc-compare-arrow {
          font-size: 24px;
          color: var(--text-secondary);
        }

        .vc-stats {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .vc-saved {
          color: #22c55e;
          font-weight: 500;
        }

        .vc-increased {
          color: #ef4444;
        }

        @media (max-width: 480px) {
          .vc-quality-grid {
            grid-template-columns: 1fr;
          }

          .vc-compare {
            flex-direction: column;
          }

          .vc-compare-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </ToolLayout>
  )
}
