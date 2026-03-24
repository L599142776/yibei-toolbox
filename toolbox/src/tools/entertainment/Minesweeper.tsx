import { useState, useEffect, useCallback, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'

type CellState = 'hidden' | 'revealed' | 'flagged' | 'mine' | 'exploded'
type GameState = 'idle' | 'playing' | 'won' | 'lost'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Cell {
  isMine: boolean
  adjacentMines: number
  state: CellState
}

interface DifficultyConfig {
  rows: number
  cols: number
  mines: number
  label: string
}

interface BestTime {
  time: number
  date: string
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: '简单' },
  medium: { rows: 16, cols: 16, mines: 40, label: '中等' },
  hard: { rows: 16, cols: 30, mines: 99, label: '困难' },
}

const NUMBER_COLORS: Record<number, string> = {
  1: '#3498db',
  2: '#27ae60',
  3: '#e74c3c',
  4: '#8e44ad',
  5: '#c0392b',
  6: '#1abc9c',
  7: '#2c3e50',
  8: '#7f8c8d',
}

const FACE_EMOJIS: Record<GameState, string> = {
  idle: '😊',
  playing: '😊',
  won: '😎',
  lost: '😵',
}

const getBestTimesKey = () => 'minesweeper_best_times'

function getBestTimes(): Record<Difficulty, BestTime | null> {
  try {
    const stored = localStorage.getItem(getBestTimesKey())
    return stored ? JSON.parse(stored) : { easy: null, medium: null, hard: null }
  } catch {
    return { easy: null, medium: null, hard: null }
  }
}

function saveBestTime(difficulty: Difficulty, time: number): boolean {
  const bestTimes = getBestTimes()
  const isNewRecord = !bestTimes[difficulty] || time < bestTimes[difficulty]!.time
  if (isNewRecord) {
    bestTimes[difficulty] = { time, date: new Date().toLocaleDateString() }
    localStorage.setItem(getBestTimesKey(), JSON.stringify(bestTimes))
  }
  return isNewRecord
}

function createBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      adjacentMines: 0,
      state: 'hidden' as CellState,
    }))
  )
}

function placeMines(
  board: Cell[][],
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })))
  let placed = 0

  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    const isSafeZone =
      Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1

    if (!newBoard[r][c].isMine && !isSafeZone) {
      newBoard[r][c].isMine = true
      placed++
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
              count++
            }
          }
        }
        newBoard[r][c].adjacentMines = count
      }
    }
  }

  return newBoard
}

function revealCell(
  board: Cell[][],
  row: number,
  col: number,
  rows: number,
  cols: number
): Cell[][] {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })))
  const cell = newBoard[row][col]

  if (cell.state !== 'hidden') return newBoard

  cell.state = 'revealed'

  if (cell.adjacentMines === 0 && !cell.isMine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr
        const nc = col + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          newBoard[nr][nc] = revealCell(newBoard, nr, nc, rows, cols)[nr][nc]
        }
      }
    }
  }

  return newBoard
}

function checkWin(board: Cell[][], rows: number, cols: number, totalMines: number): boolean {
  let revealed = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].state === 'revealed') revealed++
    }
  }
  return revealed === rows * cols - totalMines
}

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<Cell[][]>(() => createBoard(9, 9))
  const [gameState, setGameState] = useState<GameState>('idle')
  const [time, setTime] = useState(0)
  const [flagCount, setFlagCount] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [newRecord, setNewRecord] = useState(false)
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, BestTime | null>>({
    easy: null,
    medium: null,
    hard: null,
  })

  const timerRef = useRef<number | null>(null)
  const config = DIFFICULTIES[difficulty]

  // 初始化棋盘
  useEffect(() => {
    const cfg = DIFFICULTIES[difficulty]
    setBoard(createBoard(cfg.rows, cfg.cols))
    setGameState('idle')
    setTime(0)
    setFlagCount(0)
    setSelectedCell(null)
    setNewRecord(false)
  }, [difficulty])

  useEffect(() => {
    setBestTimes(getBestTimes())
  }, [])

  const initGame = useCallback(
    (diff: Difficulty = difficulty, firstRow?: number, firstCol?: number) => {
      const cfg = DIFFICULTIES[diff]
      let newBoard = createBoard(cfg.rows, cfg.cols)

      if (firstRow !== undefined && firstCol !== undefined) {
        newBoard = placeMines(newBoard, cfg.rows, cfg.cols, cfg.mines, firstRow, firstCol)
      }

      setBoard(newBoard)
      setGameState(firstRow !== undefined ? 'playing' : 'idle')
      setTime(0)
      setFlagCount(0)
      setSelectedCell(null)
      setNewRecord(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    },
    [difficulty]
  )

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState])

  const handleClick = (row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return

    let currentBoard = board

    if (gameState === 'idle') {
      currentBoard = placeMines(board, config.rows, config.cols, config.mines, row, col)
      setBoard(currentBoard)
      setGameState('playing')
    }

    const cell = currentBoard[row][col]
    if (cell.state === 'flagged') return

    if (cell.isMine) {
      const newBoard = currentBoard.map((r) => r.map((c) => ({ ...c })))
      newBoard[row][col].state = 'exploded'
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (newBoard[r][c].isMine && newBoard[r][c].state !== 'exploded') {
            newBoard[r][c].state = 'mine'
          }
        }
      }
      setBoard(newBoard)
      setGameState('lost')
      return
    }

    const newBoard = revealCell(currentBoard, row, col, config.rows, config.cols)
    setBoard(newBoard)

    if (checkWin(newBoard, config.rows, config.cols, config.mines)) {
      setGameState('won')
      const finalTime = time
      const isNew = saveBestTime(difficulty, finalTime)
      setNewRecord(isNew)
      setBestTimes(getBestTimes())
    }
  }

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (gameState === 'won' || gameState === 'lost') return
    if (gameState === 'idle') return

    const cell = board[row][col]
    if (cell.state === 'revealed') return

    const newBoard = board.map((r) => r.map((c) => ({ ...c })))
    const currentState = newBoard[row][col].state

    if (currentState === 'flagged') {
      newBoard[row][col].state = 'hidden'
      setFlagCount((f) => f - 1)
    } else if (currentState === 'hidden') {
      newBoard[row][col].state = 'flagged'
      setFlagCount((f) => f + 1)
    }

    setBoard(newBoard)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!board.length) return

      let { row, col } = selectedCell || { row: -1, col: -1 }

      switch (e.key) {
        case 'ArrowUp':
          row = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          row = Math.min(config.rows - 1, row + 1)
          break
        case 'ArrowLeft':
          col = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          col = Math.min(config.cols - 1, col + 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (row >= 0 && col >= 0) {
            if (e.shiftKey) {
              handleRightClick(e as unknown as React.MouseEvent, row, col)
            } else {
              handleClick(row, col)
            }
          }
          return
        default:
          return
      }

      e.preventDefault()
      setSelectedCell({ row, col })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [board, selectedCell, config, gameState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(3, '0')}${String(secs).padStart(2, '0')}`
  }

  const formatMineCount = () => {
    const remaining = config.mines - flagCount
    const prefix = remaining < 0 ? '-' : ''
    return prefix + String(Math.abs(remaining)).padStart(3, '0')
  }

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff)
    initGame(diff)
  }

  return (
    <ToolLayout title="扫雷" description="经典扫雷游戏，点击方块揭开安全区域，右键标记地雷">
      <div className="minesweeper-container">
        <div className="btn-group" style={{ marginBottom: 20 }}>
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => (
            <button
              key={diff}
              className={`btn ${difficulty === diff ? '' : 'btn-outline'}`}
              onClick={() => handleDifficultyChange(diff)}
            >
              {DIFFICULTIES[diff].label}
            </button>
          ))}
        </div>

        {bestTimes && (
          <div className="minesweeper-best-times">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <div key={diff} className="minesweeper-best-time">
                <span className="best-label">{DIFFICULTIES[diff].label}:</span>
                {bestTimes[diff] ? (
                  <span className="best-value">
                    {formatTime(bestTimes[diff]!.time)}s ({bestTimes[diff]!.date})
                  </span>
                ) : (
                  <span className="best-none">--</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="minesweeper-status">
          <div className="minesweeper-counter">{formatMineCount()}</div>
          <button
            className="minesweeper-face"
            onClick={() => initGame(difficulty)}
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          >
            {isMouseDown && gameState !== 'won' && gameState !== 'lost' ? '😮' : FACE_EMOJIS[gameState]}
          </button>
          <div className="minesweeper-timer">{formatTime(time)}</div>
        </div>

        <div
          className="minesweeper-board"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, var(--cell-size))`,
            '--cell-size': difficulty === 'hard' ? '24px' : '32px',
          } as React.CSSProperties}
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              const showPressed = isSelected && isMouseDown && cell.state === 'hidden'

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`minesweeper-cell ${cell.state} ${isSelected ? 'selected' : ''} ${showPressed ? 'pressed' : ''}`}
                  onClick={() => {
                    setSelectedCell({ row: rowIndex, col: colIndex })
                    handleClick(rowIndex, colIndex)
                  }}
                  onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                  onMouseEnter={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                  tabIndex={0}
                >
                  {cell.state === 'revealed' && cell.adjacentMines > 0 && (
                    <span style={{ color: NUMBER_COLORS[cell.adjacentMines] }} className="cell-number">
                      {cell.adjacentMines}
                    </span>
                  )}
                  {cell.state === 'flagged' && <span className="cell-flag">🚩</span>}
                  {cell.state === 'mine' && <span className="cell-mine">💣</span>}
                  {cell.state === 'exploded' && <span className="cell-exploded">💥</span>}
                </div>
              )
            })
          )}
        </div>

        {(gameState === 'won' || gameState === 'lost') && (
          <div className={`minesweeper-message ${gameState}`}>
            {gameState === 'won' ? (
              <>
                <span className="message-text">🎉 恭喜通关！</span>
                {newRecord && <span className="new-record">🏆 新纪录！</span>}
                <span className="message-time">
                  用时 {time} 秒
                </span>
              </>
            ) : (
              <span className="message-text">💥 游戏结束！</span>
            )}
          </div>
        )}

        <div className="minesweeper-instructions">
          <div>
            <strong>操作说明：</strong>
          </div>
          <div>🖱️ 左键点击：揭开方块</div>
          <div>🖱️ 右键点击：标记/取消标记地雷</div>
          <div>⌨️ 方向键：移动选择</div>
          <div>⌨️ 空格键：揭开方块</div>
          <div>⌨️ Shift+空格：标记地雷</div>
        </div>
      </div>

      <style>{`
        .minesweeper-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .minesweeper-best-times {
          display: flex;
          gap: 24px;
          font-size: 13px;
          color: var(--text-dim);
          background: var(--bg-input);
          padding: 10px 16px;
          border-radius: var(--radius-sm);
        }

        .best-label {
          font-weight: 500;
          margin-right: 4px;
        }

        .best-value {
          color: var(--accent);
        }

        .best-none {
          color: var(--text-muted);
        }

        .minesweeper-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: linear-gradient(145deg, #c0c0c0 0%, #a0a0a0 100%);
          padding: 8px 12px;
          border-radius: 8px;
          border: 3px solid;
          border-color: #fff #808080 #808080 #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
        }

        :root.dark .minesweeper-status,
        :root:not(.light):not(.dark) .minesweeper-status {
          background: linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%);
          border-color: #4a4a4a #1a1a1a #1a1a1a #4a4a4a;
        }

        .minesweeper-counter,
        .minesweeper-timer {
          font-family: 'Digital-7', 'Courier New', monospace;
          font-size: 28px;
          font-weight: bold;
          color: #e74c3c;
          background: #1a1a1a;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 70px;
          text-align: center;
          letter-spacing: 2px;
        }

        :root.dark .minesweeper-counter,
        :root.dark .minesweeper-timer,
        :root:not(.light):not(.dark) .minesweeper-counter,
        :root:not(.light):not(.dark) .minesweeper-timer {
          background: #0a0a0a;
        }

        .minesweeper-face {
          width: 44px;
          height: 44px;
          font-size: 28px;
          background: linear-gradient(145deg, #c0c0c0 0%, #a0a0a0 100%);
          border: 3px solid;
          border-color: #fff #808080 #808080 #fff;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .minesweeper-face:hover {
          transform: scale(1.05);
        }

        .minesweeper-face:active {
          border-color: #808080 #fff #fff #808080;
          transform: scale(0.95);
        }

        :root.dark .minesweeper-face,
        :root:not(.light):not(.dark) .minesweeper-face {
          background: linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%);
        }

        .minesweeper-board {
          display: grid;
          gap: 0;
          background: linear-gradient(145deg, #c0c0c0 0%, #a0a0a0 100%);
          padding: 8px;
          border-radius: 8px;
          border: 3px solid;
          border-color: #fff #808080 #808080 #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 20px rgba(0,0,0,0.3);
          max-width: 100%;
          overflow-x: auto;
        }

        :root.dark .minesweeper-board,
        :root:not(.light):not(.dark) .minesweeper-board {
          background: linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%);
          border-color: #4a4a4a #1a1a1a #1a1a1a #4a4a4a;
        }

        .minesweeper-cell {
          width: var(--cell-size, 32px);
          height: var(--cell-size, 32px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: calc(var(--cell-size, 32px) * 0.6);
          font-weight: bold;
          background: linear-gradient(145deg, #d0d0d0 0%, #b0b0b0 100%);
          border: 2px solid;
          border-color: #fff #707070 #707070 #fff;
          cursor: pointer;
          user-select: none;
          transition: all 0.1s;
        }

        :root.dark .minesweeper-cell,
        :root:not(.light):not(.dark) .minesweeper-cell {
          background: linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%);
          border-color: #5a5a5a #2a2a2a #2a2a2a #5a5a5a;
        }

        .minesweeper-cell.hidden:hover {
          background: linear-gradient(145deg, #c8c8c8 0%, #a8a8a8 100%);
        }

        :root.dark .minesweeper-cell.hidden:hover,
        :root:not(.light):not(.dark) .minesweeper-cell.hidden:hover {
          background: linear-gradient(145deg, #5a5a5a 0%, #4a4a4a 100%);
        }

        .minesweeper-cell.hidden.pressed {
          border-color: #707070 #fff #fff #707070;
          background: linear-gradient(145deg, #b0b0b0 0%, #a0a0a0 100%);
        }

        :root.dark .minesweeper-cell.hidden.pressed,
        :root:not(.light):not(.dark) .minesweeper-cell.hidden.pressed {
          background: linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%);
        }

        .minesweeper-cell.revealed {
          background: #d0d0d0;
          border: 1px solid #b0b0b0;
          cursor: default;
        }

        :root.dark .minesweeper-cell.revealed,
        :root:not(.light):not(.dark) .minesweeper-cell.revealed {
          background: #252525;
          border-color: #1a1a1a;
        }

        .minesweeper-cell.flagged {
          background: linear-gradient(145deg, #d0d0d0 0%, #b0b0b0 100%);
        }

        :root.dark .minesweeper-cell.flagged,
        :root:not(.light):not(.dark) .minesweeper-cell.flagged {
          background: linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 100%);
        }

        .minesweeper-cell.mine,
        .minesweeper-cell.exploded {
          background: #d0d0d0;
          border: 1px solid #b0b0b0;
        }

        :root.dark .minesweeper-cell.mine,
        :root.dark .minesweeper-cell.exploded,
        :root:not(.light):not(.dark) .minesweeper-cell.mine,
        :root:not(.light):not(.dark) .minesweeper-cell.exploded {
          background: #252525;
          border-color: #1a1a1a;
        }

        .minesweeper-cell.exploded {
          background: #e74c3c !important;
        }

        .minesweeper-cell.selected {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
          z-index: 1;
        }

        .cell-number {
          text-shadow: 1px 1px 0 rgba(255,255,255,0.3);
        }

        :root.dark .cell-number,
        :root:not(.light):not(.dark) .cell-number {
          text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
        }

        .cell-flag,
        .cell-mine {
          animation: cellReveal 0.2s ease-out;
        }

        .cell-exploded {
          animation: explode 0.3s ease-out;
        }

        @keyframes cellReveal {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes explode {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }

        .minesweeper-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          border-radius: var(--radius);
          font-size: 16px;
          animation: messageSlide 0.3s ease-out;
        }

        .minesweeper-message.won {
          background: rgba(82, 196, 26, 0.1);
          border: 1px solid rgba(82, 196, 26, 0.3);
          color: #52c41a;
        }

        .minesweeper-message.lost {
          background: rgba(255, 77, 79, 0.1);
          border: 1px solid rgba(255, 77, 79, 0.3);
          color: #ff4d4f;
        }

        .message-text {
          font-size: 20px;
          font-weight: 600;
        }

        .new-record {
          font-size: 18px;
          animation: pulse 1s ease-in-out infinite;
        }

        .message-time {
          font-size: 14px;
          opacity: 0.8;
        }

        @keyframes messageSlide {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .minesweeper-instructions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px 24px;
          font-size: 13px;
          color: var(--text-dim);
          padding: 16px;
          background: var(--bg-input);
          border-radius: var(--radius);
          max-width: 600px;
          width: 100%;
        }

        .minesweeper-instructions div {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 600px) {
          .minesweeper-status {
            padding: 6px 10px;
            gap: 12px;
          }

          .minesweeper-counter,
          .minesweeper-timer {
            font-size: 22px;
            min-width: 60px;
            padding: 2px 6px;
          }

          .minesweeper-face {
            width: 36px;
            height: 36px;
            font-size: 22px;
          }

          .minesweeper-board {
            padding: 6px;
          }

          .minesweeper-instructions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </ToolLayout>
  )
}
