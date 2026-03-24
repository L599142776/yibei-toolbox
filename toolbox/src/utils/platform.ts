// src/utils/platform.ts
// 平台检测工具

interface PlatformInfo {
  isElectron: boolean
  platform: string
}

interface WindowControl {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
}

declare global {
  interface Window {
    __PLATFORM__?: PlatformInfo
    __WINDOW__?: WindowControl
  }
}

export const platform: PlatformInfo = window.__PLATFORM__ || {
  isElectron: false,
  platform: 'web',
}

export const isElectron = platform.isElectron
export const isWeb = !platform.isElectron
export const isMac = platform.platform === 'darwin'
export const isWindows = platform.platform === 'win32'
export const isLinux = platform.platform === 'linux'

// 窗口控制 API
export const windowControl: WindowControl = window.__WINDOW__ || {
  minimize: async () => {},
  maximize: async () => {},
  close: async () => {},
  isMaximized: async () => false,
}
