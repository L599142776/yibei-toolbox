// src/tools/entertainment/AircraftBattle.tsx
// 飞机大战游戏 - 经典垂直射击游戏

import { useEffect, useRef, useState, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'

// ============== Types ==============
interface Vector2 {
  x: number
  y: number
}

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

interface Bullet extends GameObject {
  speed: number
  isEnemy: boolean
}

interface Enemy extends GameObject {
  type: 'basic' | 'zigzag' | 'elite'
  health: number
  speed: number
  phase: number
  shootTimer: number
  shootInterval: number
}

interface PowerUp extends GameObject {
  type: 'triple' | 'shield' | 'bomb'
  speed: number
}

interface Particle extends GameObject {
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

interface Player extends GameObject {
  speed: number
  lives: number
  hasShield: boolean
  hasTripleShot: boolean
  invulnerable: boolean
  invulnerableTimer: number
}

type GameState = 'start' | 'playing' | 'paused' | 'gameover'

// ============== Constants ==============
const GAME_WIDTH = 480
const GAME_HEIGHT = 720
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 48
const ENEMY_WIDTH = 36
const ENEMY_HEIGHT = 40
const BULLET_WIDTH = 6
const BULLET_HEIGHT = 16
const POWERUP_SIZE = 28
const STAR_COUNT = 100

const ENEMY_TYPES = {
  basic: { health: 1, speed: 2, points: 100, color: '#ef4444' },
  zigzag: { health: 1, speed: 1.5, points: 200, color: '#f97316' },
  elite: { health: 2, speed: 1, points: 500, color: '#a855f7' },
}

const POWERUP_SPAWN_CHANCE = 0.08

// ============== Component ==============
export default function AircraftBattle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())
  const mouseRef = useRef<Vector2 | null>(null)

  const [gameState, setGameState] = useState<GameState>('start')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('aircraftBattle_highScore')
    return saved ? parseInt(saved, 10) : 0
  })
  const [lives, setLives] = useState(3)
  const [showBombEffect, setShowBombEffect] = useState(false)
  const [hasTripleShot, setHasTripleShot] = useState(false)
  const [hasShield, setHasShield] = useState(false)

  // Game objects refs
  const playerRef = useRef<Player>({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 6,
    lives: 3,
    hasShield: false,
    hasTripleShot: false,
    active: true,
    invulnerable: false,
    invulnerableTimer: 0,
  })

  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const particlesRef = useRef<Particle[]>([])
  const starsRef = useRef<Star[]>([])

  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const gameStateRef = useRef<GameState>('start')
  const difficultyRef = useRef(1)
  const spawnTimerRef = useRef(0)
  const bulletTimerRef = useRef(0)
  const frameCountRef = useRef(0)

  // Initialize stars
  const initStars = useCallback(() => {
    starsRef.current = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
    }))
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    const player = playerRef.current
    player.x = GAME_WIDTH / 2 - PLAYER_WIDTH / 2
    player.y = GAME_HEIGHT - PLAYER_HEIGHT - 20
    player.lives = 3
    player.hasShield = false
    player.hasTripleShot = false
    player.invulnerable = false
    player.invulnerableTimer = 0
    player.active = true
    setHasShield(false)
    setHasTripleShot(false)

    bulletsRef.current = []
    enemiesRef.current = []
    powerUpsRef.current = []
    particlesRef.current = []
    scoreRef.current = 0
    livesRef.current = 3
    difficultyRef.current = 1
    spawnTimerRef.current = 0
    bulletTimerRef.current = 0
    frameCountRef.current = 0

    setScore(0)
    setLives(3)
    initStars()
  }, [initStars])

  // Spawn enemy
  const spawnEnemy = useCallback(() => {
    const rand = Math.random()
    let type: 'basic' | 'zigzag' | 'elite' = 'basic'
    
    if (rand > 0.85) {
      type = 'elite'
    } else if (rand > 0.6) {
      type = 'zigzag'
    }

    const config = ENEMY_TYPES[type]
    const enemy: Enemy = {
      x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
      y: -ENEMY_HEIGHT,
      width: ENEMY_WIDTH,
      height: ENEMY_HEIGHT,
      type,
      health: config.health,
      speed: config.speed * (1 + difficultyRef.current * 0.1),
      active: true,
      phase: Math.random() * Math.PI * 2,
      shootTimer: 0,
      shootInterval: type === 'elite' ? 90 : 0,
    }
    enemiesRef.current.push(enemy)
  }, [])

  // Spawn power-up
  const spawnPowerUp = useCallback((x: number, y: number) => {
    if (Math.random() > POWERUP_SPAWN_CHANCE) return
    
    const types: ('triple' | 'shield' | 'bomb')[] = ['triple', 'shield', 'bomb']
    const type = types[Math.floor(Math.random() * types.length)]
    
    powerUpsRef.current.push({
      x: x - POWERUP_SIZE / 2,
      y,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      speed: 2,
      active: true,
    })
  }, [])

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = Math.random() * 3 + 2
      particlesRef.current.push({
        x,
        y,
        width: 0,
        height: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: Math.random() * 4 + 2,
        active: true,
      })
    }
  }, [])

  // AABB collision detection
  const checkCollision = (a: GameObject, b: GameObject): boolean => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  // Fire bullet
  const fireBullet = useCallback(() => {
    const player = playerRef.current
    if (!player.active) return

    if (player.hasTripleShot) {
      // Triple shot: center + two angled
      bulletsRef.current.push(
        {
          x: player.x + player.width / 2 - BULLET_WIDTH / 2,
          y: player.y - BULLET_HEIGHT,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: 10,
          active: true,
          isEnemy: false,
        },
        {
          x: player.x + player.width / 4 - BULLET_WIDTH / 2,
          y: player.y - BULLET_HEIGHT + 5,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: 10,
          active: true,
          isEnemy: false,
        },
        {
          x: player.x + (player.width * 3) / 4 - BULLET_WIDTH / 2,
          y: player.y - BULLET_HEIGHT + 5,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          speed: 10,
          active: true,
          isEnemy: false,
        }
      )
    } else {
      bulletsRef.current.push({
        x: player.x + player.width / 2 - BULLET_WIDTH / 2,
        y: player.y - BULLET_HEIGHT,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        speed: 10,
        active: true,
        isEnemy: false,
      })
    }
  }, [])

  // Enemy fire
  const enemyFire = useCallback((enemy: Enemy) => {
    bulletsRef.current.push({
      x: enemy.x + enemy.width / 2 - BULLET_WIDTH / 2,
      y: enemy.y + enemy.height,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      speed: 5,
      active: true,
      isEnemy: true,
    })
  }, [])

  // Player hit
  const playerHit = useCallback(() => {
    const player = playerRef.current
    if (player.invulnerable) return

    if (player.hasShield) {
      player.hasShield = false
      setHasShield(false)
      player.invulnerable = true
      player.invulnerableTimer = 60
      createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#3b82f6', 8)
      return
    }

    livesRef.current--
    setLives(livesRef.current)
    createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ef4444', 16)

    if (livesRef.current <= 0) {
      player.active = false
      gameStateRef.current = 'gameover'
      setGameState('gameover')
      
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current)
        localStorage.setItem('aircraftBattle_highScore', scoreRef.current.toString())
      }
    } else {
      player.invulnerable = true
      player.invulnerableTimer = 120
    }
  }, [createExplosion, highScore])

  const activateBomb = useCallback(() => {
    setShowBombEffect(true)
    setTimeout(() => setShowBombEffect(false), 300)
    
    enemiesRef.current.forEach(enemy => {
      if (enemy.active) {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, ENEMY_TYPES[enemy.type].color)
        scoreRef.current += ENEMY_TYPES[enemy.type].points
        enemy.active = false
      }
    })
    setScore(scoreRef.current)
  }, [createExplosion])

  const update = useCallback(() => {
    if (gameStateRef.current !== 'playing') return

    const player = playerRef.current
    const keys = keysRef.current
    const mouse = mouseRef.current
    frameCountRef.current++

    if (keys.has('ArrowLeft') || keys.has('KeyA')) player.x -= player.speed
    if (keys.has('ArrowRight') || keys.has('KeyD')) player.x += player.speed
    if (keys.has('ArrowUp') || keys.has('KeyW')) player.y -= player.speed
    if (keys.has('ArrowDown') || keys.has('KeyS')) player.y += player.speed

    if (mouse) {
      const targetX = mouse.x - player.width / 2
      const targetY = mouse.y - player.height / 2
      player.x += (targetX - player.x) * 0.15
      player.y += (targetY - player.y) * 0.15
    }

    player.x = Math.max(0, Math.min(GAME_WIDTH - player.width, player.x))
    player.y = Math.max(0, Math.min(GAME_HEIGHT - player.height, player.y))

    if (player.invulnerable) {
      player.invulnerableTimer--
      if (player.invulnerableTimer <= 0) {
        player.invulnerable = false
      }
    }

    bulletTimerRef.current++
    if (bulletTimerRef.current >= 10) {
      bulletTimerRef.current = 0
      fireBullet()
    }

    const spawnInterval = Math.max(30, 80 - difficultyRef.current * 5)
    spawnTimerRef.current++
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0
      spawnEnemy()
    }

    if (frameCountRef.current % 600 === 0) {
      difficultyRef.current = Math.min(difficultyRef.current + 0.2, 5)
    }

    starsRef.current.forEach(star => {
      star.y += star.speed
      if (star.y > GAME_HEIGHT) {
        star.y = 0
        star.x = Math.random() * GAME_WIDTH
      }
    })

    bulletsRef.current.forEach(bullet => {
      if (!bullet.active) return
      bullet.y += bullet.isEnemy ? bullet.speed : -bullet.speed
      
      if (bullet.y < -bullet.height || bullet.y > GAME_HEIGHT) {
        bullet.active = false
      }
    })

    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return

      enemy.y += enemy.speed

      if (enemy.type === 'zigzag') {
        enemy.phase += 0.08
        enemy.x += Math.sin(enemy.phase) * 2
      }

      enemy.x = Math.max(0, Math.min(GAME_WIDTH - enemy.width, enemy.x))

      if (enemy.type === 'elite') {
        enemy.shootTimer++
        if (enemy.shootTimer >= enemy.shootInterval) {
          enemy.shootTimer = 0
          enemyFire(enemy)
        }
      }

      if (enemy.y > GAME_HEIGHT) {
        enemy.active = false
      }

      if (!player.invulnerable && checkCollision(enemy, player)) {
        enemy.active = false
        playerHit()
      }
    })

    powerUpsRef.current.forEach(powerUp => {
      if (!powerUp.active) return
      powerUp.y += powerUp.speed

      if (powerUp.y > GAME_HEIGHT) {
        powerUp.active = false
      }

      if (checkCollision(powerUp, player)) {
        powerUp.active = false
        
        switch (powerUp.type) {
          case 'triple':
            player.hasTripleShot = true
            setHasTripleShot(true)
            setTimeout(() => { 
              player.hasTripleShot = false
              setHasTripleShot(false)
            }, 8000)
            break
          case 'shield':
            player.hasShield = true
            setHasShield(true)
            break
          case 'bomb':
            activateBomb()
            break
        }
        createExplosion(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, '#fbbf24', 8)
      }
    })

    bulletsRef.current.forEach(bullet => {
      if (!bullet.active || bullet.isEnemy) return

      enemiesRef.current.forEach(enemy => {
        if (!enemy.active) return

        if (checkCollision(bullet, enemy)) {
          bullet.active = false
          enemy.health--
          
          if (enemy.health <= 0) {
            enemy.active = false
            scoreRef.current += ENEMY_TYPES[enemy.type].points
            setScore(scoreRef.current)
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, ENEMY_TYPES[enemy.type].color)
            spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
          } else {
            createExplosion(bullet.x, bullet.y, '#fbbf24', 4)
          }
        }
      })
    })

    if (!player.invulnerable) {
      bulletsRef.current.forEach(bullet => {
        if (!bullet.active || !bullet.isEnemy) return
        
        if (checkCollision(bullet, player)) {
          bullet.active = false
          playerHit()
        }
      })
    }

    particlesRef.current.forEach(particle => {
      if (!particle.active) return
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.1
      particle.life--
      
      if (particle.life <= 0) {
        particle.active = false
      }
    })

    bulletsRef.current = bulletsRef.current.filter(b => b.active)
    enemiesRef.current = enemiesRef.current.filter(e => e.active)
    powerUpsRef.current = powerUpsRef.current.filter(p => p.active)
    particlesRef.current = particlesRef.current.filter(p => p.active)
  }, [fireBullet, spawnEnemy, spawnPowerUp, enemyFire, playerHit, activateBomb, createExplosion])

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current

    // Clear
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw stars
    starsRef.current.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw particles
    particlesRef.current.forEach(particle => {
      if (!particle.active) return
      const alpha = particle.life / particle.maxLife
      ctx.fillStyle = particle.color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Draw bullets
    bulletsRef.current.forEach(bullet => {
      if (!bullet.active) return
      
      if (bullet.isEnemy) {
        ctx.fillStyle = '#ef4444'
      } else {
        ctx.fillStyle = '#22d3ee'
      }
      
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      
      // Bullet glow
      ctx.shadowColor = bullet.isEnemy ? '#ef4444' : '#22d3ee'
      ctx.shadowBlur = 8
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      ctx.shadowBlur = 0
    })

    // Draw enemies
    enemiesRef.current.forEach(enemy => {
      if (!enemy.active) return
      
      const config = ENEMY_TYPES[enemy.type]
      
      // Enemy body
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height)
      ctx.lineTo(enemy.x, enemy.y)
      ctx.lineTo(enemy.x + enemy.width, enemy.y)
      ctx.closePath()
      ctx.fill()

      // Wings
      ctx.fillRect(enemy.x - 8, enemy.y + enemy.height * 0.4, 12, 8)
      ctx.fillRect(enemy.x + enemy.width - 4, enemy.y + enemy.height * 0.4, 12, 8)

      // Cockpit
      ctx.fillStyle = '#1e1e1e'
      ctx.beginPath()
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height * 0.5, 6, 0, Math.PI * 2)
      ctx.fill()

      // Elite health indicator
      if (enemy.type === 'elite' && enemy.health > 1) {
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(enemy.x + 4, enemy.y - 6, (enemy.health / 2) * (enemy.width - 8), 3)
      }
    })

    // Draw power-ups
    powerUpsRef.current.forEach(powerUp => {
      if (!powerUp.active) return

      const colors: Record<string, string> = {
        triple: '#22d3ee',
        shield: '#3b82f6',
        bomb: '#ef4444',
      }
      const icons: Record<string, string> = {
        triple: '▲',
        shield: '🛡️',
        bomb: '💣',
      }

      ctx.fillStyle = colors[powerUp.type]
      ctx.beginPath()
      ctx.arc(
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        powerUp.width / 2,
        0,
        Math.PI * 2
      )
      ctx.fill()

      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icons[powerUp.type], powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2)
    })

    // Draw player
    if (player.active) {
      ctx.save()
      
      // Invulnerability flicker
      if (player.invulnerable && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.3
      }

      // Shield effect
      if (player.hasShield) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(
          player.x + player.width / 2,
          player.y + player.height / 2,
          player.width / 2 + 8,
          0,
          Math.PI * 2
        )
        ctx.stroke()
      }

      // Player body (aircraft shape)
      ctx.fillStyle = '#22c55e'
      
      // Main body
      ctx.beginPath()
      ctx.moveTo(player.x + player.width / 2, player.y)
      ctx.lineTo(player.x + player.width, player.y + player.height)
      ctx.lineTo(player.x + player.width / 2, player.y + player.height - 10)
      ctx.lineTo(player.x, player.y + player.height)
      ctx.closePath()
      ctx.fill()

      // Wings
      ctx.fillStyle = '#16a34a'
      ctx.fillRect(player.x - 10, player.y + player.height * 0.5, 14, 10)
      ctx.fillRect(player.x + player.width - 4, player.y + player.height * 0.5, 14, 10)

      // Cockpit
      ctx.fillStyle = '#60a5fa'
      ctx.beginPath()
      ctx.arc(player.x + player.width / 2, player.y + player.height * 0.35, 5, 0, Math.PI * 2)
      ctx.fill()

      // Engine glow
      ctx.fillStyle = '#fbbf24'
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(player.x + player.width / 2 - 8, player.y + player.height, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(player.x + player.width / 2 + 8, player.y + player.height, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.restore()
    }

    // Bomb effect
    if (showBombEffect) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }
  }, [showBombEffect])

  const updateRef = useRef(update)
  const drawRef = useRef(draw)

  useEffect(() => {
    updateRef.current = update
    drawRef.current = draw
  })

  useEffect(() => {
    const gameLoop = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      updateRef.current()
      drawRef.current(ctx)
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  // Start game
  const startGame = useCallback(() => {
    resetGame()
    gameStateRef.current = 'playing'
    setGameState('playing')
  }, [resetGame])

  // Toggle pause
  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused'
      setGameState('paused')
    } else if (gameStateRef.current === 'paused') {
      gameStateRef.current = 'playing'
      setGameState('playing')
    }
  }, [])

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent page scroll when using arrow keys during gameplay
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
      
      keysRef.current.add(e.code)
      
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
          togglePause()
        }
      }
      
      if (e.code === 'Space') {
        if (gameStateRef.current === 'start' || gameStateRef.current === 'gameover') {
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
  }, [togglePause, startGame])

  // Mouse/touch movement
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = GAME_WIDTH / rect.width
      const scaleY = GAME_HEIGHT / rect.height
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = GAME_WIDTH / rect.width
      const scaleY = GAME_HEIGHT / rect.height
      mouseRef.current = {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = null
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Canvas click to start/restart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleClick = () => {
      if (gameStateRef.current === 'start' || gameStateRef.current === 'gameover') {
        startGame()
      }
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [startGame])

  useEffect(() => {
    initStars()
  }, [initStars])

  // ============== Render ==============
  return (
    <ToolLayout
      title="飞机大战"
      description="经典垂直射击游戏，使用方向键或鼠标移动，空格键开始"
    >
      <div className="aircraft-battle">
        {/* HUD */}
        <div className="game-hud">
          <div className="hud-left">
            <span className="score-label">分数</span>
            <span className="score-value">{score.toLocaleString()}</span>
            <span className="high-score">最高: {highScore.toLocaleString()}</span>
          </div>
          <div className="hud-right">
            <div className="lives-container">
              {Array.from({ length: lives }).map((_, i) => (
                <span key={i} className="life-icon">❤️</span>
              ))}
            </div>
            {hasTripleShot && (
              <span className="powerup-indicator triple">🔺 三连发</span>
            )}
            {hasShield && (
              <span className="powerup-indicator shield">🛡️ 护盾</span>
            )}
          </div>
        </div>

        {/* Game Canvas */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="game-canvas"
          />

          {/* Overlay Screens */}
          {gameState === 'start' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h2 className="game-title">飞机大战</h2>
                <div className="start-info">
                  <p>🎮 操作说明</p>
                  <ul>
                    <li>方向键 / WASD / 鼠标移动</li>
                    <li>自动射击 / 空格键发射</li>
                    <li>P / ESC 暂停</li>
                  </ul>
                  <div className="enemy-legend">
                    <p>敌人类型</p>
                    <div className="legend-item">
                      <span style={{ color: '#ef4444' }}>▼</span>
                      <span>普通敌人 (100分)</span>
                    </div>
                    <div className="legend-item">
                      <span style={{ color: '#f97316' }}>▼</span>
                      <span>蛇形敌人 (200分)</span>
                    </div>
                    <div className="legend-item">
                      <span style={{ color: '#a855f7' }}>▼</span>
                      <span>精英敌人 (500分) 可射击</span>
                    </div>
                  </div>
                  <div className="powerup-legend">
                    <p>道具</p>
                    <div className="legend-item">
                      <span>🔺</span>
                      <span>三连发</span>
                    </div>
                    <div className="legend-item">
                      <span>🛡️</span>
                      <span>护盾</span>
                    </div>
                    <div className="legend-item">
                      <span>💣</span>
                      <span>炸弹</span>
                    </div>
                  </div>
                </div>
                <button className="start-btn" onClick={startGame}>
                  开始游戏
                </button>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h2>游戏暂停</h2>
                <button className="start-btn" onClick={togglePause}>
                  继续游戏
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay">
              <div className="overlay-content">
                <h2>游戏结束</h2>
                <div className="final-score">
                  <p>最终得分</p>
                  <span className="big-score">{score.toLocaleString()}</span>
                  {score >= highScore && score > 0 && (
                    <span className="new-record">🏆 新纪录!</span>
                  )}
                </div>
                <button className="start-btn" onClick={startGame}>
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="controls-hint">
          <span>方向键/WASD/鼠标移动</span>
          <span>•</span>
          <span>空格开始</span>
          <span>•</span>
          <span>P暂停</span>
        </div>
      </div>

      <style>{`
        .aircraft-battle {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .game-hud {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 480px;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
        }

        .hud-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .score-label {
          font-size: 12px;
          color: #888;
        }

        .score-value {
          font-size: 24px;
          font-weight: bold;
          color: #fbbf24;
        }

        .high-score {
          font-size: 11px;
          color: #666;
        }

        .hud-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lives-container {
          display: flex;
          gap: 4px;
        }

        .life-icon {
          font-size: 18px;
        }

        .powerup-indicator {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .powerup-indicator.triple {
          color: #22d3ee;
        }

        .powerup-indicator.shield {
          color: #3b82f6;
        }

        .canvas-container {
          position: relative;
          border: 2px solid #333;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
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
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
        }

        .overlay-content {
          text-align: center;
          color: white;
          padding: 32px;
        }

        .game-title {
          font-size: 36px;
          margin-bottom: 24px;
          text-shadow: 0 0 20px #22c55e;
          color: #22c55e;
        }

        .start-info {
          margin-bottom: 24px;
        }

        .start-info p {
          font-size: 16px;
          margin-bottom: 12px;
          color: #aaa;
        }

        .start-info ul {
          list-style: none;
          font-size: 14px;
          color: #ccc;
        }

        .start-info li {
          margin: 6px 0;
        }

        .enemy-legend, .powerup-legend {
          margin-top: 16px;
          text-align: left;
        }

        .enemy-legend p, .powerup-legend p {
          margin-bottom: 8px;
          color: #888;
          font-size: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          margin: 4px 0;
          color: #ccc;
        }

        .final-score {
          margin: 24px 0;
        }

        .final-score p {
          color: #888;
          margin-bottom: 8px;
        }

        .big-score {
          display: block;
          font-size: 48px;
          font-weight: bold;
          color: #fbbf24;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .new-record {
          display: block;
          margin-top: 12px;
          font-size: 18px;
          color: #22c55e;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .start-btn {
          padding: 12px 32px;
          font-size: 18px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .start-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
        }

        .start-btn:active {
          transform: scale(0.98);
        }

        .controls-hint {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </ToolLayout>
  )
}
