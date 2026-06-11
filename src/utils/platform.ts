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

interface WidgetAPI {
  create: (toolId: string, toolName: string, path: string) => Promise<void>
  close: (toolId: string) => Promise<void>
  getToolId: () => Promise<string | null>
}

declare global {
  interface Window {
    __PLATFORM__?: PlatformInfo
    __WINDOW__?: WindowControl
    __WIDGET__?: WidgetAPI
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

// 判断当前是否 Widget 窗口
export const isWidget = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('widget') === 'true'

// 窗口控制 API
export const windowControl: WindowControl = window.__WINDOW__ || {
  minimize: async () => {},
  maximize: async () => {},
  close: async () => {},
  isMaximized: async () => false,
}

// Widget API
export const widgetAPI: WidgetAPI = window.__WIDGET__ || {
  create: async () => {},
  close: async () => {},
  getToolId: async () => null,
}
