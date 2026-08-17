import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { useFFmpeg, formatSize, formatDuration, getFileExtension } from '../../hooks/useFFmpeg'
import { Upload, Download, Video, Check, RefreshCw, X, Settings } from 'lucide-react'

interface OutputFormat {
  extension: string
  name: string
  mime: string
  description: string
  codecs: string[]
}

const OUTPUT_FORMATS: OutputFormat[] = [
  { extension: 'mp4', name: 'MP4', mime: 'video/mp4', description: '通用格式，兼容性最好', codecs: ['h264', 'aac'] },
  { extension: 'webm', name: 'WebM', mime: 'video/webm', description: 'Web 优化格式', codecs: ['vp8', 'vorbis'] },
  { extension: 'avi', name: 'AVI', mime: 'video/x-msvideo', description: '经典视频格式', codecs: ['mpeg4', 'mp3'] },
  { extension: 'mov', name: 'MOV', mime: 'video/quicktime', description: 'Apple 视频格式', codecs: ['h264', 'aac'] },
  { extension: 'mkv', name: 'MKV', mime: 'video/x-matroska', description: '高质量容器格式', codecs: ['h264', 'aac'] },
  { extension: 'gif', name: 'GIF', mime: 'image/gif', description: '动图格式', codecs: ['gif'] },
]

interface VideoInfo {
  file: File
  url: string
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
}

export default function VideoConverter() {
  const [video, setVideo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('mp4')
  const [resolution, setResolution] = useState<string>('original')
  const [fps, setFps] = useState<number>(0)
  const [converted, setConverted] = useState<{ blob: Blob; url: string } | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const { loading: ffmpegLoading, progress, load: loadFfmpeg, execCommand, writeFile, readFile, deleteFile } = useFFmpeg()

  const currentFormat = OUTPUT_FORMATS.find((f) => f.extension === selectedFormat)!

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
        fps: 0,
        bitrate: 0,
      })
      setConverted(null)
    }

    videoEl.onerror = () => {
      setVideo({
        file,
        url,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
      })
      setConverted(null)
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

  const convert = async () => {
    if (!video) return
    setIsConverting(true)
    setError(null)

    try {
      await loadFfmpeg()

      const inputExt = getFileExtension(video.file.name)
      const inputFileName = `input.${inputExt}`
      const outputFileName = `output.${selectedFormat}`

      // 写入输入文件
      const { fetchFile } = await import('@ffmpeg/util')
      await writeFile(inputFileName, await fetchFile(video.file))

      // 构建转换命令
      const args = ['-i', inputFileName]

      // 设置分辨率
      if (resolution !== 'original') {
        const [w, h] = resolution.split('x')
        args.push('-vf', `scale=${w}:${h}`)
      }

      // 设置帧率
      if (fps > 0) {
        args.push('-r', fps.toString())
      }

      // 根据格式设置编码
      switch (selectedFormat) {
        case 'mp4':
          args.push('-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast')
          break
        case 'webm':
          args.push('-c:v', 'libvpx', '-c:a', 'libvorbis', '-b:v', '1M')
          break
        case 'avi':
          args.push('-c:v', 'mpeg4', '-c:a', 'libmp3lame', '-q:v', '5')
          break
        case 'mov':
          args.push('-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast')
          break
        case 'mkv':
          args.push('-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast')
          break
        case 'gif':
          args.push('-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0')
          break
      }

      args.push(outputFileName)

      // 执行转换
      await execCommand(args)

      // 读取输出文件
      const data = await readFile(outputFileName)
      const blob = new Blob([data.buffer as ArrayBuffer], { type: currentFormat.mime })

      if (converted) URL.revokeObjectURL(converted.url)
      setConverted({ blob, url: URL.createObjectURL(blob) })

      // 清理临时文件
      await deleteFile(inputFileName)
      await deleteFile(outputFileName)
    } catch (err) {
      setError('转换失败，请检查文件格式是否支持')
      console.error('Video conversion error:', err)
    } finally {
      setIsConverting(false)
    }
  }

  const download = () => {
    if (!converted || !video) return
    const a = document.createElement('a')
    a.href = converted.url
    const baseName = video.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}.${selectedFormat}`
    a.click()
  }

  const removeFile = () => {
    if (video) URL.revokeObjectURL(video.url)
    if (converted) URL.revokeObjectURL(converted.url)
    setVideo(null)
    setConverted(null)
    setError(null)
  }

  const sourceExt = video ? getFileExtension(video.file.name) : ''

  return (
    <ToolLayout
      title="视频格式转换"
      description="将视频转换为 MP4、WebM、AVI、MOV、MKV、GIF 等格式"
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
          <p className="vc-upload-hint">支持 MP4、AVI、MOV、MKV、WebM、FLV 等格式</p>
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
            <span>正在加载转换引擎...</span>
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
                <Video size={16} />
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
                  <span className="vc-info-label">格式</span>
                  <span className="vc-info-value">{sourceExt.toUpperCase()}</span>
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
              <video
                ref={videoRef}
                src={video.url}
                controls
                className="vc-video"
              />
            </div>

            {/* 格式选择 */}
            <div className="vc-format-section">
              <h3 className="vc-section-title">目标格式</h3>
              <div className="vc-format-grid">
                {OUTPUT_FORMATS.map((fmt) => (
                  <label key={fmt.extension} className={`vc-format-option${selectedFormat === fmt.extension ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value={fmt.extension}
                      checked={selectedFormat === fmt.extension}
                      onChange={() => {
                        setSelectedFormat(fmt.extension)
                        setConverted(null)
                      }}
                    />
                    <span className="vc-format-box">
                      {selectedFormat === fmt.extension ? <Check size={20} /> : fmt.extension.toUpperCase()}
                    </span>
                    <span className="vc-format-label">{fmt.name}</span>
                    <span className="vc-format-desc">{fmt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 参数设置 */}
            <div className="vc-settings-section">
              <div className="vc-settings-header">
                <Settings size={16} />
                <span>转换参数</span>
              </div>
              <div className="vc-settings-content">
                <div className="vc-setting-item">
                  <label className="vc-setting-label">分辨率</label>
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
                <div className="vc-setting-item">
                  <label className="vc-setting-label">帧率 (FPS)</label>
                  <div className="vc-fps-options">
                    {[0, 24, 25, 30, 60].map((f) => (
                      <button
                        key={f}
                        className={`vc-fps-btn${fps === f ? ' active' : ''}`}
                        onClick={() => setFps(f)}
                      >
                        {f === 0 ? '原始' : f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 转换按钮 */}
            <button
              className="btn btn-primary"
              onClick={convert}
              disabled={isConverting || ffmpegLoading}
            >
              {isConverting ? (
                <><RefreshCw size={18} className="vc-spin" /> 转换中 {progress}%...</>
              ) : ffmpegLoading ? (
                <><RefreshCw size={18} className="vc-spin" /> 加载引擎中...</>
              ) : (
                <><RefreshCw size={18} /> 转换为 {currentFormat.name}</>
              )}
            </button>

            {/* 转换进度 */}
            {isConverting && (
              <div className="vc-progress">
                <div className="vc-progress-bar">
                  <div className="vc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="vc-progress-text">{progress}%</span>
              </div>
            )}

            {/* 转换结果 */}
            {converted && (
              <div className="vc-result">
                <div className="vc-result-card">
                  <div className="vc-result-header">
                    <Check size={20} className="vc-success-icon" />
                    <span>转换完成</span>
                  </div>
                  <div className="vc-compare">
                    <div className="vc-compare-item">
                      <div className="vc-compare-label">原始</div>
                      <div className="vc-compare-format">{sourceExt.toUpperCase()}</div>
                      <div className="vc-compare-size">{formatSize(video.file.size)}</div>
                    </div>
                    <div className="vc-compare-arrow">→</div>
                    <div className="vc-compare-item">
                      <div className="vc-compare-label">转换后</div>
                      <div className="vc-compare-format">{currentFormat.name}</div>
                      <div className="vc-compare-size">{formatSize(converted.blob.size)}</div>
                    </div>
                  </div>
                  <div className="vc-stats">
                    {converted.blob.size < video.file.size ? (
                      <span className="vc-saved">缩小 {formatSize(video.file.size - converted.blob.size)} ({Math.round((1 - converted.blob.size / video.file.size) * 100)}%)</span>
                    ) : converted.blob.size > video.file.size ? (
                      <span className="vc-increased">增大 {formatSize(converted.blob.size - video.file.size)}</span>
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

        .vc-format-section {
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

        .vc-format-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .vc-format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
        }

        .vc-format-option input {
          display: none;
        }

        .vc-format-box {
          width: 64px;
          height: 56px;
          border: 2px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: var(--bg);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .vc-format-option.active .vc-format-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .vc-format-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vc-format-desc {
          font-size: 11px;
          color: var(--text-secondary);
          text-align: center;
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
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .vc-setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vc-setting-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vc-resolution-options, .vc-fps-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vc-resolution-btn, .vc-fps-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vc-resolution-btn:hover, .vc-fps-btn:hover {
          border-color: var(--primary);
        }

        .vc-resolution-btn.active, .vc-fps-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
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

        .vc-compare-format {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .vc-compare-size {
          font-size: 13px;
          color: var(--text-secondary);
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
        }

        .vc-increased {
          color: #ef4444;
        }

        @media (max-width: 480px) {
          .vc-format-grid {
            grid-template-columns: repeat(2, 1fr);
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
