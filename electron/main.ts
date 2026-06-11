// electron/main.ts
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

let mainWindow: BrowserWindow | null = null
const widgetWindows = new Map<string, BrowserWindow>()

function getWidgetUrl(path: string): string {
  const base = process.env.VITE_DEV_SERVER_URL
    ? process.env.VITE_DEV_SERVER_URL
    : `file://${join(__dirname, '../dist/index.html').replace(/\\/g, '/')}`
  return `${base}?widget=true#${path}`
}

function createWidgetWindow(toolId: string, toolName: string, path: string) {
  const existing = widgetWindows.get(toolId)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const win = new BrowserWindow({
    width: 520,
    height: 640,
    minWidth: 320,
    minHeight: 400,
    title: toolName,
    icon: join(__dirname, '../public/icon.svg'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0a0a0f',
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    show: false,
  })

  win.loadURL(getWidgetUrl(path))
  win.once('ready-to-show', () => win.show())

  // 拦截外部链接
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.on('closed', () => {
    widgetWindows.delete(toolId)
  })

  widgetWindows.set(toolId, win)
  return win
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '艺北工具箱',
    icon: join(__dirname, '../public/icon.svg'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#0a0a0f',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

ipcMain.handle('widget:create', (_, { toolId, toolName, path }: { toolId: string; toolName: string; path: string }) => {
  createWidgetWindow(toolId, toolName, path)
})

ipcMain.handle('widget:close', (_, toolId: string) => {
  const win = widgetWindows.get(toolId)
  if (win && !win.isDestroyed()) {
    win.close()
    widgetWindows.delete(toolId)
  }
})

ipcMain.handle('widget:getToolId', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  for (const [id, w] of widgetWindows) {
    if (w === win) return id
  }
  return null
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.protocol !== 'file:') {
      event.preventDefault()
    }
  })
})
