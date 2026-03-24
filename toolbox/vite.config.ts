import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 仅在环境变量或 Electron 可用时加载 electron 插件
const hasElectron = process.env.ELECTRON_DEV === 'true'

export default defineConfig(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [react()]

  if (hasElectron) {
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
    base: './',
    server: {
      proxy: {
        '/phone-api': {
          target: 'http://api.songzixian.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/phone-api/, '/api/phone-location'),
        },
      },
    },
  }
})
