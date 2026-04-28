import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: ReactNode
}

let globalToasts: Toast[] = []
let listeners: ((toasts: Toast[]) => void)[] = []

function notify() {
  listeners.forEach((fn) => fn([...globalToasts]))
}

export function toast(message: ReactNode, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2)
  globalToasts.push({ id, type, message })
  notify()

  setTimeout(() => {
    globalToasts = globalToasts.filter((t) => t.id !== id)
    notify()
  }, 3000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  return { toasts }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="toaster">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} />}
          {t.type === 'error' && <XCircle size={18} />}
          {t.type === 'info' && <Info size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}