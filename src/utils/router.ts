// src/utils/router.ts
// 根据环境自动选择 Router 类型
// Web 开发 → BrowserRouter (干净的 URL)
// Electron → HashRouter (file:// 协议下必须)
// GitHub Pages → HashRouter (子路径部署，避免 404)

import { BrowserRouter, HashRouter } from 'react-router-dom'
import { isElectron } from './platform'

// 检测 GitHub Pages 环境（构建时注入 VITE_GITHUB_PAGES=true）
const isGitHubPages = import.meta.env.VITE_GITHUB_PAGES === 'true'

export const Router = isElectron || isGitHubPages ? HashRouter : BrowserRouter
