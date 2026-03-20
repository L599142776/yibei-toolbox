# 🧰 艺北工具箱

纯前端开发者在线工具集，支持 **Web 浏览器** 和 **桌面应用 (Electron)**。

## ✨ 特性

- 🔧 **28+ 工具** — 覆盖编码、加密、JSON、时间、网络、图像等常用场景
- 📦 **模块化架构** — 每个工具独立模块，新增工具只需 3 步
- 🔍 **全局搜索** — 模糊匹配工具名、描述、关键词
- ⭐ **收藏功能** — 常用工具一键收藏，本地存储
- 🌙 **深色主题** — 适配暗色环境
- 📱 **响应式布局** — 桌面端和移动端自适应
- 🖥️ **跨平台** — Web 浏览器 + Windows/macOS/Linux 桌面应用

## 🛠️ 工具分类

| 分类 | 工具数 | 示例 |
|------|--------|------|
| 常用工具 | 6 | 二维码生成、随机密码、UUID、单位转换、进制转换、计时器 |
| 文本处理 | 4 | 字数统计、去空格换行、大小写转换、正则测试 |
| 编码加密 | 5 | Base64、URL编解码、Unicode互转、JWT解析、哈希生成 |
| 数据格式 | 3 | JSON格式化、JSON↔CSV、JSON↔YAML |
| 时间日期 | 3 | 时间戳转换、日期计算器、Cron生成器 |
| 网络工具 | 2 | IP地址查询、User-Agent解析 |
| 图像工具 | 2 | 图片压缩、Base64↔图片 |
| 代码工具 | 2 | 代码格式化、HTML↔Markdown |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm

### Web 开发

```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

### 桌面应用开发

```bash
npm install
npm run dev:electron
# 自动启动 Electron 窗口
```

### 打包

```bash
# Web 静态站点
npm run build
# 输出: dist/

# Windows 桌面应用
npm run build:win
# 输出: release/*.exe

# macOS 桌面应用
npm run build:mac
# 输出: release/*.dmg

# Linux 桌面应用
npm run build:linux
# 输出: release/*.AppImage, *.deb
```

## 📁 项目结构

```
toolbox/
├── electron/                  # Electron 主进程
│   ├── main.ts               # 主窗口、安全策略
│   └── preload.ts            # 预加载脚本
├── src/
│   ├── components/           # 共用组件
│   │   ├── SearchBar.tsx     # 全局搜索
│   │   ├── ToolCard.tsx      # 工具卡片
│   │   └── ToolLayout.tsx    # 工具页布局
│   ├── contexts/             # React Context
│   ├── pages/                # 页面
│   ├── tools/                # 🔧 工具模块（核心）
│   │   ├── registry.ts       # 工具注册表
│   │   ├── categories.ts     # 分类定义
│   │   ├── common/           # 常用工具
│   │   ├── text/             # 文本处理
│   │   ├── crypto/           # 编码加密
│   │   ├── data/             # 数据格式
│   │   ├── datetime/         # 时间日期
│   │   ├── network/          # 网络工具
│   │   ├── image/            # 图像工具
│   │   └── code/             # 代码工具
│   ├── types/                # 类型定义
│   └── utils/                # 工具函数
├── REQUIREMENTS.md           # 需求分析文档
├── package.json
└── vite.config.ts
```

## ➕ 新增工具

只需 3 步：

**1. 创建工具组件** `src/tools/<category>/MyTool.tsx`

```tsx
import ToolLayout from '../../components/ToolLayout'

export default function MyTool() {
  return (
    <ToolLayout title="我的工具" description="工具描述">
      {/* 工具内容 */}
    </ToolLayout>
  )
}
```

**2. 在 `src/tools/registry.ts` 中注册**

```ts
{
  id: 'my-tool',
  name: '我的工具',
  description: '一句话描述',
  category: 'common',
  icon: 'Tool',
  keywords: ['关键词'],
  path: '/common/my-tool',
  component: lazy(() => import('./common/MyTool')),
}
```

**3. 完成** — 自动出现在首页、分类页、搜索结果中。

## 🔧 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **路由**: React Router v6
- **样式**: CSS Variables（深色主题）
- **图标**: Lucide React
- **桌面端**: Electron + electron-builder
- **状态管理**: React Context + localStorage

## 📄 License

MIT
