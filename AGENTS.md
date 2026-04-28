# 艺北工具箱 - 项目知识库

**Generated:** 2026-03-20
**Tech Stack:** React 19 + TypeScript + Vite 8 + Electron 41

## OVERVIEW
开发者在线工具集，支持 Web + 桌面端 (Electron)。48 个工具覆盖编码、加密、GIS地图等场景。

## STRUCTURE
```
toolbox/
├── electron/              # Electron 主进程
├── src/
│   ├── components/        # 公共组件 (ToolLayout, ToolCard, SearchBar...)
│   ├── contexts/          # React Context (Theme, Favorites)
│   ├── pages/             # Home, Category
│   ├── tools/             # 🔧 工具模块 (registry.ts 集中注册)
│   │   ├── gis/           # GIS 地图工具 (Leaflet + Turf.js)
│   │   ├── common/        # 常用工具
│   │   ├── crypto/        # 编码加密
│   │   └── ...
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数 (platform.ts, router.ts)
├── public/                # 静态资源
├── vite.config.ts         # 构建配置
├── tsconfig.app.json      # 前端 TS 配置
└── tsconfig.node.json     # Node/Electron TS 配置
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 新增工具 | `src/tools/<category>/` | 3步完成，参考 README |
| 工具注册 | `src/tools/registry.ts` | 所有工具在此注册 |
| 工具分类 | `src/tools/categories.ts` | 分类定义 |
| 公共组件 | `src/components/` | ToolLayout, ToolCard 等 |
| Electron | `electron/main.ts` | 窗口管理、安全策略 |
| 路由逻辑 | `src/utils/router.ts` | HashRouter (file://) vs BrowserRouter |
| 主题样式 | `src/contexts/ThemeContext.tsx` | 深色主题 |
| 收藏功能 | `src/contexts/FavoritesContext.tsx` | localStorage 持久化 |

## CONVENTIONS (THIS PROJECT)
- **ESLint Flat Config** — 使用 `eslint.config.js` (v9)，非旧版 .eslintrc
- **React 19 JSX Transform** — `jsx: "react-jsx"`，无需 import React
- **Strict TypeScript** — `strict: true` + `verbatimModuleSyntax`
- **条件 Electron** — `ELECTRON_DEV=true` 时加载 Electron 插件
- **相对路径** — `base: './'` 支持 file:// 协议

## ANTI-PATTERNS (THIS PROJECT)
- ❌ 不要在 `src/tools/registry.ts` 外硬编码工具路由
- ❌ 不要删除 `preload.ts` 中的 `__PLATFORM__` API
- ❌ 不要移除 `electron/main.ts` 中的安全策略 (`setWindowOpenHandler`)

## COMMANDS
```bash
npm run dev           # Web 开发 (localhost:5173)
npm run dev:electron  # Electron 开发
npm run build        # Web 构建
npm run build:win    # Windows 打包
npm run lint         # ESLint 检查
```

## GIS TOOLS
- **Leaflet + React-Leaflet** — 地图渲染
- **Turf.js (@turf/turf)** — 空间计算 (面积、距离、坐标转换)
- **shpjs** — Shapefile 解析
- 详见 `src/tools/gis/AGENTS.md`

## NOTES
- 移动端使用 `window.location.href` 跳转（非 React Router）— 保持 SPA 兼容性
- Electron 标题栏使用 `frame: false` + `titleBarStyle: hidden`
- 收藏数据存储在 `localStorage`
