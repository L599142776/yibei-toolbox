// electron/preload.ts
// 预加载脚本 — 向渲染进程暴露安全的 API

import { contextBridge } from 'electron'

// 暴露环境标识，让前端知道是 Web 还是 Electron
contextBridge.exposeInMainWorld('__PLATFORM__', {
  isElectron: true,
  platform: process.platform,
})
