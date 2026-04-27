// src/tools/entertainment/BlackHole.tsx
// 黑洞吞噬游戏 - 控制黑洞吸引并吞噬物体

import { useState, useEffect, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'

// ============== 类型定义 ==============
interface Vector2 {
  x: number
  y: number
}

interface GameObject {
  id: number
  x: number
  y: number
  radius: number
  mass: number
  color: string
  type: 'planet' | 'star' | 'danger' | 'bonus'
  velocity: Vector2
  rotation: number
  rotationSpeed: number
  active: boolean
}

interface BlackHole {
  x: number
  y: number
  radius: number
  mass: number
  growth: number
  rotation: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  life: number
  maxLife: number
}

interface TrailPoint {
  x: number
  y: number
  time: number
}

type GameState = 'start' | 'playing' | 'paused' | 'gameover'

// ============== 常量配置 ==============
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const GRAVITY_CONSTANT = 0.5
const MAX_SPEED = 8
const FRICTION = 0.98

const OBJECT_TYPES = {
  planet: {
    radius: 10,
    mass: 1,
    color: '#3b82f6',
    points: 10,
    spawnChance: 0.6,
  },
  star: {
    radius: 15,
    mass: 1.5,
    color: '#fbbf24',
    points: 25,
    spawnChance: 0.2,
  },
  danger: {
    radius: 12,
    mass: 0.5,
    color: '#ef4444',
    points: -50,
    spawnChance: 0.15,
  },
  bonus: {
    radius: 8,
    mass: 0.8,
    color: '#22c55e',
    points: 100,
    spawnChance: 0.05,
  },
}

// ============== 工具函数 ==============
const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

const randomColor = (baseColor: string, variation = 20) => {
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  
  const newR = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * variation))
  const newG = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * variation))
  const newB = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * variation))
  
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`
}

// ============== 主组件 ==============
export default function BlackHoleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>('start')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('blackhole_highScore')
    return saved ? parseInt(saved, 10) : 0
  })
  const [combo, setCombo] = useState(0)
  const [mass, setMass] = useState(1)
  const [level, setLevel] = useState(1)
  const [objectsConsumed, setObjectsConsumed] = useState(0)
  
  // 游戏对象引用
  const blackHoleRef = useRef<BlackHole>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    radius: 20,
    mass: 1,
    growth: 0,
    rotation: 0,
  })
  
  const objectsRef = useRef<GameObject[]>([])
  const particlesRef = useRef<Particle[]>([])
  const trailRef = useRef<TrailPoint[]>([])
  
  // 游戏控制
  const keysRef = useRef<Set<string>>(new Set())
  const mousePosRef = useRef<Vector2 | null>(null)
  const frameCountRef = useRef(0)
  const spawnTimerRef = useRef(0)
  const comboTimeoutRef = useRef<number | null>(null)
  
  // ============== 游戏逻辑 ==============
  const createObject = useCallback((type: GameObject['type']) => {
    const config = OBJECT_TYPES[type]
    const side = Math.floor(Math.random() * 4)
    let x, y
    
    switch (side) {
      case 0: // 上边
        x = Math.random() * GAME_WIDTH
        y = -config.radius - 10
        break
      case 1: // 右边
        x = GAME_WIDTH + config.radius + 10
        y = Math.random() * GAME_HEIGHT
        break
      case 2: // 下边
        x = Math.random() * GAME_WIDTH
        y = GAME_HEIGHT + config.radius + 10
        break
      case 3: // 左边
        x = -config.radius - 10
        y = Math.random() * GAME_HEIGHT
        break
      default:
        x = 0
        y = 0
    }
    
    const angleToCenter = Math.atan2(
      GAME_HEIGHT / 2 - y,
      GAME_WIDTH / 2 - x
    )
    
    // 给物体一个初始速度，稍微偏离中心
    const initialSpeed = 1 + Math.random() * 2
    const velocity = {
      x: Math.cos(angleToCenter + (Math.random() - 0.5) * 0.5) * initialSpeed,
      y: Math.sin(angleToCenter + (Math.random() - 0.5) * 0.5) * initialSpeed,
    }
    
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      radius: config.radius,
      mass: config.mass,
      color: randomColor(config.color),
      type,
      velocity,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      active: true,
    }
  }, [])
  
  const spawnObject = useCallback(() => {
    const rand = Math.random()
    let type: GameObject['type'] = 'planet'
    let totalChance = 0
    
    for (const [t, config] of Object.entries(OBJECT_TYPES)) {
      totalChance += config.spawnChance
      if (rand <= totalChance) {
        type = t as GameObject['type']
        break
      }
    }
    
    objectsRef.current.push(createObject(type))
  }, [createObject])
  
  const createParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      const life = 20 + Math.random() * 30
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1 + Math.random() * 3,
        color,
        life,
        maxLife: life,
      })
    }
  }, [])
  
  const createAbsorptionEffect = useCallback((x: number, y: number, color: string) => {
    const blackHole = blackHoleRef.current
    const angle = Math.atan2(blackHole.y - y, blackHole.x - x)
    const distanceToHole = distance(x, y, blackHole.x, blackHole.y)
    
    for (let i = 0; i < 8; i++) {
      const offset = (i - 3.5) * 0.2
      const startX = x + Math.cos(angle + offset) * 10
      const startY = y + Math.sin(angle + offset) * 10
      const targetX = blackHole.x + Math.cos(angle + offset) * (blackHole.radius + 2)
      const targetY = blackHole.y + Math.sin(angle + offset) * (blackHole.radius + 2)
      
      const life = distanceToHole * 2
      particlesRef.current.push({
        x: startX,
        y: startY,
        vx: (targetX - startX) / life,
        vy: (targetY - startY) / life,
        radius: 1 + Math.random() * 2,
        color,
        life,
        maxLife: life,
      })
    }
  }, [])
  
  const consumeObject = useCallback((object: GameObject, index: number) => {
    const config = OBJECT_TYPES[object.type]
    const blackHole = blackHoleRef.current
    
    // 更新分数
    const points = config.points
    const newScore = score + points
    setScore(newScore)
    
    // 更新连击
    const newCombo = combo + 1
    setCombo(newCombo)
    
    if (points > 0) {
      // 增加黑洞质量
      blackHole.mass += object.mass * 0.1
      blackHole.growth = object.radius * 0.5
      setMass(Math.floor(blackHole.mass * 10))
      
      // 更新物体吞噬计数
      setObjectsConsumed(prev => prev + 1)
      
      // 检查等级升级
      if (objectsConsumed + 1 >= level * 10) {
        setLevel(prev => prev + 1)
      }
    } else {
      // 危险物体减少质量
      blackHole.mass = Math.max(1, blackHole.mass - 0.5)
      setMass(Math.floor(blackHole.mass * 10))
      setCombo(0) // 危险物体重置连击
    }
    
    // 创建吸收效果
    createAbsorptionEffect(object.x, object.y, object.color)
    
    // 创建爆炸粒子
    createParticles(object.x, object.y, object.color, 12)
    
    // 移除物体
    objectsRef.current.splice(index, 1)
    
    // 连击超时重置
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current)
    }
    
    comboTimeoutRef.current = window.setTimeout(() => {
      setCombo(0)
    }, 2000)
    
    return points
  }, [score, combo, objectsConsumed, level, createAbsorptionEffect, createParticles])
  
  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return
    
    const blackHole = blackHoleRef.current
    frameCountRef.current++
    
    // 更新黑洞
    blackHole.rotation += 0.01
    blackHole.growth = Math.max(0, blackHole.growth - 0.2)
    blackHole.radius = 20 + blackHole.mass * 2 + blackHole.growth
    
    // 更新黑洞位置（键盘控制）
    const speed = 3 + blackHole.mass * 0.1
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
      blackHole.x -= speed
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
      blackHole.x += speed
    }
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('KeyW')) {
      blackHole.y -= speed
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('KeyS')) {
      blackHole.y += speed
    }
    
    // 鼠标控制
    if (mousePosRef.current) {
      const targetX = mousePosRef.current.x
      const targetY = mousePosRef.current.y
      const dx = targetX - blackHole.x
      const dy = targetY - blackHole.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 5) {
        const moveSpeed = Math.min(speed, dist * 0.1)
        blackHole.x += (dx / dist) * moveSpeed
        blackHole.y += (dy / dist) * moveSpeed
      }
    }
    
    // 边界限制
    blackHole.x = Math.max(blackHole.radius, Math.min(GAME_WIDTH - blackHole.radius, blackHole.x))
    blackHole.y = Math.max(blackHole.radius, Math.min(GAME_HEIGHT - blackHole.radius, blackHole.y))
    
    // 添加轨迹点
    trailRef.current.push({
      x: blackHole.x,
      y: blackHole.y,
      time: frameCountRef.current,
    })
    
    // 移除旧的轨迹点
    const maxTrailLength = 30
    if (trailRef.current.length > maxTrailLength) {
      trailRef.current.shift()
    }
    
    // 生成新物体
    const spawnInterval = Math.max(20, 60 - level * 2)
    spawnTimerRef.current++
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0
      spawnObject()
    }
    
    // 更新物体
    for (let i = objectsRef.current.length - 1; i >= 0; i--) {
      const obj = objectsRef.current[i]
      if (!obj.active) continue
      
      // 计算到黑洞的距离和引力
      const dx = blackHole.x - obj.x
      const dy = blackHole.y - obj.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < blackHole.radius + obj.radius) {
        // 碰撞检测
        consumeObject(obj, i)
        continue
      }
      
      // 计算引力
      const force = GRAVITY_CONSTANT * blackHole.mass * obj.mass / (dist * dist)
      
      // 更新速度
      obj.velocity.x += (dx / dist) * force
      obj.velocity.y += (dy / dist) * force
      
      // 限制最大速度
      const speed = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2)
      if (speed > MAX_SPEED) {
        obj.velocity.x = (obj.velocity.x / speed) * MAX_SPEED
        obj.velocity.y = (obj.velocity.y / speed) * MAX_SPEED
      }
      
      // 应用摩擦力
      obj.velocity.x *= FRICTION
      obj.velocity.y *= FRICTION
      
      // 更新位置
      obj.x += obj.velocity.x
      obj.y += obj.velocity.y
      
      // 更新旋转
      obj.rotation += obj.rotationSpeed
      
      // 检查是否离开屏幕
      if (
        obj.x < -obj.radius * 2 ||
        obj.x > GAME_WIDTH + obj.radius * 2 ||
        obj.y < -obj.radius * 2 ||
        obj.y > GAME_HEIGHT + obj.radius * 2
      ) {
        objectsRef.current.splice(i, 1)
      }
    }
    
    // 更新粒子
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]
      
      p.x += p.vx
      p.y += p.vy
      p.life--
      
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1)
      }
    }
    
    // 检查游戏结束（黑洞质量归零）
    if (blackHole.mass <= 0) {
      gameOver()
    }
  }, [gameState, level, spawnObject, consumeObject])
  
  const gameOver = useCallback(() => {
    setGameState('gameover')
    
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('blackhole_highScore', score.toString())
    }
    
    // 创建游戏结束粒子效果
    const blackHole = blackHoleRef.current
    createParticles(blackHole.x, blackHole.y, '#000000', 50)
  }, [score, highScore, createParticles])
  
  const resetGame = useCallback(() => {
    blackHoleRef.current = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      radius: 20,
      mass: 1,
      growth: 0,
      rotation: 0,
    }
    
    objectsRef.current = []
    particlesRef.current = []
    trailRef.current = []
    
    setScore(0)
    setCombo(0)
    setMass(1)
    setLevel(1)
    setObjectsConsumed(0)
    
    // 初始化一些物体
    for (let i = 0; i < 5; i++) {
      spawnObject()
    }
  }, [spawnObject])
  
  const startGame = useCallback(() => {
    resetGame()
    setGameState('playing')
  }, [resetGame])
  
  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
  }, [])
  
  // ============== 渲染逻辑 ==============
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 清除画布
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    
    // 绘制网格背景
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, GAME_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(GAME_WIDTH, y)
      ctx.stroke()
    }
    
    // 绘制轨迹
    const trail = trailRef.current
    for (let i = 0; i < trail.length; i++) {
      const point = trail[i]
      const age = frameCountRef.current - point.time
      const alpha = Math.max(0, 1 - age / 30)
      
      ctx.beginPath()
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(128, 90, 213, ${alpha * 0.3})`
      ctx.fill()
    }
    
    // 绘制粒子
    particlesRef.current.forEach(p => {
      const alpha = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
    })
    
    // 绘制物体
    objectsRef.current.forEach(obj => {
      if (!obj.active) return
      
      ctx.save()
      ctx.translate(obj.x, obj.y)
      ctx.rotate(obj.rotation)
      
      // 物体主体
      ctx.beginPath()
      ctx.arc(0, 0, obj.radius, 0, Math.PI * 2)
      ctx.fillStyle = obj.color
      ctx.fill()
      
      // 物体高光
      if (obj.type === 'star') {
        ctx.beginPath()
        ctx.arc(0, 0, obj.radius * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.3
        ctx.fill()
        ctx.globalAlpha = 1
      }
      
      // 危险物体警告符号
      if (obj.type === 'danger') {
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚠', 0, 0)
      }
      
      // 奖励物体符号
      if (obj.type === 'bonus') {
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('★', 0, 0)
      }
      
      ctx.restore()
      
      // 引力线（当物体靠近时）
      const dx = blackHoleRef.current.x - obj.x
      const dy = blackHoleRef.current.y - obj.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 200) {
        const gradient = ctx.createLinearGradient(
          obj.x, obj.y,
          blackHoleRef.current.x, blackHoleRef.current.y
        )
        gradient.addColorStop(0, obj.color + '80')
        gradient.addColorStop(1, 'transparent')
        
        ctx.beginPath()
        ctx.moveTo(obj.x, obj.y)
        ctx.lineTo(blackHoleRef.current.x, blackHoleRef.current.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })
    
    // 绘制黑洞
    const blackHole = blackHoleRef.current
    const gradient = ctx.createRadialGradient(
      blackHole.x, blackHole.y, 0,
      blackHole.x, blackHole.y, blackHole.radius
    )
    gradient.addColorStop(0, '#805ad5')
    gradient.addColorStop(0.5, '#6b46c1')
    gradient.addColorStop(1, '#000000')
    
    ctx.save()
    ctx.translate(blackHole.x, blackHole.y)
    ctx.rotate(blackHole.rotation)
    
    // 黑洞主体
    ctx.beginPath()
    ctx.arc(0, 0, blackHole.radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // 吸积盘
    ctx.beginPath()
    ctx.arc(0, 0, blackHole.radius * 1.2, 0, Math.PI * 2)
    ctx.strokeStyle = '#d53f8c'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    ctx.stroke()
    ctx.globalAlpha = 1
    
    // 事件视界环
    ctx.beginPath()
    ctx.arc(0, 0, blackHole.radius * 0.9, 0, Math.PI * 2)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    ctx.stroke()
    ctx.globalAlpha = 1
    
    // 奇点（中心）
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    
    ctx.restore()
    
    // 黑洞引力场
    const fieldGradient = ctx.createRadialGradient(
      blackHole.x, blackHole.y, blackHole.radius,
      blackHole.x, blackHole.y, blackHole.radius * 3
    )
    fieldGradient.addColorStop(0, 'rgba(128, 90, 213, 0.2)')
    fieldGradient.addColorStop(1, 'transparent')
    
    ctx.beginPath()
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius * 3, 0, Math.PI * 2)
    ctx.fillStyle = fieldGradient
    ctx.fill()
  }, [])
  
  // ============== React Hooks ==============
  const updateRef = useRef(updateGame)
  const drawRef = useRef(draw)
  
  useEffect(() => {
    updateRef.current = updateGame
    drawRef.current = draw
  })
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const gameLoop = () => {
      updateRef.current()
      drawRef.current(ctx)
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])
  
  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyW', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
      
      keysRef.current.add(e.code)
      
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause()
        }
      }
      
      if (e.code === 'Space') {
        if (gameState === 'start' || gameState === 'gameover') {
          startGame()
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, togglePause, startGame])
  
  // 鼠标控制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = GAME_WIDTH / rect.width
      const scaleY = GAME_HEIGHT / rect.height
      mousePosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
    
    const handleMouseLeave = () => {
      mousePosRef.current = null
    }
    
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])
  
  // 点击开始
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const handleClick = () => {
      if (gameState === 'start' || gameState === 'gameover') {
        startGame()
      }
    }
    
    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [gameState, startGame])
  
  // ============== 渲染 ==============
  return (
    <ToolLayout
      title="黑洞吞噬"
      description="控制黑洞吸引并吞噬物体，避开危险物体，连击获得高分！"
    >
      <div className="blackhole-game">
        {/* 游戏信息面板 */}
        <div className="game-info">
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">分数</span>
              <span className="info-value score">{score.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">最高分</span>
              <span className="info-value highscore">{highScore.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">质量</span>
              <span className="info-value mass">{mass}</span>
            </div>
            <div className="info-item">
              <span className="info-label">连击</span>
              <span className="info-value combo">
                {combo > 0 ? `x${combo}` : '0'}
                {combo >= 3 && <span className="combo-bonus">+{combo * 5}%</span>}
              </span>
            </div>
          </div>
          
          <div className="info-section">
            <div className="info-item">
              <span className="info-label">等级</span>
              <span className="info-value level">Lv.{level}</span>
            </div>
            <div className="info-item">
              <span className="info-label">吞噬</span>
              <span className="info-value consumed">{objectsConsumed}</span>
            </div>
          </div>
        </div>
        
        {/* 游戏画布 */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="game-canvas"
          />
          
          {/* 开始界面 */}
          {gameState === 'start' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h1 className="game-title">⚫ 黑洞吞噬</h1>
                <div className="instructions">
                  <div className="instruction-section">
                    <h3>🎮 控制方式</h3>
                    <ul>
                      <li>方向键/WASD 移动黑洞</li>
                      <li>鼠标移动控制</li>
                      <li>空格键 开始游戏</li>
                      <li>P/ESC 暂停游戏</li>
                    </ul>
                  </div>
                  
                  <div className="instruction-section">
                    <h3>🎯 游戏目标</h3>
                    <ul>
                      <li>吸引并吞噬物体增长黑洞</li>
                      <li>保持连击获得额外分数</li>
                      <li>避开红色危险物体</li>
                      <li>收集绿色奖励物体获得高分</li>
                    </ul>
                  </div>
                  
                  <div className="object-legend">
                    <h3>📊 物体说明</h3>
                    <div className="legend-grid">
                      <div className="legend-item">
                        <div className="legend-color planet"></div>
                        <span className="legend-text">行星 +10分</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color star"></div>
                        <span className="legend-text">恒星 +25分</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color danger"></div>
                        <span className="legend-text">危险 -50分</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color bonus"></div>
                        <span className="legend-text">奖励 +100分</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="start-button" onClick={startGame}>
                  开始游戏
                </button>
              </div>
            </div>
          )}
          
          {/* 暂停界面 */}
          {gameState === 'paused' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h2>游戏暂停</h2>
                <div className="paused-stats">
                  <p>当前分数: {score.toLocaleString()}</p>
                  <p>黑洞质量: {mass}</p>
                  <p>连击: x{combo}</p>
                </div>
                <button className="start-button" onClick={togglePause}>
                  继续游戏
                </button>
              </div>
            </div>
          )}
          
          {/* 游戏结束界面 */}
          {gameState === 'gameover' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h2>游戏结束</h2>
                <div className="final-stats">
                  <div className="stat-item">
                    <span className="stat-label">最终分数</span>
                    <span className="stat-value big">{score.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">最高分</span>
                    <span className="stat-value">{highScore.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">吞噬物体</span>
                    <span className="stat-value">{objectsConsumed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">最大连击</span>
                    <span className="stat-value">x{combo}</span>
                  </div>
                </div>
                
                {score >= highScore && score > 0 && (
                  <div className="new-record">
                    🏆 新纪录！ 🏆
                  </div>
                )}
                
                <button className="start-button" onClick={startGame}>
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 控制提示 */}
        <div className="controls-hint">
          <span>方向键/WASD/鼠标移动</span>
          <span>•</span>
          <span>空格开始/重新开始</span>
          <span>•</span>
          <span>P暂停</span>
        </div>
      </div>
      
      <style>{`
        .blackhole-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }
        
        .game-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          width: 100%;
          max-width: 800px;
          background: rgba(0, 0, 0, 0.5);
          padding: 16px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(128, 90, 213, 0.3);
        }
        
        .info-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .info-label {
          font-size: 14px;
          color: #a0aec0;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 20px;
          font-weight: bold;
        }
        
        .score {
          color: #fbbf24;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }
        
        .highscore {
          color: #22c55e;
        }
        
        .mass {
          color: #805ad5;
        }
        
        .combo {
          color: #ec4899;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .combo-bonus {
          font-size: 12px;
          background: rgba(236, 72, 153, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .level {
          color: #3b82f6;
        }
        
        .consumed {
          color: #f97316;
        }
        
        .canvas-container {
          position: relative;
          border: 2px solid rgba(128, 90, 213, 0.5);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            0 0 60px rgba(128, 90, 213, 0.3),
            inset 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .game-canvas {
          display: block;
          cursor: crosshair;
        }
        
        .game-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
        }
        
        .overlay-content {
          text-align: center;
          color: white;
          padding: 40px;
          max-width: 600px;
          background: rgba(10, 10, 26, 0.9);
          border-radius: 16px;
          border: 2px solid rgba(128, 90, 213, 0.5);
        }
        
        .game-title {
          font-size: 48px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #805ad5, #d53f8c);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 30px rgba(128, 90, 213, 0.5);
        }
        
        .instructions {
          text-align: left;
          margin-bottom: 30px;
        }
        
        .instruction-section {
          margin-bottom: 24px;
        }
        
        .instruction-section h3 {
          color: #805ad5;
          margin-bottom: 12px;
          font-size: 18px;
        }
        
        .instruction-section ul {
          list-style: none;
          padding-left: 0;
        }
        
        .instruction-section li {
          margin: 8px 0;
          color: #cbd5e0;
          font-size: 15px;
        }
        
        .object-legend {
          margin-top: 24px;
        }
        
        .object-legend h3 {
          color: #805ad5;
          margin-bottom: 16px;
          font-size: 18px;
        }
        
        .legend-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        
        .legend-color.planet {
          background: #3b82f6;
          box-shadow: 0 0 10px #3b82f6;
        }
        
        .legend-color.star {
          background: #fbbf24;
          box-shadow: 0 0 10px #fbbf24;
        }
        
        .legend-color.danger {
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
        }
        
        .legend-color.bonus {
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }
        
        .legend-text {
          color: #cbd5e0;
          font-size: 14px;
        }
        
        .start-button {
          padding: 16px 40px;
          font-size: 20px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #805ad5, #d53f8c);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 20px;
        }
        
        .start-button:hover {
          transform: scale(1.05);
          box-shadow: 
            0 0 30px rgba(128, 90, 213, 0.5),
            0 0 60px rgba(213, 63, 140, 0.3);
        }
        
        .start-button:active {
          transform: scale(0.98);
        }
        
        .paused-stats,
        .final-stats {
          margin: 24px 0;
          color: #cbd5e0;
        }
        
        .final-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 32px 0;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #a0aec0;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #fbbf24;
        }
        
        .stat-value.big {
          font-size: 36px;
          color: #805ad5;
        }
        
        .new-record {
          font-size: 24px;
          color: #fbbf24;
          margin: 24px 0;
          animation: pulse 1.5s infinite;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }
        
        .controls-hint {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #718096;
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 850px) {
          .game-canvas {
            width: 100%;
            height: auto;
          }
          
          .game-info {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .game-title {
            font-size: 36px;
          }
          
          .legend-grid {
            grid-template-columns: 1fr;
          }
          
          .final-stats {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 600px) {
          .controls-hint {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .overlay-content {
            padding: 20px;
          }
          
          .game-title {
            font-size: 28px;
          }
        }
      `}</style>
    </ToolLayout>
  )
}