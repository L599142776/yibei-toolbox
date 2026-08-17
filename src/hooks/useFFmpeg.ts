import { useState, useRef, useCallback, useEffect } from 'react'

interface UseFFmpegReturn {
  ffmpeg: any
  loading: boolean
  error: string | null
  progress: number
  setProgress: (p: number) => void
  load: () => Promise<any>
  execCommand: (args: string[]) => Promise<void>
  writeFile: (name: string, data: Uint8Array) => Promise<void>
  readFile: (name: string) => Promise<Uint8Array>
  deleteFile: (name: string) => Promise<void>
}

export function useFFmpeg(): UseFFmpegReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const ffmpegRef = useRef<any>(null)
  const loadPromiseRef = useRef<Promise<any> | null>(null)

  const load = useCallback(async () => {
    // 已加载则直接返回
    if (ffmpegRef.current) return ffmpegRef.current

    // 正在加载中则等待
    if (loadPromiseRef.current) return loadPromiseRef.current

    setLoading(true)
    setError(null)

    loadPromiseRef.current = (async () => {
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { toBlobURL } = await import('@ffmpeg/util')

        const ffmpeg = new FFmpeg()

        ffmpeg.on('progress', ({ progress: p }: { progress: number }) => {
          setProgress(Math.min(Math.round(p * 100), 100))
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
        loadPromiseRef.current = null
        throw err
      } finally {
        setLoading(false)
      }
    })()

    return loadPromiseRef.current
  }, [])

  // 预加载
  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const execCommand = useCallback(async (args: string[]) => {
    const ffmpeg = await load()
    await ffmpeg.exec(args)
  }, [load])

  const writeFile = useCallback(async (name: string, data: Uint8Array) => {
    const ffmpeg = await load()
    await ffmpeg.writeFile(name, data)
  }, [load])

  const readFile = useCallback(async (name: string) => {
    const ffmpeg = await load()
    return await ffmpeg.readFile(name)
  }, [load])

  const deleteFile = useCallback(async (name: string) => {
    const ffmpeg = await load()
    await ffmpeg.deleteFile(name)
  }, [load])

  return {
    ffmpeg: ffmpegRef.current,
    loading,
    error,
    progress,
    setProgress,
    load,
    execCommand,
    writeFile,
    readFile,
    deleteFile,
  }
}

// 工具函数：格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// 工具函数：格式化时长
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 工具函数：获取文件扩展名
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}
