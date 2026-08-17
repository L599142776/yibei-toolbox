# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

艺北工具箱（yibei-toolbox）— 89 个纯前端开发者工具集，支持 Web 浏览器和 Electron 桌面端（Windows/macOS/Linux）。
技术栈：React 19 + TypeScript 5.9 + Vite 8 + Electron 41 + Tailwind CSS 4

## 常用命令

```bash
npm run dev              # Web 开发服务器 → localhost:5173
npm run dev:electron     # Electron 开发模式 (ELECTRON_DEV=true)
npm run build            # TypeScript 类型检查 + Vite 生产构建
npm run build:electron   # Electron 完整构建 (tsc + vite + electron-builder)
npm run build:win        # Windows NSIS 安装包
npm run build:mac        # macOS DMG
npm run build:linux      # Linux AppImage/deb
npm run lint             # ESLint (flat config)
npm run test             # Vitest 单次运行
npm run test:watch       # Vitest 监听模式
npm run test:coverage    # Vitest 覆盖率 (src/utils/ 和 src/hooks/)
npm run preview          # Vite 预览服务器
```

## 架构核心

### 工具注册机制

所有工具在 `src/tools/registry.ts` 中注册为 `ToolManifest` 对象（id, name, description, category, icon, keywords, path, component）。路由在 `src/App.tsx` 中自动遍历 `allTools` 生成。**添加新工具只需两步：创建组件 + 在 registry.ts 添加条目。**

12 个分类定义于 `src/tools/categories.ts`：common, text, crypto, data, datetime, network, image, code, frontend, gis, entertainment, ai

每个工具组件用 `<ToolLayout>` 包裹，自动提供返回按钮、标题和描述。

### 路由策略

| 环境 | Router | 原因 |
|------|--------|------|
| `npm run dev` | BrowserRouter | 干净 URL |
| Electron | HashRouter | file:// 协议必须 |
| GitHub Pages | HashRouter | 子路径部署避免 404 |

定义于 `src/utils/router.ts`，自动检测。

### 状态管理

React Context（ThemeContext, FavoritesContext, CursorContext）+ localStorage 持久化。无 Redux/Zustand。

### 样式系统

- Tailwind CSS 4（`@tailwindcss/vite` 插件）
- CSS Variables（HSL 设计令牌）控制深色/浅色主题
- 自定义 UI 组件在 `src/components/ui/`（Dialog, Select, Table, Toast）— **非 shadcn**
- 图标统一使用 Lucide React

## TypeScript / ESLint 约束（严格）

- `verbatimModuleSyntax: true` → 类型导入必须用 `import type`
- `noUnusedLocals: true` + `noUnusedParameters: true`
- `erasableSyntaxOnly: true` → **禁止 `enum` / `namespace`**
- React 19 JSX 自动转换 → 无需 `import React`
- ESLint 使用 flat config（`eslint.config.js`），非旧版 `.eslintrc`

## Electron 要点

- 主进程：`electron/main.ts`，预加载：`electron/preload.ts`
- 窗口：`frame: false`, `titleBarStyle: 'hidden'`，macOS traffic lights
- 安全：`contextIsolation: true`, `nodeIntegration: false`, `shell.openExternal`
- IPC 通道：`window:minimize/maximize/close/isMaximized`
- 预加载暴露 `window.__PLATFORM__`（'electron' | 'web'）、`window.__WINDOW__`、`window.__WIDGET__`
- Widget 模式：通过 `?widget=true` 参数启用浮动工具窗口（alwaysOnTop, 520x640）
- 详细文档见 `electron/AGENTS.md`

## GIS 模块

- 依赖：Leaflet + React-Leaflet + Turf.js + shpjs + @microti/file-handler
- 每个工具独立 MapContainer 实例
- 坐标系约定：WGS84 (EPSG:4326) 为内部标准
- GeoJSON 使用 RFC 7946，坐标顺序 [lng, lat]
- ShapefileExplorer 实现地图+属性表双向联动（点击地图高亮表格行，点击表格行定位地图要素）
- 详细文档见 `src/tools/gis/AGENTS.md`

## 游戏工具模式

`src/tools/entertainment/` 下的自研游戏使用 Canvas + requestAnimationFrame，全部状态存于 `useRef` 避免 React re-render。`SuperMario.tsx` 例外：外部链接跳转。

## 禁止事项

- ❌ 不要在 `registry.ts` 外硬编码工具路由
- ❌ 不要移除 Electron 安全策略（contextIsolation, setWindowOpenHandler, will-navigate）
- ❌ 不要删除 `preload.ts` 中的 `__PLATFORM__` API
- ❌ 不要用 `enum` 或 `namespace`（erasableSyntaxOnly 禁止）
- ❌ 不要混用 `import` 和 `import type`（verbatimModuleSyntax 强制区分）
- ❌ GIS 模块不要混用 lng/lat 和 lat/lng 顺序
- ❌ 不要在 Turf.js 外计算球面距离

## 环境说明

- Node.js >= 18
- 包管理：yarn（CI 用 `yarn install --frozen-lockfile`），`yarn.lock` + `package-lock.json` 共存
- `.npmrc` 指向私有 registry（npm.cnb.cool），含 auth token，已在 .gitignore 中
- Vite 代理：`/phone-api` → 手机归属地查询，`/ai-api` → AI 聊天后端
