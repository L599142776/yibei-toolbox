import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// 检查是否为 Electron 环境或构建
const isElectron = process.env.ELECTRON_DEV || process.env.npm_lifecycle_event?.includes('electron')

// 检查是否为 GitHub Pages 环境
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [react(), tailwindcss()]

  if (isElectron) {
    const electron = (await import('vite-plugin-electron')).default
    const renderer = (await import('vite-plugin-electron-renderer')).default
    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
          onstart(args: { startup: () => void }) {
            args.startup()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args: { reload: () => void }) {
            args.reload()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
      ]),
      renderer(),
    )
  }

  return {
    plugins,
    // GitHub Pages 使用仓库名作为子路径，本地/Electron 使用相对路径
    base: isGitHubPages ? '/yibei-toolbox/' : './',
    server: {
      proxy: {
        '/phone-api': {
          target: 'http://api.songzixian.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/phone-api/, '/api/phone-location'),
        },
        // AI Chat API 代理
        '/ai-api': {
          target: 'https://ai.aurod.cn',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/ai-api/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
  }
})
