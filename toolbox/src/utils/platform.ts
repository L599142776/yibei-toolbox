// src/utils/platform.ts
// 平台检测工具

interface PlatformInfo {
  isElectron: boolean
  platform: string
}

declare global {
  interface Window {
    __PLATFORM__?: PlatformInfo
  }
}

export const platform: PlatformInfo = window.__PLATFORM__ || {
  isElectron: false,
  platform: 'web',
}

export const isElectron = platform.isElectron
export const isWeb = !platform.isElectron
