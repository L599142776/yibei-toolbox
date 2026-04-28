import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
import { useCursor, type CursorStyle } from '../contexts/CursorContext'

interface TrailDot {
  id: number
  x: number
  y: number
  opacity: number
}

interface Sparkle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
}

export default function CustomCursor() {
  const { settings } = useCursor()
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [isPointer, setIsPointer] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [trails, setTrails] = useState<TrailDot[]>([])
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [isTouchDevice] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0)
  const [ringPosition, setRingPosition] = useState({ x: 0, y: 0 })
  const mousePos = useRef({ x: 0, y: 0 })
  const trailIdCounter = useRef(0)
  const sparkleIdCounter = useRef(0)
  const animationFrame = useRef<number>(0)
  const lastTrailTime = useRef(0)

  const checkPointerElement = useCallback((target: HTMLElement) => {
    const clickableSelectors = 'a, button, [role="button"], input, select, textarea, [onclick], [cursor="pointer"]'
    const isClickable = target.closest(clickableSelectors) !== null
    const computedStyle = window.getComputedStyle(target)
    setIsPointer(isClickable || computedStyle.cursor === 'pointer')
  }, [])

  const addTrail = useCallback((x: number, y: number) => {
    const now = Date.now()
    const trailInterval = 30
    if (now - lastTrailTime.current < trailInterval) return
    lastTrailTime.current = now

    const newTrail: TrailDot = {
      id: trailIdCounter.current++,
      x,
      y,
      opacity: 1,
    }

    setTrails((prev) => {
      const updated = [...prev, newTrail]
      return updated.slice(-settings.trailLength)
    })
  }, [settings.trailLength])

  const addSparkle = useCallback((x: number, y: number) => {
    const count = 3
    const newSparkles: Sparkle[] = []
    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: sparkleIdCounter.current++,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      })
    }
    setSparkles((prev) => [...prev, ...newSparkles].slice(-20))
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY }

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }

    setRingPosition({ x: e.clientX, y: e.clientY })

    checkPointerElement(e.target as HTMLElement)

    if (settings.style === 'trail' || settings.style === 'sparkle') {
      addTrail(e.clientX, e.clientY)
    }

    if (settings.style === 'sparkle' && Math.random() > 0.85) {
      addSparkle(e.clientX, e.clientY)
    }
  }, [settings.style, checkPointerElement, addTrail, addSparkle])

  const handleMouseDown = useCallback(() => {
    setIsClicking(true)

    if (settings.clickEffect && ringRef.current) {
      ringRef.current.classList.remove('cursor-ring-animate')
      void ringRef.current.offsetWidth
      ringRef.current.classList.add('cursor-ring-animate')
    }

    if (settings.style === 'sparkle') {
      addSparkle(mousePos.current.x, mousePos.current.y)
    }
  }, [settings.clickEffect, settings.style, addSparkle])

  const handleMouseUp = useCallback(() => {
    setIsClicking(false)
  }, [])

  useEffect(() => {
    if (isTouchDevice || !settings.enabled) return

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isTouchDevice, settings.enabled, handleMouseMove, handleMouseDown, handleMouseUp])

  useEffect(() => {
    if (isTouchDevice || !settings.enabled) return

    const fadeTrails = () => {
      setTrails((prev) =>
        prev
          .map((dot) => ({ ...dot, opacity: dot.opacity - settings.trailFade * 0.05 }))
          .filter((dot) => dot.opacity > 0)
      )
      setSparkles((prev) =>
        prev
          .map((s) => ({ ...s, scale: s.scale * 0.95, opacity: s.scale }))
          .filter((s) => s.scale > 0.1)
      )
      animationFrame.current = requestAnimationFrame(fadeTrails)
    }

    animationFrame.current = requestAnimationFrame(fadeTrails)

    return () => {
      cancelAnimationFrame(animationFrame.current)
    }
  }, [isTouchDevice, settings.enabled, settings.trailFade])

  useEffect(() => {
    if (isTouchDevice || !settings.enabled) {
      document.body.style.cursor = ''
    } else {
      document.body.style.cursor = 'none'
    }

    return () => {
      document.body.style.cursor = ''
    }
  }, [isTouchDevice, settings.enabled])

  if (isTouchDevice || !settings.enabled) return null

  const getCursorStyle = (style: CursorStyle): CSSProperties => {
    const base: CSSProperties = {
      width: `${settings.size}px`,
      height: `${settings.size}px`,
      backgroundColor: settings.color,
    }

    switch (style) {
      case 'glow':
        return {
          ...base,
          backgroundColor: settings.color,
          boxShadow: `
            0 0 ${settings.size}px ${settings.color},
            0 0 ${settings.size * 2}px ${settings.color}80,
            0 0 ${settings.size * 3}px ${settings.color}40
          `,
        }
      case 'ring':
        return {
          ...base,
          backgroundColor: 'transparent',
          border: `2px solid ${settings.color}`,
        }
      case 'sparkle':
        return {
          ...base,
          backgroundColor: 'transparent',
          width: `${settings.size * 1.5}px`,
          height: `${settings.size * 1.5}px`,
        }
      case 'crosshair':
        return {
          ...base,
          backgroundColor: 'transparent',
          width: `${settings.size}px`,
          height: `${settings.size}px`,
        }
      default:
        return base
    }
  }

  const renderCursorContent = () => {
    switch (settings.style) {
      case 'sparkle':
        return (
          <svg
            width={settings.size * 1.5}
            height={settings.size * 1.5}
            viewBox="0 0 24 24"
            fill={settings.color}
          >
            <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
          </svg>
        )
      case 'crosshair':
        return (
          <>
            <div
              className="crosshair-h"
              style={{ backgroundColor: settings.color, width: `${settings.size}px`, height: '1px' }}
            />
            <div
              className="crosshair-v"
              style={{ backgroundColor: settings.color, width: '1px', height: `${settings.size}px` }}
            />
            <div
              className="crosshair-dot"
              style={{ backgroundColor: settings.color, width: '3px', height: '3px' }}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="cursor-container">
        <div
          ref={cursorRef}
          className={`cursor-dot cursor-${settings.style} ${isPointer ? 'cursor-pointer' : ''} ${isClicking ? 'cursor-click' : ''}`}
          style={{
            ...getCursorStyle(settings.style),
            ['--cursor-color' as string]: settings.color,
          }}
        >
          {renderCursorContent()}
        </div>

        {(settings.style === 'ring' || settings.clickEffect) && (
          <div
            ref={ringRef}
            className="cursor-ring"
            style={{
              width: `${settings.size * 2}px`,
              height: `${settings.size * 2}px`,
              borderColor: settings.color,
              transform: `translate(${ringPosition.x}px, ${ringPosition.y}px)`,
            }}
          />
        )}
      </div>

      {settings.style === 'trail' && trails.map((dot) => (
        <div
          key={dot.id}
          className="cursor-trail"
          style={{
            left: `${dot.x}px`,
            top: `${dot.y}px`,
            width: `${settings.size * 0.6}px`,
            height: `${settings.size * 0.6}px`,
            backgroundColor: settings.color,
            opacity: dot.opacity * settings.trailFade,
          }}
        />
      ))}

      {settings.style === 'sparkle' && sparkles.map((s) => (
        <div
          key={s.id}
          className="cursor-sparkle-particle"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill={settings.color}>
            <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
          </svg>
        </div>
      ))}
    </>
  )
}
