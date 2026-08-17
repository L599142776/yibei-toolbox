import { useState, useRef, useCallback, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
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
  { extension: 'ogg', name: 'OGG', mime: 'audio/ogg', description: '开源压缩格式' },
  { extension: 'flac', name: 'FLAC', mime: 'audio/flac', description: '无损压缩' },
  { extension: 'aac', name: 'AAC', mime: 'audio/aac', description: '高效压缩' },
  { extension: 'm4a', name: 'M4A', mime: 'audio/mp4', description: 'Apple 音频格式' },
]

interface AudioInfo {
  file: File
  url: string
  duration: number
  sampleRate: number
  channels: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export default function AudioConverter() {
  const [audio, setAudio] = useState<AudioInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('mp3')
  const [bitrate, setBitrate] = useState(192)
  const [sampleRate, setSampleRate] = useState(44100)
  const [converted, setConverted] = useState<{ blob: Blob; url: string } | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<any>(null)

  const currentFormat = OUTPUT_FORMATS.find((f) => f.extension === selectedFormat)!

  // 加载 ffmpeg.wasm
  const loadFfmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current

    setFfmpegLoading(true)
    setError(null)

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')

      const ffmpeg = new FFmpeg()

      ffmpeg.on('progress', ({ progress: p }: { progress: number }) => {
        setProgress(Math.round(p * 100))
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      ffmpegRef.current = ffmpeg
      return ffmpeg
    } catch (err) {
      setError('加载转换引擎失败，请检查网络连接后重试')
      throw err
    } finally {
      setFfmpegLoading(false)
    }
  }, [])

  // 预加载 ffmpeg
  useEffect(() => {
    loadFfmpeg().catch(() => {})
  }, [loadFfmpeg])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !getFileExtension(file.name).match(/^(mp3|wav|ogg|flac|aac|m4a|wma|opus|ape|alac)$/)) {
      setError('请上传音频文件')
      return
    }

    setError(null)
    const url = URL.createObjectURL(file)

    try {
      const audioContext = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      setAudio({
        file,
        url,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
      })
      setConverted(null)
      setProgress(0)
    } catch {
      // 如果无法解码，仍然允许用户尝试转换
      setAudio({
        file,
        url,
        duration: 0,
        sampleRate: 0,
        channels: 0,
      })
      setConverted(null)
      setProgress(0)
    }
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
    if (!audio) return
    setIsConverting(true)
    setProgress(0)
    setError(null)

    try {
      const ffmpeg = await loadFfmpeg()

      const inputExt = getFileExtension(audio.file.name)
      const inputFileName = `input.${inputExt}`
      const outputFileName = `output.${selectedFormat}`

      // 写入输入文件
      const { fetchFile } = await import('@ffmpeg/util')
      await ffmpeg.writeFile(inputFileName, await fetchFile(audio.file))

      // 构建转换命令
      const args = ['-i', inputFileName]

      // 设置采样率
      args.push('-ar', sampleRate.toString())

      // 根据格式设置编码参数
      switch (selectedFormat) {
        case 'mp3':
          args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`)
          break
        case 'ogg':
          args.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`)
          break
        case 'flac':
          args.push('-c:a', 'flac')
          break
        case 'aac':
        case 'm4a':
          args.push('-c:a', 'aac', '-b:a', `${bitrate}k`)
          break
        case 'wav':
          args.push('-c:a', 'pcm_s16le')
          break
      }

      args.push(outputFileName)

      // 执行转换
      await ffmpeg.exec(args)

      // 读取输出文件
      const data = await ffmpeg.readFile(outputFileName)
      const blob = new Blob([data], { type: currentFormat.mime })

      if (converted) URL.revokeObjectURL(converted.url)
      setConverted({ blob, url: URL.createObjectURL(blob) })

      // 清理临时文件
      await ffmpeg.deleteFile(inputFileName)
      await ffmpeg.deleteFile(outputFileName)
    } catch (err) {
      setError('转换失败，请检查文件格式是否支持')
      console.error('Audio conversion error:', err)
    } finally {
      setIsConverting(false)
    }
  }

  const download = () => {
    if (!converted || !audio) return
    const a = document.createElement('a')
    a.href = converted.url
    const baseName = audio.file.name.replace(/\.[^.]+$/, '')
    a.download = `${baseName}.${selectedFormat}`
    a.click()
  }

  const removeFile = () => {
    if (audio) URL.revokeObjectURL(audio.url)
    if (converted) URL.revokeObjectURL(converted.url)
    setAudio(null)
    setConverted(null)
    setProgress(0)
    setError(null)
  }

  const sourceExt = audio ? getFileExtension(audio.file.name) : ''

  return (
    <ToolLayout
      title="音频格式转换"
      description="将音频转换为 MP3、WAV、OGG、FLAC、AAC、M4A 等格式"
    >
      <div className="audio-inner">
        {/* 上传区域 */}
        <div
          className={`audio-upload ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload size={48} strokeWidth={1.5} />
          <p className="audio-upload-text">
            {audio ? '点击或拖拽更换音频' : '点击或拖拽上传音频'}
          </p>
          <p className="audio-upload-hint">支持 MP3、WAV、OGG、FLAC、AAC、M4A、WMA 等格式</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {/* 加载提示 */}
        {ffmpegLoading && (
          <div className="audio-loading">
            <RefreshCw size={18} className="audio-spin" />
            <span>正在加载转换引擎...</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="audio-error">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 文件信息 */}
        {audio && (
          <>
            <div className="audio-info-card">
              <div className="audio-info-header">
                <Music size={16} />
                <span>音频信息</span>
                <button className="audio-remove-btn" onClick={removeFile} title="移除文件">
                  <X size={16} />
                </button>
              </div>
              <div className="audio-info-content">
                <div className="audio-info-row">
                  <span className="audio-info-label">文件名</span>
                  <span className="audio-info-value audio-filename">{audio.file.name}</span>
                </div>
                <div className="audio-info-row">
                  <span className="audio-info-label">格式</span>
                  <span className="audio-info-value">{sourceExt.toUpperCase()}</span>
                </div>
                <div className="audio-info-row">
                  <span className="audio-info-label">大小</span>
                  <span className="audio-info-value">{formatSize(audio.file.size)}</span>
                </div>
                {audio.duration > 0 && (
                  <>
                    <div className="audio-info-row">
                      <span className="audio-info-label">时长</span>
                      <span className="audio-info-value">{formatDuration(audio.duration)}</span>
                    </div>
                    <div className="audio-info-row">
                      <span className="audio-info-label">采样率</span>
                      <span className="audio-info-value">{audio.sampleRate} Hz</span>
                    </div>
                    <div className="audio-info-row">
                      <span className="audio-info-label">声道</span>
                      <span className="audio-info-value">{audio.channels === 1 ? '单声道' : '立体声'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 格式选择 */}
            <div className="audio-format-section">
              <h3 className="audio-section-title">目标格式</h3>
              <div className="audio-format-grid">
                {OUTPUT_FORMATS.map((fmt) => (
                  <label key={fmt.extension} className={`audio-format-option${selectedFormat === fmt.extension ? ' active' : ''}`}>
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
                    <span className="audio-format-box">
                      {selectedFormat === fmt.extension ? <Check size={20} /> : fmt.extension.toUpperCase()}
                    </span>
                    <span className="audio-format-label">{fmt.name}</span>
                    <span className="audio-format-desc">{fmt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 参数设置 */}
            <div className="audio-settings-section">
              <div className="audio-settings-header">
                <Settings size={16} />
                <span>转换参数</span>
              </div>
              <div className="audio-settings-content">
                {selectedFormat !== 'wav' && selectedFormat !== 'flac' && (
                  <div className="audio-setting-item">
                    <label className="audio-setting-label">
                      比特率: {bitrate} kbps
                    </label>
                    <input
                      type="range"
                      min={64}
                      max={320}
                      step={32}
                      value={bitrate}
                      onChange={(e) => setBitrate(Number(e.target.value))}
                      className="audio-slider"
                    />
                    <div className="audio-slider-marks">
                      <span>64</span>
                      <span>128</span>
                      <span>192</span>
                      <span>256</span>
                      <span>320</span>
                    </div>
                  </div>
                )}
                <div className="audio-setting-item">
                  <label className="audio-setting-label">
                    采样率: {sampleRate / 1000} kHz
                  </label>
                  <div className="audio-samplerate-options">
                    {[8000, 16000, 22050, 44100, 48000].map((rate) => (
                      <button
                        key={rate}
                        className={`audio-samplerate-btn${sampleRate === rate ? ' active' : ''}`}
                        onClick={() => setSampleRate(rate)}
                      >
                        {rate / 1000}k
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
                <><RefreshCw size={18} className="audio-spin" /> 转换中 {progress}%...</>
              ) : ffmpegLoading ? (
                <><RefreshCw size={18} className="audio-spin" /> 加载引擎中...</>
              ) : (
                <><RefreshCw size={18} /> 转换为 {currentFormat.name}</>
              )}
            </button>

            {/* 转换进度 */}
            {isConverting && (
              <div className="audio-progress">
                <div className="audio-progress-bar">
                  <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="audio-progress-text">{progress}%</span>
              </div>
            )}

            {/* 转换结果 */}
            {converted && (
              <div className="audio-result">
                <div className="audio-result-card">
                  <div className="audio-result-header">
                    <Check size={20} className="audio-success-icon" />
                    <span>转换完成</span>
                  </div>
                  <div className="audio-compare">
                    <div className="audio-compare-item">
                      <div className="audio-compare-label">原始</div>
                      <div className="audio-compare-format">{sourceExt.toUpperCase()}</div>
                      <div className="audio-compare-size">{formatSize(audio.file.size)}</div>
                    </div>
                    <div className="audio-compare-arrow">→</div>
                    <div className="audio-compare-item">
                      <div className="audio-compare-label">转换后</div>
                      <div className="audio-compare-format">{currentFormat.name}</div>
                      <div className="audio-compare-size">{formatSize(converted.blob.size)}</div>
                    </div>
                  </div>
                  <div className="audio-stats">
                    {converted.blob.size < audio.file.size ? (
                      <span className="audio-saved">缩小 {formatSize(audio.file.size - converted.blob.size)} ({Math.round((1 - converted.blob.size / audio.file.size) * 100)}%)</span>
                    ) : converted.blob.size > audio.file.size ? (
                      <span className="audio-increased">增大 {formatSize(converted.blob.size - audio.file.size)}</span>
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
        .audio-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .audio-upload {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
        }

        .audio-upload:hover, .audio-upload.dragging {
          border-color: var(--primary);
          background: var(--bg-hover);
        }

        .audio-upload svg {
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .audio-upload-text {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 8px;
          color: var(--text);
        }

        .audio-upload-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .audio-loading {
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

        .audio-error {
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

        .audio-info-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .audio-info-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .audio-remove-btn {
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

        .audio-remove-btn:hover {
          background: var(--bg-hover);
          color: #ef4444;
        }

        .audio-info-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .audio-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .audio-info-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .audio-info-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .audio-filename {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
        }

        .audio-format-section {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .audio-section-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px;
          color: var(--text);
        }

        .audio-format-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .audio-format-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
        }

        .audio-format-option input {
          display: none;
        }

        .audio-format-box {
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

        .audio-format-option.active .audio-format-box {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .audio-format-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .audio-format-desc {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .audio-settings-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .audio-settings-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .audio-settings-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .audio-setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .audio-setting-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .audio-slider {
          width: 100%;
          accent-color: var(--primary);
        }

        .audio-slider-marks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .audio-samplerate-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .audio-samplerate-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .audio-samplerate-btn:hover {
          border-color: var(--primary);
        }

        .audio-samplerate-btn.active {
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

        .audio-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .audio-progress-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }

        .audio-progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .audio-progress-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          min-width: 40px;
          text-align: right;
        }

        .audio-result {
          animation: audioFadeIn 0.3s ease;
        }

        @keyframes audioFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes audioSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .audio-spin {
          animation: audioSpin 1s linear infinite;
        }

        .audio-result-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .audio-result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 500;
        }

        .audio-success-icon {
          color: #22c55e;
        }

        .audio-compare {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-bottom: 16px;
        }

        .audio-compare-item {
          text-align: center;
        }

        .audio-compare-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .audio-compare-format {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .audio-compare-size {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .audio-compare-arrow {
          font-size: 24px;
          color: var(--text-secondary);
        }

        .audio-stats {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .audio-saved {
          color: #22c55e;
        }

        .audio-increased {
          color: #ef4444;
        }

        @media (max-width: 480px) {
          .audio-format-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .audio-compare {
            flex-direction: column;
          }

          .audio-compare-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </ToolLayout>
  )
}
