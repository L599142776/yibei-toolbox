# 艺北工具箱

**Generated:** 2026-06-10
**Tech Stack:** React 19 + TypeScript 5.9 + Vite 8 + Electron 41 + Tailwind CSS 4

## COMMANDS (顺序重要)

```bash
npm run dev              # Web 开发 → localhost:5173
npm run dev:electron     # Electron 开发 (ELECTRON_DEV=true)
npm run build            # tsc -b && vite build (typecheck + bundle)
npm run lint             # eslint . (flat config)
npm run preview          # vite preview
npm run build:win        # Windows NSIS 打包
npm run build:mac        # macOS DMG 打包
npm run build:linux      # Linux AppImage/deb 打包
```

## ARCHITECTURE

- **81 个工具**，`src/tools/registry.ts` 中注册，lazy loaded
- **12 个分类**，定义于 `src/tools/categories.ts`
- 每个工具组件用 `<ToolLayout>` 包裹（自动提供返回按钮 + 标题 + 描述）
- 路由自动生成：`src/App.tsx` 遍历 `allTools` 生成 `<Route>`
- 无测试框架（无 jest/vitest），无 opencode.json

## Router 切换逻辑

| 环境 | 使用 | 原因 |
|------|------|------|
| `npm run dev` | BrowserRouter | 干净 URL |
| Electron | HashRouter | file:// 协议必须 |
| GitHub Pages (`GITHUB_PAGES=true`) | HashRouter | 子路径部署避免 404 |

定义于 `src/utils/router.ts`，自动检测。

## TS / LINT 约束 (严格)

- `verbatimModuleSyntax: true` → 类型导入必须用 `import type`
- `noUnusedLocals: true` + `noUnusedParameters: true`
- `erasableSyntaxOnly: true` → 禁止 `enum` / `namespace`
- React 19 JSX 自动转换 → 无需 `import React`
- ESLint flat config (`eslint.config.js`)，非旧版 `.eslintrc`

## STYLE

- Tailwind CSS 4 (`@tailwindcss/vite` 插件)
- CSS Variables 控制主题色（深色/浅色），`globals.css` 中定义
- 自定义 UI 组件在 `src/components/ui/`（Dialog, Select, Table, Toast）— **非 shadcn**
- 图标用 Lucide React

## ELECTRON 要点

- `ELECTRON_DEV=true` 环境变量激活 `vite-plugin-electron`
- 窗口：`frame: false`, `titleBarStyle: 'hidden'`, macOS traffic lights
- 安全：`contextIsolation: true`, `nodeIntegration: false`, `shell.openExternal`
- IPC 通道：`window:minimize/maximize/close/isMaximized`
- 预加载暴露 `window.__PLATFORM__`、`window.__WINDOW__`
- 禁止外链导航（`will-navigate` 拦截，只看 `localhost:5173` 和 `file:`）

## Electron 子模块

参见 `electron/AGENTS.md` — 含完整安全策略和 IPC 文档。

## GIS 子模块

参见 `src/tools/gis/AGENTS.md` — Leaflet + Turf.js + shpjs 详情。

## 游戏工具模式

`src/tools/entertainment/` 下的自研游戏使用 **Canvas + requestAnimationFrame** 实现，全部自绘（无外部资源）。典型模式：

- 全部状态存于 `useRef`，避免 React re-render
- 每帧通过 `requestAnimationFrame` 驱动
- 键盘事件用 `useEffect`（空依赖数组）直接操作 ref
- `AircraftBattle.tsx`、`BlackHole.tsx`、`Minesweeper.tsx`

**SuperMario.tsx** 例外：该工具为外部在线游戏链接（supermarioplay.com），通过 `window.open` 在新标签页打开，非自绘实现。

## NPM 注意

- `.npmrc` 指向私有 registry (`npm.cnb.cool`)
- `yarn.lock` + `package-lock.json` 共存，CI 用 `yarn install --frozen-lockfile`

## ANTI-PATTERNS

- ❌ 不要在 `registry.ts` 外硬编码工具路由
- ❌ 不要移除 Electron 安全策略（`contextIsolation`, `setWindowOpenHandler`, `will-navigate`）
- ❌ 不要删除 `preload.ts` 中的 `__PLATFORM__` API
- ❌ 不要用 `enum` 或 `namespace`（`erasableSyntaxOnly` 禁止）
- ❌ 不要混用 `import` 和 `import type`（`verbatimModuleSyntax` 强制区分）
