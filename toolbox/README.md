# 🧰 艺北工具箱

纯前端开发者在线工具集，支持 **Web 浏览器** 和 **桌面应用 (Electron)**。

## ✨ 特性

- 🔧 **80+ 个工具** — 覆盖编码、加密、JSON、时间、网络、图像、GIS 地图等场景
- 📦 **模块化架构** — 每个工具独立模块，新增工具只需 3 步
- 🔍 **全局搜索** — 模糊匹配工具名、描述、关键词
- ⭐ **收藏功能** — 常用工具一键收藏，本地存储
- 🌙 **深色/浅色主题** — 适配暗色和亮色环境，毛玻璃效果
- 📱 **响应式布局** — 桌面端和移动端自适应
- 🖥️ **跨平台** — Web 浏览器 + Windows/macOS/Linux 桌面应用
- 🗺️ **GIS 工具** — 地图文件解析、坐标转换、面积距离计算
- 📊 **增强数据表格** — 列宽拖拽调整、毛玻璃表头、分页显示

## 🛠️ 工具分类

| 分类 | 工具数 | 示例 |
|------|--------|------|
| 常用工具 | 13 | 二维码生成、随机密码、UUID、单位转换、进制转换、计时器、Lorem Ipsum |
| 文本处理 | 10 | 字数统计、去空格换行、大小写转换、正则测试、去重、排序、Diff 对比 |
| 编码加密 | 9 | Base64、URL编解码、Unicode互转、JWT解析、哈希生成、HMAC、**AES/RSA加解密**、HTML实体 |
| 数据格式 | 8 | JSON格式化、JSON↔CSV、JSON↔YAML、SQL格式化 |
| 时间日期 | 6 | 时间戳转换、日期计算器、Cron生成器、时区转换、工作日计算 |
| 网络工具 | 8 | HTTP请求测试、IP查询、DNS查询、User-Agent解析、URL解析器 |
| 图像工具 | 6 | 图片压缩、图片裁剪、Base64↔图片 |
| 代码工具 | 3 | 代码格式化、HTML↔Markdown |
| 前端开发 | 4 | 颜色工具、CSS阴影生成器、Flexbox布局生成器 |
| **GIS 地图** | **8** | 地图文件查看器、多边形面积计算、距离测量、坐标系转换、GeoJSON编辑器、边界框工具 |
| 休闲娱乐 | 4 | 经典小游戏 |

### 🗺️ GIS 工具详情

| 工具 | 功能 |
|------|------|
| 地图文件查看器 | 解析 Shapefile(.zip) / GeoJSON / KML / GPX，地图可视化，多图层叠加 |
| 多边形面积计算 | 地图绘制 / 坐标输入 / **WKT 导入**，计算面积(km²/公顷/亩)和周长 |
| 距离测量 | 地图选点或坐标输入，大圆距离、方位角、中点计算 |
| 坐标系转换 | WGS84 ↔ GCJ-02(高德) ↔ BD-09(百度) ↔ Mercator ↔ UTM ↔ DMS，支持批量 |
| GeoJSON 编辑器 | 在线编辑/验证/格式化，实时地图预览，统计分析 |
| 边界框工具 | 生成和可视化 bbox，输出 GeoJSON / LatLng / Google Maps 等多种格式 |
| 地图坐标拾取 | 点击地图获取坐标，支持 WGS84 / DMS / UTM 多种格式 |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm / yarn

### Web 前端开发

```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

### Electron 桌面应用开发

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
│   │   ├── code/             # 代码工具
│   │   ├── frontend/         # 前端开发
│   │   └── gis/              # GIS 地图工具
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

- **框架**: React 19 + TypeScript
- **构建**: Vite 8
- **路由**: React Router v7
- **样式**: CSS Variables + CSS Modules（深色/浅色主题、毛玻璃效果）
- **图标**: Lucide React
- **地图**: Leaflet + React-Leaflet
- **空间计算**: Turf.js
- **表格**: @tanstack/react-table + @tanstack/react-virtual
- **文件处理**: @microti/file-handler
- **桌面端**: Electron + electron-builder
- **状态管理**: React Context + localStorage

## 📄 License

MIT
