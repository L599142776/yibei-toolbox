// electron/preload.ts
// 预加载脚本 — 向渲染进程暴露安全的 API

import { contextBridge, ipcRenderer } from 'electron'

// 暴露环境标识，让前端知道是 Web 还是 Electron
contextBridge.exposeInMainWorld('__PLATFORM__', {
  isElectron: true,
  platform: process.platform,
})

// 暴露窗口控制 API
contextBridge.exposeInMainWorld('__WINDOW__', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
})
