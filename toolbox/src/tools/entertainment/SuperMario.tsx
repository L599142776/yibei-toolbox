// src/tools/entertainment/SuperMario.tsx
// 超级马里奥风格平台跳跃游戏

import { useEffect, useRef, useState, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'

interface GameState {
  score: number
  lives: number
  coins: number
  gameOver: boolean
  gameWon: boolean
  gameStarted: boolean
  powerUp: 'none' | 'mushroom' | 'fire'
}

const TILE_SIZE = 32
const GRAVITY = 0.6
const JUMP_FORCE = -12
const MOVE_SPEED = 4
const ENEMY_SPEED = 1.5

const TILE_EMPTY = 0
const TILE_GROUND = 1
const TILE_BRICK = 2
const TILE_QUESTION = 3
const TILE_QUESTION_USED = 4
const TILE_PIPE_TOP = 5
const TILE_PIPE = 6
const TILE_FLAG = 7
const TILE_FLAG_TOP = 8

interface Enemy {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  type: 'goomba' | 'koopa'
  alive: boolean
  shell: boolean
  shellMoving: boolean
  frame: number
  frameTimer: number
}

interface Player {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
  jumping: boolean
  jumpingUp: boolean
  direction: number
  invincible: boolean
  invincibleTimer: number
  frame: number
  frameTimer: number
}

interface Fireball {
  x: number
  y: number
  vx: number
  vy: number
  alive: boolean
}

interface Collectible {
  x: number
  y: number
  vy: number
  vx?: number
  type: 'coin' | 'mushroom' | 'fire'
  active: boolean
}

interface AnimatingCoin {
  x: number
  y: number
  vy: number
  targetY: number
  active: boolean
}

interface QuestionBlock {
  x: number
  y: number
  collected: boolean
  content: 'coin' | 'mushroom' | 'fire'
}

interface EnemySpawn {
  x: number
  y: number
  type: 'goomba' | 'koopa'
}

interface GameData {
  level: number[][]
  questionBlocks: QuestionBlock[]
  player: Player
  enemies: Enemy[]
  fireballs: Fireball[]
  collectibles: Collectible[]
  coins: { x: number; y: number; vy: number; active: boolean; collected: boolean }[]
  camera: { x: number; y: number }
  keys: { left: boolean; right: boolean; jump: boolean }
  lastJumpPress: number
  animatingCoins: AnimatingCoin[]
  score: number
  lives: number
  coinCount: number
  powerUp: 'none' | 'mushroom' | 'fire'
  gameOver: boolean
  gameWon: boolean
  gameStarted: boolean
}

const createLevel = (): number[][] => {
  const level: number[][] = []
  
  for (let y = 0; y < 20; y++) {
    level[y] = []
    for (let x = 0; x < 200; x++) {
      level[y][x] = TILE_EMPTY
    }
  }
  
  for (let x = 0; x < 200; x++) {
    if ((x > 69 && x < 80) || (x > 120 && x < 130)) continue
    level[18][x] = TILE_GROUND
    level[19][x] = TILE_GROUND
  }
  
  for (let y = 14; y < 20; y++) {
    level[y][16] = y === 14 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][17] = y === 14 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][18] = y === 14 ? TILE_PIPE_TOP : TILE_PIPE
  }
  
  level[10][21] = TILE_QUESTION
  level[10][22] = TILE_BRICK
  level[10][23] = TILE_QUESTION
  level[10][24] = TILE_BRICK
  level[6][22] = TILE_QUESTION
  level[6][23] = TILE_BRICK
  level[10][28] = TILE_BRICK
  level[10][29] = TILE_QUESTION
  level[10][30] = TILE_BRICK
  
  for (let x = 22; x < 26; x++) level[10][x] = TILE_BRICK
  
  level[10][36] = TILE_BRICK
  level[10][37] = TILE_BRICK
  level[10][38] = TILE_BRICK
  level[6][37] = TILE_QUESTION
  level[6][38] = TILE_QUESTION
  
  for (let y = 14; y < 20; y++) {
    level[y][45] = y === 14 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][46] = y === 14 ? TILE_PIPE_TOP : TILE_PIPE
  }
  
  for (let y = 12; y < 20; y++) {
    level[y][52] = y === 12 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][53] = y === 12 ? TILE_PIPE_TOP : TILE_PIPE
  }
  
  level[10][60] = TILE_BRICK
  level[10][61] = TILE_QUESTION
  level[10][62] = TILE_BRICK
  level[10][63] = TILE_BRICK
  level[6][61] = TILE_BRICK
  level[6][62] = TILE_BRICK
  
  level[10][75] = TILE_QUESTION
  level[10][76] = TILE_QUESTION
  level[10][77] = TILE_QUESTION
  level[10][78] = TILE_QUESTION
  
  for (let y = 10; y < 20; y++) {
    level[y][85] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][86] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][87] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
  }
  
  for (let y = 10; y < 20; y++) {
    level[y][92] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][93] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
    level[y][94] = y === 10 ? TILE_PIPE_TOP : TILE_PIPE
  }
  
  level[12][100] = TILE_BRICK
  level[12][101] = TILE_BRICK
  level[12][102] = TILE_BRICK
  level[8][100] = TILE_BRICK
  level[8][101] = TILE_QUESTION
  level[8][102] = TILE_BRICK
  
  level[10][115] = TILE_QUESTION
  level[10][116] = TILE_QUESTION
  level[10][117] = TILE_QUESTION
  level[6][115] = TILE_QUESTION
  level[6][116] = TILE_QUESTION
  level[6][117] = TILE_QUESTION
  
  for (let x = 135; x < 150; x++) {
    level[15][x] = TILE_GROUND
    level[16][x] = TILE_GROUND
    level[17][x] = TILE_GROUND
    level[18][x] = TILE_GROUND
    level[19][x] = TILE_GROUND
  }
  
  for (let y = 11; y < 15; y++) {
    for (let x = 140; x < 148; x++) {
      if (y === 11 && x >= 143 && x <= 145) continue
      level[y][x] = TILE_BRICK
    }
  }
  
  for (let x = 140; x < 148; x++) level[10][x] = TILE_BRICK
  level[9][142] = TILE_BRICK
  level[9][143] = TILE_BRICK
  level[9][144] = TILE_BRICK
  level[9][145] = TILE_BRICK
  level[8][143] = TILE_BRICK
  level[8][144] = TILE_BRICK
  level[7][144] = TILE_BRICK
  
  for (let y = 2; y < 15; y++) level[y][152] = TILE_FLAG
  level[1][152] = TILE_FLAG_TOP
  for (let x = 153; x < 158; x++) level[1][x] = TILE_FLAG
  for (let x = 153; x < 157; x++) level[2][x] = TILE_FLAG
  for (let x = 153; x < 156; x++) level[3][x] = TILE_FLAG
  
  for (let y = 12; y < 15; y++) {
    for (let x = 165; x < 175; x++) {
      if (y === 12 && x >= 168 && x <= 171) continue
      level[y][x] = TILE_BRICK
    }
  }
  for (let y = 8; y < 12; y++) {
    for (let x = 167; x < 173; x++) level[y][x] = TILE_BRICK
  }
  for (let x = 165; x < 175; x++) level[7][x] = TILE_BRICK
  level[6][167] = TILE_BRICK
  level[6][168] = TILE_BRICK
  level[6][169] = TILE_BRICK
  level[6][170] = TILE_BRICK
  level[5][168] = TILE_BRICK
  level[5][169] = TILE_BRICK
  level[4][169] = TILE_BRICK
  
  return level
}

const createQuestionBlocks = (): QuestionBlock[] => [
  { x: 21, y: 10, collected: false, content: 'mushroom' },
  { x: 23, y: 10, collected: false, content: 'coin' },
  { x: 22, y: 6, collected: false, content: 'mushroom' },
  { x: 29, y: 10, collected: false, content: 'coin' },
  { x: 37, y: 6, collected: false, content: 'fire' },
  { x: 61, y: 10, collected: false, content: 'mushroom' },
  { x: 75, y: 10, collected: false, content: 'coin' },
  { x: 76, y: 10, collected: false, content: 'coin' },
  { x: 77, y: 10, collected: false, content: 'coin' },
  { x: 78, y: 10, collected: false, content: 'mushroom' },
  { x: 101, y: 8, collected: false, content: 'mushroom' },
  { x: 115, y: 10, collected: false, content: 'coin' },
  { x: 116, y: 10, collected: false, content: 'coin' },
  { x: 117, y: 10, collected: false, content: 'mushroom' },
  { x: 115, y: 6, collected: false, content: 'fire' },
  { x: 116, y: 6, collected: false, content: 'fire' },
  { x: 117, y: 6, collected: false, content: 'fire' },
]

const ENEMY_SPAWNS: EnemySpawn[] = [
  { x: 32, y: 17, type: 'goomba' },
  { x: 40, y: 17, type: 'goomba' },
  { x: 55, y: 17, type: 'goomba' },
  { x: 60, y: 17, type: 'koopa' },
  { x: 70, y: 17, type: 'goomba' },
  { x: 85, y: 17, type: 'goomba' },
  { x: 90, y: 17, type: 'koopa' },
  { x: 95, y: 17, type: 'goomba' },
  { x: 105, y: 17, type: 'goomba' },
  { x: 110, y: 17, type: 'goomba' },
  { x: 115, y: 17, type: 'koopa' },
  { x: 125, y: 17, type: 'goomba' },
  { x: 130, y: 17, type: 'goomba' },
]

const createDefaultPlayer = (): Player => ({
  x: 64,
  y: 512,
  vx: 0,
  vy: 0,
  width: 24,
  height: 32,
  onGround: false,
  jumping: false,
  jumpingUp: false,
  direction: 1,
  invincible: false,
  invincibleTimer: 0,
  frame: 0,
  frameTimer: 0,
})

const createDefaultGameData = (): GameData => ({
  level: createLevel(),
  questionBlocks: createQuestionBlocks(),
  player: createDefaultPlayer(),
  enemies: [],
  fireballs: [],
  collectibles: [],
  coins: [],
  camera: { x: 0, y: 0 },
  keys: { left: false, right: false, jump: false },
  lastJumpPress: 0,
  animatingCoins: [],
  score: 0,
  lives: 3,
  coinCount: 0,
  powerUp: 'none',
  gameOver: false,
  gameWon: false,
  gameStarted: false,
})

export default function SuperMario() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    coins: 0,
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    powerUp: 'none',
  })
  
  const gameRef = useRef<GameData>(createDefaultGameData())
  const animationRef = useRef<number>(0)
  const gameStateRef = useRef(gameState)
  
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])
  
  const initEnemies = useCallback(() => {
    const game = gameRef.current
    game.enemies = ENEMY_SPAWNS.map(spawn => ({
      x: spawn.x * TILE_SIZE,
      y: spawn.y * TILE_SIZE - 32,
      vx: spawn.type === 'goomba' ? -ENEMY_SPEED : -ENEMY_SPEED * 0.5,
      vy: 0,
      width: spawn.type === 'goomba' ? 28 : 24,
      height: spawn.type === 'goomba' ? 28 : 32,
      type: spawn.type,
      alive: true,
      shell: false,
      shellMoving: false,
      frame: 0,
      frameTimer: 0,
    }))
  }, [])
  
  const resetGame = useCallback(() => {
    const game = gameRef.current
    game.level = createLevel()
    game.questionBlocks = createQuestionBlocks()
    game.player = createDefaultPlayer()
    game.fireballs = []
    game.collectibles = []
    game.coins = []
    game.animatingCoins = []
    game.camera = { x: 0, y: 0 }
    game.score = 0
    game.lives = gameStateRef.current.lives
    game.coinCount = 0
    game.powerUp = 'none'
    game.gameOver = false
    game.gameWon = false
    game.gameStarted = true
    initEnemies()
  }, [initEnemies])
  
  const resetPlayer = useCallback(() => {
    const game = gameRef.current
    game.player = {
      ...createDefaultPlayer(),
      invincible: true,
      invincibleTimer: 180,
    }
    game.camera = { x: 0, y: 0 }
    game.fireballs = []
    game.collectibles = []
    game.coins = []
    game.powerUp = 'none'
    initEnemies()
  }, [initEnemies])
  
  const checkCollision = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean => {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }
  
  const getTile = (x: number, y: number): number => {
    const tileX = Math.floor(x / TILE_SIZE)
    const tileY = Math.floor(y / TILE_SIZE)
    if (tileX < 0 || tileX >= 200 || tileY < 0 || tileY >= 20) {
      return TILE_EMPTY
    }
    return gameRef.current.level[tileY][tileX]
  }
  
  const setTile = (x: number, y: number, type: number) => {
    const tileX = Math.floor(x / TILE_SIZE)
    const tileY = Math.floor(y / TILE_SIZE)
    if (tileX >= 0 && tileX < 200 && tileY >= 0 && tileY < 20) {
      gameRef.current.level[tileY][tileX] = type
    }
  }
  
  const isSolidTile = (tileType: number): boolean => {
    return [TILE_GROUND, TILE_BRICK, TILE_QUESTION, TILE_QUESTION_USED, TILE_PIPE_TOP, TILE_PIPE].includes(tileType)
  }
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const game = gameRef.current
    const gs = gameStateRef.current
    
    ctx.fillStyle = '#5c94fc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (!gs.gameStarted) {
      drawStartScreen(ctx, canvas)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }
    
    if (gs.gameOver || game.gameOver) {
      drawGameOverScreen(ctx, canvas, game.gameWon)
      animationRef.current = requestAnimationFrame(gameLoop)
      return
    }
    
    const player = game.player
    
    if (game.keys.left) {
      player.vx = -MOVE_SPEED
      player.direction = -1
    } else if (game.keys.right) {
      player.vx = MOVE_SPEED
      player.direction = 1
    } else {
      player.vx *= 0.8
      if (Math.abs(player.vx) < 0.1) player.vx = 0
    }
    
    if (game.keys.jump && player.onGround) {
      player.vy = JUMP_FORCE
      player.onGround = false
      player.jumping = true
      player.jumpingUp = true
      game.lastJumpPress = Date.now()
    }
    
    if (player.jumping && player.jumpingUp && !game.keys.jump) {
      player.jumpingUp = false
    }
    
    if (player.jumping && player.jumpingUp && player.vy < JUMP_FORCE * 0.5) {
      player.vy = JUMP_FORCE * 0.5
    }
    
    if (player.vy >= 0) {
      player.jumping = false
      player.jumpingUp = false
    }
    
    player.vy += GRAVITY
    if (player.vy > 15) player.vy = 15
    
    player.x += player.vx
    
    const leftTileX = Math.floor(player.x / TILE_SIZE)
    const rightTileX = Math.floor((player.x + player.width) / TILE_SIZE)
    
    if (player.vx < 0) {
      for (let ty = Math.floor(player.y / TILE_SIZE); ty <= Math.floor((player.y + player.height) / TILE_SIZE); ty++) {
        if (isSolidTile(getTile(player.x, ty * TILE_SIZE))) {
          player.x = (leftTileX + 1) * TILE_SIZE
          player.vx = 0
          break
        }
      }
    }
    
    if (player.vx > 0) {
      for (let ty = Math.floor(player.y / TILE_SIZE); ty <= Math.floor((player.y + player.height) / TILE_SIZE); ty++) {
        if (isSolidTile(getTile(rightTileX * TILE_SIZE, ty * TILE_SIZE))) {
          player.x = rightTileX * TILE_SIZE - player.width
          player.vx = 0
          break
        }
      }
    }
    
    player.y += player.vy
    player.onGround = false
    
    if (player.vy >= 0) {
      const bottomY = player.y + player.height
      const leftX = player.x + 2
      const rightX = player.x + player.width - 2
      
      for (let tx = Math.floor(leftX / TILE_SIZE); tx <= Math.floor(rightX / TILE_SIZE); tx++) {
        const tile = getTile(tx * TILE_SIZE, bottomY)
        if (isSolidTile(tile)) {
          player.y = tx * TILE_SIZE + TILE_SIZE - player.height - (bottomY - tx * TILE_SIZE - TILE_SIZE)
          if (player.y + player.height > tx * TILE_SIZE && player.y + player.height < tx * TILE_SIZE + 16) {
            player.y = tx * TILE_SIZE - player.height
          }
          player.vy = 0
          player.onGround = true
          break
        }
      }
    }
    
    if (player.vy < 0) {
      const topY = player.y
      for (let tx = Math.floor(player.x / TILE_SIZE); tx <= Math.floor((player.x + player.width) / TILE_SIZE); tx++) {
        const tile = getTile(tx * TILE_SIZE, topY)
        if (isSolidTile(tile)) {
          player.y = (Math.floor(topY / TILE_SIZE) + 1) * TILE_SIZE
          player.vy = 0
          
          if (tile === TILE_QUESTION) {
            const qb = game.questionBlocks.find(
              (q: QuestionBlock) => Math.floor(q.x) === tx && Math.floor(q.y) === Math.floor(topY / TILE_SIZE)
            )
            if (qb && !qb.collected) {
              qb.collected = true
              setTile(tx * TILE_SIZE, Math.floor(topY / TILE_SIZE) * TILE_SIZE, TILE_QUESTION_USED)
              game.score += 100
              
              if (qb.content === 'coin') {
                game.animatingCoins.push({
                  x: tx * TILE_SIZE,
                  y: Math.floor(topY / TILE_SIZE) * TILE_SIZE,
                  vy: -8,
                  targetY: Math.floor(topY / TILE_SIZE) * TILE_SIZE - TILE_SIZE * 2,
                  active: true,
                })
              } else {
                game.collectibles.push({
                  x: tx * TILE_SIZE + 4,
                  y: Math.floor(topY / TILE_SIZE) * TILE_SIZE - 8,
                  vy: -4,
                  type: qb.content,
                  active: true,
                })
              }
            }
          }
          
          if (tile === TILE_BRICK && game.powerUp !== 'none') {
            setTile(tx * TILE_SIZE, Math.floor(topY / TILE_SIZE) * TILE_SIZE, TILE_EMPTY)
            game.score += 10
          }
          break
        }
      }
    }
    
    if (player.y > canvas.height + 100) {
      game.lives--
      if (game.lives <= 0) {
        game.gameOver = true
        setGameState({ ...gameStateRef.current, gameOver: true, lives: 0 })
      } else {
        resetPlayer()
        setGameState({ ...gameStateRef.current, lives: game.lives })
      }
    }
    
    if (player.invincible) {
      player.invincibleTimer--
      if (player.invincibleTimer <= 0) {
        player.invincible = false
      }
    }
    
    player.frameTimer++
    if (player.frameTimer > 8) {
      player.frameTimer = 0
      player.frame = (player.frame + 1) % 4
    }
    
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue
      
      enemy.vy += GRAVITY * 0.5
      if (enemy.vy > 10) enemy.vy = 10
      
      if (!enemy.shell || enemy.shellMoving) {
        enemy.x += enemy.vx
      }
      
      const leftTile = Math.floor(enemy.x / TILE_SIZE)
      const rightTile = Math.floor((enemy.x + enemy.width) / TILE_SIZE)
      
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (isSolidTile(getTile(tx * TILE_SIZE, enemy.y + enemy.height - 4))) {
          enemy.vx *= -1
          enemy.x += enemy.vx * 2
          break
        }
      }
      
      enemy.y += enemy.vy
      
      const bottomY = enemy.y + enemy.height
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (isSolidTile(getTile(tx * TILE_SIZE, bottomY))) {
          enemy.y = tx * TILE_SIZE - enemy.height
          enemy.vy = 0
          break
        }
      }
      
      if (!player.invincible && checkCollision(
        player.x, player.y, player.width, player.height,
        enemy.x, enemy.y, enemy.width, enemy.height
      )) {
        if (player.vy > 0 && player.y + player.height < enemy.y + enemy.height / 2) {
          enemy.alive = false
          game.score += enemy.type === 'goomba' ? 100 : 200
          
          if (enemy.type === 'koopa') {
            enemy.alive = true
            enemy.shell = true
            enemy.shellMoving = false
            enemy.width = 28
            enemy.height = 28
          }
          
          player.vy = JUMP_FORCE * 0.6
        } else {
          if (enemy.shell && !enemy.shellMoving) {
            enemy.shellMoving = true
            enemy.vx = player.x < enemy.x ? ENEMY_SPEED * 3 : -ENEMY_SPEED * 3
          } else if (enemy.shell && enemy.shellMoving) {
            enemy.shellMoving = false
            enemy.vx = 0
          } else {
            if (game.powerUp === 'fire') {
              game.powerUp = 'mushroom'
              player.invincible = true
              player.invincibleTimer = 120
            } else if (game.powerUp === 'mushroom') {
              game.powerUp = 'none'
              player.invincible = true
              player.invincibleTimer = 120
            } else {
              game.lives--
              if (game.lives <= 0) {
                game.gameOver = true
                setGameState({ ...gameStateRef.current, gameOver: true, lives: 0 })
              } else {
                resetPlayer()
                setGameState({ ...gameStateRef.current, lives: game.lives })
              }
            }
          }
        }
      }
      
      enemy.frameTimer++
      if (enemy.frameTimer > 12) {
        enemy.frameTimer = 0
        enemy.frame = (enemy.frame + 1) % 2
      }
    }
    
    for (const item of game.collectibles) {
      if (!item.active) continue
      
      item.vy += GRAVITY * 0.3
      item.y += item.vy
      
      if (getTile(item.x, item.y + 24) !== TILE_EMPTY) {
        item.y = Math.floor(item.y / TILE_SIZE) * TILE_SIZE
        item.vy = 0
      }
      
      if (!item.vx) item.vx = 0.5
      
      item.x += item.vx
      
      if (checkCollision(
        player.x, player.y, player.width, player.height,
        item.x, item.y, 24, 24
      )) {
        item.active = false
        
        if (item.type === 'coin') {
          game.coinCount++
          game.score += 200
          if (game.coinCount >= 100) {
            game.coinCount = 0
            game.lives++
          }
        } else if (item.type === 'mushroom') {
          game.powerUp = 'mushroom'
          game.score += 1000
        } else if (item.type === 'fire') {
          game.powerUp = 'fire'
          game.score += 1000
        }
      }
      
      const tile = getTile(item.x - 4, item.y + 12)
      if (isSolidTile(tile)) {
        item.vx = 0.5
      }
    }
    
    for (const coin of game.animatingCoins) {
      if (!coin.active) continue
      
      coin.vy += GRAVITY * 0.5
      coin.y += coin.vy
      
      if (coin.y <= coin.targetY) {
        coin.active = false
        game.coinCount++
        game.score += 200
        if (game.coinCount >= 100) {
          game.coinCount = 0
          game.lives++
        }
      }
    }
    
    if (game.powerUp === 'fire') {
      if (Math.random() < 0.02) {
        game.fireballs.push({
          x: player.x + (player.direction > 0 ? player.width : 0),
          y: player.y + player.height / 2,
          vx: player.direction * 8,
          vy: -2,
          alive: true,
        })
      }
    }
    
    for (const fb of game.fireballs) {
      if (!fb.alive) continue
      
      fb.x += fb.vx
      fb.vy += 0.15
      fb.y += fb.vy
      
      if (getTile(fb.x, fb.y) !== TILE_EMPTY) {
        fb.alive = false
        continue
      }
      
      for (const enemy of game.enemies) {
        if (!enemy.alive) continue
        if (checkCollision(fb.x - 6, fb.y - 6, 12, 12, enemy.x, enemy.y, enemy.width, enemy.height)) {
          fb.alive = false
          enemy.alive = false
          game.score += enemy.type === 'goomba' ? 100 : 200
          break
        }
      }
      
      if (fb.x < game.camera.x - 50 || fb.x > game.camera.x + canvas.width + 50) {
        fb.alive = false
      }
    }
    
    const targetCameraX = player.x - canvas.width / 3
    game.camera.x += (targetCameraX - game.camera.x) * 0.1
    if (game.camera.x < 0) game.camera.x = 0
    
    if (player.x > 170 * TILE_SIZE) {
      game.gameWon = true
      game.score += 5000
      setGameState({
        ...gameStateRef.current,
        gameWon: true,
        score: game.score,
        coins: game.coinCount,
      })
    }
    
    drawBackground(ctx, canvas, game.camera.x)
    
    const startCol = Math.floor(game.camera.x / TILE_SIZE)
    const endCol = Math.min(startCol + Math.ceil(canvas.width / TILE_SIZE) + 2, 200)
    
    for (let y = 0; y < 20; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = game.level[y][x]
        if (tile !== TILE_EMPTY) {
          drawTile(ctx, x, y, tile, game.camera.x)
        }
      }
    }
    
    for (const qb of game.questionBlocks) {
      if (!qb.collected) {
        const screenX = qb.x * TILE_SIZE - game.camera.x
        if (screenX > -TILE_SIZE && screenX < canvas.width + TILE_SIZE) {
          const time = Date.now() / 200
          const bobY = Math.sin(time) * 2
          ctx.fillStyle = '#ff9800'
          ctx.font = 'bold 20px Arial'
          ctx.fillText('?', qb.x * TILE_SIZE - game.camera.x + 10, qb.y * TILE_SIZE + 24 + bobY)
        }
      }
    }
    
    for (const coin of game.animatingCoins) {
      if (coin.active) {
        drawCoin(ctx, coin.x - game.camera.x, coin.y, true)
      }
    }
    
    for (const item of game.collectibles) {
      if (item.active) {
        if (item.type === 'mushroom') {
          drawMushroom(ctx, item.x - game.camera.x, item.y)
        } else if (item.type === 'fire') {
          drawFireFlower(ctx, item.x - game.camera.x, item.y)
        }
      }
    }
    
    for (const enemy of game.enemies) {
      if (enemy.alive) {
        if (enemy.type === 'goomba') {
          drawGoomba(ctx, enemy.x - game.camera.x, enemy.y, enemy.frame)
        } else {
          drawKoopa(ctx, enemy.x - game.camera.x, enemy.y, enemy.frame, enemy.shell, enemy.vx > 0)
        }
      }
    }
    
    for (const fb of game.fireballs) {
      if (fb.alive) {
        drawFireball(ctx, fb.x - game.camera.x, fb.y)
      }
    }
    
    if (!player.invincible || Math.floor(Date.now() / 100) % 2 === 0) {
      drawPlayer(ctx, player, game.camera.x)
    }
    
    drawUI(ctx, canvas, game.score, game.lives, game.coinCount)
    
    setGameState({
      ...gameStateRef.current,
      score: game.score,
      lives: game.lives,
      coins: game.coinCount,
    })
    
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [resetPlayer])
  
  const drawBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cameraX: number) => {
    const cloudPositions = [50, 200, 400, 600, 800, 1000, 1300, 1600, 1900, 2200, 2500, 2800, 3100, 3400]
    for (const baseX of cloudPositions) {
      const x = baseX - cameraX * 0.3
      if (x > -100 && x < canvas.width + 100) {
        drawCloud(ctx, x, 60)
      }
    }
    
    const bushPositions = [80, 180, 350, 550, 750, 950, 1150, 1400, 1650, 1900, 2150, 2400, 2700, 3000, 3300]
    for (const baseX of bushPositions) {
      const x = baseX - cameraX * 0.5
      if (x > -100 && x < canvas.width + 100) {
        drawBush(ctx, x, canvas.height - 64 - 24)
      }
    }
  }
  
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.arc(x + 25, y - 5, 25, 0, Math.PI * 2)
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2)
    ctx.arc(x + 25, y + 5, 20, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const drawBush = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#32cd32'
    ctx.beginPath()
    ctx.arc(x, y, 15, Math.PI, 0)
    ctx.arc(x + 20, y - 5, 18, Math.PI, 0)
    ctx.arc(x + 40, y, 15, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#228b22'
    ctx.beginPath()
    ctx.arc(x + 10, y - 5, 12, Math.PI, 0)
    ctx.arc(x + 30, y - 8, 14, Math.PI, 0)
    ctx.fill()
  }
  
  const drawTile = (ctx: CanvasRenderingContext2D, tileX: number, tileY: number, type: number, cameraX: number) => {
    const x = tileX * TILE_SIZE - cameraX
    const y = tileY * TILE_SIZE
    
    if (x < -TILE_SIZE || x > ctx.canvas.width + TILE_SIZE) return
    
    switch (type) {
      case TILE_GROUND:
        ctx.fillStyle = '#c84c0c'
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = '#e8a080'
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 4)
        ctx.fillStyle = '#ac7c0c'
        ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4)
        ctx.fillStyle = '#32cd32'
        ctx.fillRect(x, y, TILE_SIZE, 6)
        ctx.fillStyle = '#228b22'
        ctx.fillRect(x + 4, y + 2, 4, 4)
        ctx.fillRect(x + 12, y + 2, 4, 4)
        ctx.fillRect(x + 22, y + 2, 4, 4)
        break
        
      case TILE_BRICK:
        ctx.fillStyle = '#c84c0c'
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = '#e8a080'
        ctx.fillRect(x + 2, y + 2, 12, 12)
        ctx.fillRect(x + 18, y + 2, 12, 12)
        ctx.fillRect(x + 2, y + 18, 12, 12)
        ctx.fillRect(x + 18, y + 18, 12, 12)
        ctx.strokeStyle = '#8b3a0f'
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
        break
        
      case TILE_QUESTION:
      case TILE_QUESTION_USED:
        ctx.fillStyle = '#ff9800'
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        if (type === TILE_QUESTION) {
          ctx.fillStyle = '#ffcc00'
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, 8)
        }
        ctx.fillStyle = type === TILE_QUESTION ? '#ffcc00' : '#8b8b00'
        ctx.font = 'bold 22px Arial'
        ctx.fillText(type === TILE_QUESTION ? '?' : ' ', x + 8, y + 24)
        ctx.strokeStyle = '#cc6600'
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
        break
        
      case TILE_PIPE_TOP:
        ctx.fillStyle = '#32cd32'
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = '#228b22'
        ctx.fillRect(x, y, 8, TILE_SIZE)
        ctx.fillRect(x + TILE_SIZE - 8, y, 8, TILE_SIZE)
        break
        
      case TILE_PIPE:
        ctx.fillStyle = '#32cd32'
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = '#228b22'
        ctx.fillRect(x, y, 8, TILE_SIZE)
        ctx.fillRect(x + TILE_SIZE - 8, y, 8, TILE_SIZE)
        break
        
      case TILE_FLAG:
        ctx.fillStyle = '#228b22'
        ctx.fillRect(x + 12, y, 8, TILE_SIZE)
        break
        
      case TILE_FLAG_TOP:
        ctx.fillStyle = '#228b22'
        ctx.fillRect(x + 12, y, 8, TILE_SIZE)
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(x + 16, y + 8, 10, 0, Math.PI * 2)
        ctx.fill()
        break
    }
  }
  
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, cameraX: number) => {
    const x = player.x - cameraX
    const y = player.y
    const isBig = gameRef.current.powerUp !== 'none'
    const height = isBig ? 48 : 32
    const width = isBig ? 28 : 24
    
    ctx.fillStyle = '#e52521'
    ctx.fillRect(x + 4, y + (isBig ? 8 : 4), width - 4, 8)
    
    ctx.fillStyle = '#ffcc99'
    ctx.fillRect(x + 4, y + (isBig ? 12 : 8), width - 8, 12)
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + (player.direction > 0 ? 14 : 6), y + (isBig ? 16 : 12), 4, 4)
    
    ctx.fillStyle = '#e52521'
    ctx.fillRect(x + 2, y + (isBig ? 22 : 16), width - 4, 10)
    
    ctx.fillStyle = '#8b4513'
    ctx.fillRect(x + 6, y + (isBig ? 22 : 16), 4, 10)
    ctx.fillRect(x + width - 10, y + (isBig ? 22 : 16), 4, 10)
    
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(x + 4, y + height - 6, 6, 6)
    ctx.fillRect(x + width - 10, y + height - 6, 6, 6)
  }
  
  const drawGoomba = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
    ctx.fillStyle = '#8b4513'
    ctx.beginPath()
    ctx.arc(x + 14, y + 16, 14, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(x, y + 12, 28, 16)
    
    ctx.fillStyle = '#5c3317'
    const footOffset = frame * 3
    ctx.fillRect(x + 2, y + 24 - footOffset, 8, 6)
    ctx.fillRect(x + 18, y + 24 + footOffset, 8, 6)
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x + 4, y + 8, 8, 8)
    ctx.fillRect(x + 16, y + 8, 8, 8)
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 8, y + 10, 4, 4)
    ctx.fillRect(x + 18, y + 10, 4, 4)
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 4, y + 6, 8, 2)
    ctx.fillRect(x + 16, y + 6, 8, 2)
  }
  
  const drawKoopa = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, shell: boolean, facingRight: boolean) => {
    if (shell) {
      ctx.fillStyle = '#32cd32'
      ctx.beginPath()
      ctx.arc(x + 14, y + 18, 14, 0, Math.PI)
      ctx.fill()
      ctx.fillStyle = '#228b22'
      ctx.fillRect(x + 2, y + 12, 24, 10)
      
      ctx.fillStyle = '#ffcc00'
      ctx.beginPath()
      ctx.arc(x + 14, y + 16, 8, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = '#32cd32'
      ctx.beginPath()
      ctx.arc(x + (facingRight ? 6 : 18), y + 8, 10, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#32cd32'
      ctx.beginPath()
      ctx.arc(x + 12, y + 22, 12, Math.PI, 0)
      ctx.fill()
      ctx.fillRect(x, y + 18, 24, 12)
      
      ctx.fillStyle = '#ffcc99'
      const footOffset = frame * 2
      ctx.fillRect(x + 2, y + 26 - footOffset, 6, 6)
      ctx.fillRect(x + 16, y + 26 + footOffset, 6, 6)
      
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + (facingRight ? 2 : 14), y + 4, 8, 6)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + (facingRight ? 6 : 16), y + 5, 4, 4)
    }
  }
  
  const drawMushroom = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#e52521'
    ctx.beginPath()
    ctx.arc(x + 12, y + 10, 12, Math.PI, 0)
    ctx.fill()
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + 8, y + 6, 3, 0, Math.PI * 2)
    ctx.arc(x + 16, y + 6, 3, 0, Math.PI * 2)
    ctx.arc(x + 12, y + 10, 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ffcc99'
    ctx.fillRect(x + 4, y + 8, 16, 16)
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 6, y + 12, 3, 3)
    ctx.fillRect(x + 15, y + 12, 3, 3)
  }
  
  const drawFireFlower = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() / 100
    const colors = ['#ff0000', '#ff6600', '#ffcc00', '#ff0000', '#ff6600']
    
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + time * 0.1
      const px = x + 12 + Math.cos(angle) * 8
      const py = y + 12 + Math.sin(angle) * 8
      ctx.fillStyle = colors[i]
      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + 12, y + 12, 6, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + 9, y + 10, 2, 2)
    ctx.fillRect(x + 13, y + 10, 2, 2)
  }
  
  const drawCoin = (ctx: CanvasRenderingContext2D, x: number, y: number, spinning: boolean) => {
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    const scaleX = spinning ? Math.abs(Math.sin(Date.now() / 100)) : 1
    ctx.ellipse(x + 16, y + 16, 8 * scaleX, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffed4a'
    ctx.beginPath()
    ctx.ellipse(x + 16, y + 14, 4 * scaleX, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const drawFireball = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() / 50
    
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ff6600'
    for (let i = 0; i < 3; i++) {
      const tx = x - (i + 1) * 4
      const ty = y + Math.sin(time + i) * 2
      ctx.beginPath()
      ctx.arc(tx, ty, 4 - i, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  const drawUI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, score: number, lives: number, coins: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, 40)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.fillText(`分数: ${score}`, 20, 26)
    
    ctx.fillStyle = '#e52521'
    ctx.fillText(`生命: ${lives}`, 150, 26)
    
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`金币: ${coins}`, 280, 26)
  }
  
  const drawStartScreen = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#e52521'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('超级马里奥', canvas.width / 2, canvas.height / 2 - 80)
    
    ctx.fillStyle = '#e52521'
    ctx.fillRect(canvas.width / 2 - 20, canvas.height / 2 - 20, 40, 20)
    ctx.fillStyle = '#ffcc99'
    ctx.fillRect(canvas.width / 2 - 16, canvas.height / 2 - 10, 32, 20)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText('按任意键开始', canvas.width / 2, canvas.height / 2 + 60)
    
    ctx.font = '14px Arial'
    ctx.fillText('← → 或 A D 移动', canvas.width / 2, canvas.height / 2 + 100)
    ctx.fillText('↑ W 或 空格 跳跃 (按住跳更高)', canvas.width / 2, canvas.height / 2 + 125)
    
    ctx.textAlign = 'left'
  }
  
  const drawGameOverScreen = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, won: boolean) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.textAlign = 'center'
    
    if (won) {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('恭喜通关!', canvas.width / 2, canvas.height / 2 - 60)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.fillText(`最终得分: ${gameRef.current.score}`, canvas.width / 2, canvas.height / 2)
    } else {
      ctx.fillStyle = '#e52521'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 60)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '24px Arial'
      ctx.fillText(`得分: ${gameRef.current.score}`, canvas.width / 2, canvas.height / 2)
    }
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText('按 R 重新开始', canvas.width / 2, canvas.height / 2 + 60)
    
    ctx.textAlign = 'left'
  }
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current
      
      if (!gameStateRef.current.gameStarted || game.gameOver) {
        if (e.key === 'r' || e.key === 'R') {
          resetGame()
          setGameState({
            score: 0,
            lives: 3,
            coins: 0,
            gameOver: false,
            gameWon: false,
            gameStarted: true,
            powerUp: 'none',
          })
        } else if (!gameStateRef.current.gameStarted) {
          setGameState({
            ...gameStateRef.current,
            gameStarted: true,
          })
        }
        return
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        game.keys.left = true
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        game.keys.right = true
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!game.keys.jump) {
          game.keys.jump = true
          game.lastJumpPress = Date.now()
        }
        e.preventDefault()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const game = gameRef.current
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        game.keys.left = false
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        game.keys.right = false
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        game.keys.jump = false
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [resetGame])
  
  useEffect(() => {
    initEnemies()
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [gameLoop, initEnemies])
  
  return (
    <ToolLayout 
      title="超级马里奥" 
      description="经典平台跳跃游戏，踩敌人、吃金币、收集道具"
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '12px',
        padding: '16px'
      }}>
        <div style={{
          border: '4px solid #8b4513',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: '#5c94fc'
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={640}
            style={{ display: 'block' }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          gap: '24px',
          color: '#888',
          fontSize: '13px'
        }}>
          <span>← → 或 A D 移动</span>
          <span>↑ W 或 空格 跳跃</span>
          <span>按住跳跃键跳更高</span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>🍄 超级蘑菇 - 变大</span>
          <span>🔥 火焰花 - 发射火球</span>
          <span>💰 金币 +200分</span>
          <span>👊 踩敌人 +100分</span>
        </div>
      </div>
    </ToolLayout>
  )
}
