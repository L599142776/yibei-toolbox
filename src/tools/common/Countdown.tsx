// src/tools/common/Countdown.tsx
import { useState, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

export default function Countdown() {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [cdInput, setCdInput] = useState({ min: 5, sec: 0 })
  const intervalRef = useRef<number>(0)

  const start = useCallback(() => {
    if (running) return
    setRunning(true)
    const startMs = Date.now()
    const initial = mode === 'countdown' ? (cdInput.min * 60 + cdInput.sec) * 1000 - time : time

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startMs
      if (mode === 'countdown') {
        const remaining = initial - elapsed
        if (remaining <= 0) {
          setTime(0)
          setRunning(false)
          clearInterval(intervalRef.current)
          return
        }
        setTime(remaining)
      } else {
        setTime(initial + elapsed)
      }
    }, 30)
  }, [running, mode, time, cdInput])

  const pause = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
  }

  const reset = () => {
    pause()
    setTime(mode === 'countdown' ? (cdInput.min * 60 + cdInput.sec) * 1000 : 0)
  }

  return (
    <ToolLayout title="计时器 / 倒计时" description="秒表计时和倒计时功能">
      <div className="btn-group">
        <button className={`btn ${mode === 'stopwatch' ? '' : 'btn-outline'}`} onClick={() => { setMode('stopwatch'); pause(); setTime(0) }}>
          秒表
        </button>
        <button className={`btn ${mode === 'countdown' ? '' : 'btn-outline'}`} onClick={() => { setMode('countdown'); pause(); setTime(0) }}>
          倒计时
        </button>
      </div>

      {mode === 'countdown' && !running && (
        <div className="tool-row" style={{ marginBottom: 16 }}>
          <input className="input" type="number" min={0} max={999} value={cdInput.min}
            onChange={(e) => setCdInput({ ...cdInput, min: Number(e.target.value) })} style={{ width: 70 }} />
          <span>分</span>
          <input className="input" type="number" min={0} max={59} value={cdInput.sec}
            onChange={(e) => setCdInput({ ...cdInput, sec: Number(e.target.value) })} style={{ width: 70 }} />
          <span>秒</span>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 48, fontFamily: 'monospace', margin: '40px 0', fontWeight: 700 }}>
        {formatTime(time)}
      </div>

      <div className="btn-group" style={{ justifyContent: 'center' }}>
        {!running ? (
          <button className="btn" onClick={start}><Play size={18} /> 开始</button>
        ) : (
          <button className="btn" onClick={pause}><Pause size={18} /> 暂停</button>
        )}
        <button className="btn btn-outline" onClick={reset}><RotateCcw size={18} /> 重置</button>
      </div>
    </ToolLayout>
  )
}
