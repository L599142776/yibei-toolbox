import { useEffect, useState } from 'react'
import { Smartphone } from 'lucide-react'

interface Particle {
  size: number
  background: string
  left: string
  top: string
  durationSec: number
  delaySec: number
}

function createParticles(count: number): Particle[] {
  const colors = ['99, 102, 241', '139, 92, 246', '236, 72, 153']
  return Array.from({ length: count }, () => {
    const size = Math.random() * 4 + 2
    const alpha = Math.random() * 0.5 + 0.3
    const color = colors[Math.floor(Math.random() * colors.length)]
    return {
      size,
      background: `rgba(${color}, ${alpha})`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      durationSec: Math.random() * 3 + 2,
      delaySec: Math.random() * 2,
    }
  })
}

export default function GlobalLoading({ message = '加载中...' }: { message?: string }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setParticles(createParticles(15)))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
      }} />
      
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${p.size}px`,
          height: `${p.size}px`,
          background: p.background,
          borderRadius: '50%',
          left: p.left,
          top: p.top,
          animation: `float ${p.durationSec}s ease-in-out infinite`,
          animationDelay: `${p.delaySec}s`,
        }} />
      ))}
      
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        animation: 'pulse 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        bottom: '15%',
        right: '15%',
        animation: 'pulse 5s ease-in-out infinite reverse',
      }} />
      
      <div style={{ position: 'relative', width: 120, height: 120, zIndex: 1 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '4px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.6), inset 0 0 20px rgba(99, 102, 241, 0.3)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 12,
          border: '4px solid rgba(139, 92, 246, 0.1)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1.4s linear infinite reverse',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 24,
          border: '4px solid rgba(168, 85, 247, 0.1)',
          borderTopColor: '#a855f7',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 36,
          border: '3px solid rgba(236, 72, 153, 0.1)',
          borderTopColor: '#ec4899',
          borderRadius: '50%',
          animation: 'spin 1.1s linear infinite reverse',
          boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 48,
          border: '2px solid rgba(99, 102, 241, 0.05)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.5s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Smartphone size={32} color="#6366f1" style={{
            filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))',
          }} />
        </div>
      </div>
      
      <div style={{
        marginTop: 40,
        fontSize: 20,
        color: '#fff',
        fontWeight: 600,
        letterSpacing: '3px',
        textShadow: '0 0 30px rgba(99, 102, 241, 0.8)',
        zIndex: 1,
      }}>
        艺北工具箱
      </div>
      <div style={{
        marginTop: 12,
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        zIndex: 1,
      }}>
        {message}
      </div>
    </div>
  )
}
