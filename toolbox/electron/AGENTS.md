# Electron 主进程模块

**主入口:** `electron/main.ts` | **预加载:** `electron/preload.ts`

## OVERVIEW
Electron 主进程：窗口管理、安全策略、IPC 通信、平台检测。

## KEY FILES
| File | Purpose |
|------|---------|
| `main.ts` | 窗口创建、IPC 处理、安全策略 |
| `preload.ts` | 暴露 `__PLATFORM__` 和 `__WINDOW__` API |

## WINDOW CONFIG
```ts
{
  width: 1280, height: 800,
  minWidth: 800, minHeight: 600,
  frame: false,              // 无边框窗口
  titleBarStyle: 'hidden',   // macOS traffic lights
  backgroundColor: '#0a0a0f',
  icon: 'public/icon.png'
}
```

## SECURITY (CRITICAL)
- ✅ `contextIsolation: true` — 隔离上下文
- ✅ `nodeIntegration: false` — 禁用 Node
- ✅ `shell.openExternal()` — 外部链接用系统浏览器
- ✅ `will-navigate` 拦截 — 禁止新窗口导航

## IPC HANDLERS
| Channel | Purpose |
|---------|---------|
| `window:minimize` | 最小化窗口 |
| `window:maximize` | 最大化/还原 |
| `window:close` | 关闭应用 |
| `window:isMaximized` | 查询最大化状态 |

## PRELOAD API
```ts
__PLATFORM__  // 'electron' | 'web'
__WINDOW__     // { minimize, maximize, close, isMaximized }
```

## BUILD OUTPUT
- Web: `dist/`
- Electron: `dist-electron/main.js`, `dist-electron/preload.js`
- Packaged: `release/` (NSIS/DMG/AppImage)

## DEV WORKFLOW
```bash
npm run dev:electron  # ELECTRON_DEV=true vite
```

## ANTI-PATTERNS
- ❌ 不要移除 `contextIsolation`
- ❌ 不要启用 `nodeIntegration`
- ❌ 不要在 `webContents` 外部链接中直接 `loadURL`
- ❌ 不要跳过 `will-navigate` 安全检查
