// src/utils/router.ts
// 根据环境自动选择 Router 类型
// Web → BrowserRouter (干净的 URL)
// Electron → HashRouter (file:// 协议下必须)

import { BrowserRouter, HashRouter } from 'react-router-dom'
import { isElectron } from './platform'

export const Router = isElectron ? HashRouter : BrowserRouter
