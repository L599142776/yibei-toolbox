import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import { useFFmpeg, formatSize, formatDuration, getFileExtension } from '../../hooks/useFFmpeg'
import { Upload, Download, Music, Check, RefreshCw, X, Settings } from 'lucide-react'

interface OutputFormat {
  extension: string
  name: string
  mime: string
  description: string
}

const OUTPUT_FORMATS: OutputFormat[] = [
  { extension: 'mp3', name: 'MP3', mime: 'audio/mpeg', description: '通用压缩格式' },
  { extension: 'wav', name: 'WAV', mime: 'audio/wav', description: '无损音频' },
  { extension: 'aac', name: 'AAC', mime: 'audio/aac', description: '高效压缩' },
  { extension: 'flac', name: 'FLAC', mime: 'audio/flac', description: '无损压缩' },
  { extension: 'ogg', name: 'OGG', mime: 'audio/ogg', description: '开源格式' },
]

interface VideoInfo {
  file: File
  url: string
  duration: number
  width: number
  height: number
}

export default function VideoToAudio() {
  const [video, setVideo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('mp3')
  const [bitrate, setBitrate] = useState(192)
  const [sampleRate, setSampleRate] = useState(44100)
  const [trimStart, setTrimStart] = useState('')
  const [trimEnd, setTrimEnd] = useState('')
  const [extracted, setExtracted] = useState<{ blob: Blob; url: string } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      })
      setExtracted(null)
      setTrimStart('')
      setTrimEnd('')
    }

    videoEl.onerror = () => {
      setVideo({
        file,
        url,
        duration: 0,
        width: 0,
        height: 0,
      })
      setExtracted(null)
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

  const parseTime = (timeStr: string): number | null => {
    if (!timeStr) return null
    const parts = timeStr.split(':')
    if (parts.length === 3) {
      const [h, m, s] = parts.map(Number)
      return h * 3600 + m * 60 + s
    } else if (parts.length === 2) {
      const [m, s] = parts.map(Number)
      return m * 60 + s
    } else {
      return Number(timeStr)
    }
  }

  const extract = async () => {
    if (!video) return
    setIsExtracting(true)
    setError(null)

    try {
      await loadFfmpeg()

      const inputExt = getFileExtension(video.file.name)
      const inputFileName = `input.${inputExt}`
      const outputFileName = `output.${selectedFormat}`

      // 写入输入文件
      const { fetchFile } = await import('@ffmpeg/util')
      await writeFile(inputFileName, await fetchFile(video.file))

      // 构建提取命令
      const args = ['-i', inputFileName]

      // 设置裁剪
      const start = parseTime(trimStart)
      const end = parseTime(trimEnd)

      if (start !== null && start > 0) {
        args.push('-ss', start.toString())
      }

      if (end !== null && end > 0) {
        args.push('-to', end.toString())
      }

      // 只提取音频流
      args.push('-vn')

      // 设置采样率
      args.push('-ar', sampleRate.toString())

      // 根据格式设置编码
      switch (selectedFormat) {
        case 'mp3':
          args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`)
          break
        case 'wav':
          args.push('-c:a', 'pcm_s16le')
          break
        case 'aac':
          args.push('-c:a', 'aac', '-b:a', `${bitrate}k`)
          break
        case 'flac':
          args.push('-c:a', 'flac')
          break
        case 'ogg':
          args.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`)
          break
      }

      args.push(outputFileName)

      // 执行提取
      await execCommand(args)

      // 读取输出文件
      const data = await readFile(outputFileName)
      const blob = new Blob([data.buffer as ArrayBuffer], { type: currentFormat.mime })

      if (extracted) URL.revokeObjectURL(extracted.url)
      setExtracted({ blob, url: URL.createObjectURL(blob) })

      // 清理临时文件
      await deleteFile(inputFileName)
      await deleteFile(outputFileName)
    } catch (err) {
      setError('提取失败，请检查文件格式是否支持')
      console.error('Audio extraction error:', err)
    } finally {
      setIsExtracting(false)
    }
  }

  const download = () => {
    if (!extracted || !video) return
    const a = document.createElement('a')
    a.href = extracted.url
    const baseName = video.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}.${selectedFormat}`
    a.click()
  }

  const removeFile = () => {
    if (video) URL.revokeObjectURL(video.url)
    if (extracted) URL.revokeObjectURL(extracted.url)
    setVideo(null)
    setExtracted(null)
    setError(null)
  }

  const sourceExt = video ? getFileExtension(video.file.name) : ''

  return (
    <ToolLayout
      title="视频提取音频"
      description="从视频文件中提取音频，支持 MP3、WAV、AAC、FLAC、OGG 格式"
    >
      <div className="vta-inner">
        {/* 上传区域 */}
        <div
          className={`vta-upload ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} strokeWidth={1.5} />
          <p className="vta-upload-text">
            {video ? '点击或拖拽更换视频' : '点击或拖拽上传视频'}
          </p>
          <p className="vta-upload-hint">支持 MP4、AVI、MOV、MKV、WebM 等格式</p>
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
          <div className="vta-loading">
            <RefreshCw size={18} className="vta-spin" />
            <span>正在加载提取引擎...</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="vta-error">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 文件信息 */}
        {video && (
          <>
            <div className="vta-info-card">
              <div className="vta-info-header">
                <Music size={16} />
                <span>视频信息</span>
                <button className="vta-remove-btn" onClick={removeFile} title="移除文件">
                  <X size={16} />
                </button>
              </div>
              <div className="vta-info-content">
                <div className="vta-info-row">
                  <span className="vta-info-label">文件名</span>
                  <span className="vta-info-value vta-filename">{video.file.name}</span>
                </div>
                <div className="vta-info-row">
                  <span className="vta-info-label">格式</span>
                  <span className="vta-info-value">{sourceExt.toUpperCase()}</span>
                </div>
                <div className="vta-info-row">
                  <span className="vta-info-label">大小</span>
                  <span className="vta-info-value">{formatSize(video.file.size)}</span>
                </div>
                {video.duration > 0 && (
                  <>
                    <div className="vta-info-row">
                      <span className="vta-info-label">时长</span>
                      <span className="vta-info-value">{formatDuration(video.duration)}</span>
                    </div>
                    {video.width > 0 && (
                      <div className="vta-info-row">
                        <span className="vta-info-label">分辨率</span>
                        <span className="vta-info-value">{video.width} × {video.height}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 预览 */}
            <div className="vta-preview">
              <video src={video.url} controls className="vta-video" />
            </div>

            {/* 格式选择 */}
            <div className="vta-format-section">
              <h3 className="vta-section-title">输出格式</h3>
              <div className="vta-format-grid">
                {OUTPUT_FORMATS.map((fmt) => (
                  <label key={fmt.extension} className={`vta-format-option${selectedFormat === fmt.extension ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value={fmt.extension}
                      checked={selectedFormat === fmt.extension}
                      onChange={() => {
                        setSelectedFormat(fmt.extension)
                        setExtracted(null)
                      }}
                    />
                    <span className="vta-format-box">
                      {selectedFormat === fmt.extension ? <Check size={20} /> : fmt.extension.toUpperCase()}
                    </span>
                    <span className="vta-format-label">{fmt.name}</span>
                    <span className="vta-format-desc">{fmt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 参数设置 */}
            <div className="vta-settings-section">
              <div className="vta-settings-header">
                <Settings size={16} />
                <span>音频参数</span>
              </div>
              <div className="vta-settings-content">
                {selectedFormat !== 'wav' && selectedFormat !== 'flac' && (
                  <div className="vta-setting-item">
                    <label className="vta-setting-label">
                      比特率: {bitrate} kbps
                    </label>
                    <input
                      type="range"
                      min={64}
                      max={320}
                      step={32}
                      value={bitrate}
                      onChange={(e) => setBitrate(Number(e.target.value))}
                      className="vta-slider"
                    />
                    <div className="vta-slider-marks">
                      <span>64</span>
                      <span>128</span>
                      <span>192</span>
                      <span>256</span>
                      <span>320</span>
                    </div>
                  </div>
                )}
                <div className="vta-setting-item">
                  <label className="vta-setting-label">
                    采样率: {sampleRate / 1000} kHz
                  </label>
                  <div className="vta-samplerate-options">
                    {[8000, 16000, 22050, 44100, 48000].map((rate) => (
                      <button
                        key={rate}
                        className={`vta-samplerate-btn${sampleRate === rate ? ' active' : ''}`}
                        onClick={() => setSampleRate(rate)}
                      >
                        {rate / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 裁剪设置 */}
            <div className="vta-trim-section">
              <h3 className="vta-section-title">裁剪音频 <span className="vta-trim-hint">(可选)</span></h3>
              <div className="vta-trim-inputs">
                <div className="vta-trim-item">
                  <label className="vta-trim-label">开始时间</label>
                  <input
                    type="text"
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    placeholder="00:00:00"
                    className="vta-trim-input"
                  />
                </div>
                <div className="vta-trim-item">
                  <label className="vta-trim-label">结束时间</label>
                  <input
                    type="text"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    placeholder="00:00:00"
                    className="vta-trim-input"
                  />
                </div>
              </div>
              <p className="vta-trim-hint-text">
                格式: HH:MM:SS 或 MM:SS 或秒数，留空表示不裁剪
              </p>
            </div>

            {/* 提取按钮 */}
            <button
              className="btn btn-primary"
              onClick={extract}
              disabled={isExtracting || ffmpegLoading}
            >
              {isExtracting ? (
                <><RefreshCw size={18} className="vta-spin" /> 提取中 {progress}%...</>
              ) : ffmpegLoading ? (
                <><RefreshCw size={18} className="vta-spin" /> 加载引擎中...</>
              ) : (
                <><Music size={18} /> 提取音频</>
              )}
            </button>

            {/* 提取进度 */}
            {isExtracting && (
              <div className="vta-progress">
                <div className="vta-progress-bar">
                  <div className="vta-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="vta-progress-text">{progress}%</span>
              </div>
            )}

            {/* 提取结果 */}
            {extracted && (
              <div className="vta-result">
                <div className="vta-result-card">
                  <div className="vta-result-header">
                    <Check size={20} className="vta-success-icon" />
                    <span>提取完成</span>
                  </div>
                  <div className="vta-audio-info">
                    <Music size={32} className="vta-audio-icon" />
                    <div className="vta-audio-details">
                      <span className="vta-audio-format">{currentFormat.name}</span>
                      <span className="vta-audio-size">{formatSize(extracted.blob.size)}</span>
                    </div>
                  </div>
                  <audio src={extracted.url} controls className="vta-audio-player" />
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
        .vta-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .vta-upload {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .vta-upload:hover, .vta-upload.dragging {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .vta-upload svg {
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .vta-upload-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--text);
        }

        .vta-upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .vta-loading {
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

        .vta-error {
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

        .vta-info-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .vta-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .vta-remove-btn {
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

        .vta-remove-btn:hover {
          background: var(--bg-hover);
          color: #ef4444;
        }

        .vta-info-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vta-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .vta-info-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .vta-info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vta-filename {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
        }

        .vta-preview {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
        }

        .vta-video {
          width: 100%;
          max-height: 300px;
          display: block;
        }

        .vta-format-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .vta-section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .vta-trim-hint {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: normal;
        }

        .vta-format-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .vta-format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
        }

        .vta-format-option input {
          display: none;
        }

        .vta-format-box {
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

        .vta-format-option.active .vta-format-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .vta-format-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vta-format-desc {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .vta-settings-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .vta-settings-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .vta-settings-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .vta-setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vta-setting-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vta-slider {
          width: 100%;
          accent-color: var(--primary);
        }

        .vta-slider-marks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .vta-samplerate-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vta-samplerate-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vta-samplerate-btn:hover {
          border-color: var(--primary);
        }

        .vta-samplerate-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .vta-trim-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .vta-trim-inputs {
          display: flex;
          gap: 16px;
        }

        .vta-trim-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vta-trim-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vta-trim-input {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          font-family: monospace;
        }

        .vta-trim-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .vta-trim-hint-text {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 8px 0 0;
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

        .vta-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vta-progress-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .vta-progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .vta-progress-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          min-width: 40px;
          text-align: right;
        }

        .vta-result {
          animation: vtaFadeIn 0.3s ease;
        }

        @keyframes vtaFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes vtaSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vta-spin {
          animation: vtaSpin 1s linear infinite;
        }

        .vta-result-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .vta-result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .vta-success-icon {
          color: #22c55e;
        }

        .vta-audio-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .vta-audio-icon {
          color: var(--primary);
        }

        .vta-audio-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .vta-audio-format {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        .vta-audio-size {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .vta-audio-player {
          width: 100%;
          margin-bottom: 16px;
          border-radius: 8px;
        }

        @media (max-width: 480px) {
          .vta-format-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .vta-trim-inputs {
            flex-direction: column;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
