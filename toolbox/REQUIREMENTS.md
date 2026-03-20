# 需求分析

## 1. 参考对标：极速箱 (jisuxiang.com)

### 极速箱现有能力（36个工具）

| 分类 | 工具 |
|------|------|
| **JSON工具** | JSON格式化、JSON编辑器、JSON转换工具(JSON↔XML/CSV/YAML) |
| **编码加密** | 编码转换(Base64/URL/Unicode/HTML实体)、URL编解码、Unicode中文互转、进制转换、JWT解析验证、加密解密(MD5/SHA/AES/DES) |
| **时间日期** | 时间戳转换、日期计算器、时区转换、Cron表达式生成器 |
| **网络工具** | HTTP请求测试、IP地址查询 |
| **文本处理** | 文件格式转Markdown、正则表达式测试、文本字数统计、文本去空格换行 |
| **图像工具** | 图片压缩、二维码生成、图标设计器、Base64图片转换、图片水印、图片转ICO |
| **代码工具** | 代码格式化(HTML/CSS/JS/SQL)、HTML与Markdown互转、YML↔Properties、随机密码生成器 |
| **前端开发** | 颜色工具、CSS渐变生成器 |
| **PDF工具** | PDF转换器、PDF合并切割、PDF压缩器 |

### 极速箱的不足

1. **UI 一般** — 功能能用但没设计感，卡片式布局偏朴素
2. **无搜索/收藏** — 工具多了找起来费劲
3. **无深色模式**
4. **不可扩展** — 不是模块化架构，加工具要改散落的代码
5. **分类有限** — 只有 9 个分类
6. **无工具间联动** — 每个工具独立，不能组合使用

## 2. 我们的目标：超越极速箱

### 核心差异化

| 维度 | 极速箱 | 我们 |
|------|--------|------|
| 工具数量 | ~36 | 80+（第一期50+，持续扩展） |
| 架构 | 耦合 | 完全模块化，每个工具独立注册 |
| UI | 基础卡片 | 现代设计 + 深色模式 + 动效 |
| 搜索 | 无 | 全局模糊搜索 + 分类筛选 |
| 收藏 | 无 | 本地收藏常用工具 |
| 工具联动 | 无 | 输入输出可组合 |
| 响应式 | 一般 | 移动端友好 |

## 3. 工具分类体系（12大类）

### 📋 常用工具 (common)
- 二维码生成/解析、随机密码生成、UUID生成、Lorem Ipsum生成、Lorem Ipsum中文、计时器/秒表、单位转换、进制转换

### 📝 文本处理 (text)
- 文本字数统计、文本去空格换行、文本大小写转换、文本去重、文本排序、文本Diff对比、正则表达式测试、字符串编解码(Morse/Caesar等)

### 🔐 编码加密 (crypto)
- Base64编解码、URL编解码、Unicode中文互转、HTML实体编解码、进制转换、JWT解析验证、加密解密(MD5/SHA/AES/DES/RSA)、哈希生成器、HMAC生成

### 📊 数据格式 (data)
- JSON格式化/压缩、JSON编辑器、JSON↔XML、JSON↔CSV、JSON↔YAML、JSON Schema验证、CSV预览/编辑、SQL格式化

### ⏰ 时间日期 (datetime)
- 时间戳转换、日期计算器、时区转换、Cron表达式生成器、倒计时、年龄计算、工作日计算

### 🌐 网络工具 (network)
- HTTP请求测试、IP地址查询、User-Agent解析、端口检查、DNS查询、Whois查询、SSL证书查看、MAC地址查询、URL解析器

### 🖼️ 图像工具 (image)
- 图片压缩、图片裁剪、图片格式转换、图片水印、图片转Base64/Base64转图片、图片转ICO、EXIF信息查看、GIF拆帧/合成、SVG编辑器、调色板提取

### 💻 代码工具 (code)
- 代码格式化(HTML/CSS/JS/TS/SQL/JSON)、HTML↔Markdown、YML↔Properties、JSON↔TypeScript类型、代码高亮分享、Diff查看器、正则可视化

### 🎨 前端开发 (frontend)
- CSS渐变生成器、CSS阴影生成器、CSS动画生成器、Flexbox/Grid布局生成器、颜色选择器/对比度检查、SVG图案生成、响应式断点预览、Font预览、Tailwind类名查找

### 📄 PDF工具 (pdf)
- PDF转图片、PDF合并、PDF分割、PDF压缩、PDF加水印

### 📐 设计工具 (design)
- 调色板生成器、配色方案生成、图标设计器、Favicon生成器、截图美化、Mockup生成器

### 🔢 数学计算 (math)
- BMI计算器、贷款计算器、复利计算器、百分比计算器、利率计算器、汇率查询

## 4. 模块化架构设计

### 核心原则

```
每个工具 = 一个独立模块目录
每个模块 = 统一接口 + 独立实现
```

### 工具模块结构

```
src/tools/<category>/<tool-id>/
├── index.tsx          # 工具组件（主入口）
├── manifest.ts        # 工具元数据（名称、描述、分类、图标、关键词）
└── utils.ts           # 工具内部逻辑（可选）
```

### manifest.ts 接口

```typescript
interface ToolManifest {
  id: string                    // 唯一标识，如 "json-formatter"
  name: string                  // 显示名称
  description: string           // 一句话描述
  category: string              // 所属分类 id
  icon: string                  // Lucide 图标名
  keywords: string[]            // 搜索关键词
  path: string                  // 路由路径，如 "/data/json-formatter"
}
```

### 注册机制

```typescript
// src/tools/registry.ts
// 自动收集所有模块的 manifest，构建工具目录
```

### 分类注册

```typescript
// src/tools/categories.ts
interface Category {
  id: string
  name: string
  icon: string
  description: string
}
```

## 5. 技术栈

- **框架:** React 18 + TypeScript
- **构建:** Vite
- **路由:** React Router v6
- **样式:** TailwindCSS + CSS Modules
- **图标:** Lucide React
- **状态:** 本地存储 + React Context
- **部署:** 静态部署（纯前端，无后端）

## 6. 页面结构

```
/                     → 首页（分类卡片 + 搜索 + 收藏）
/:category            → 分类页（该分类下所有工具）
/:category/:tool      → 工具页（具体工具界面）
/about                → 关于
```

## 7. 第一期目标（MVP）

第一期实现 30 个核心工具，覆盖最常用场景：

**常用工具 (6):** 二维码生成、随机密码、UUID生成、单位转换、进制转换、计时器
**文本处理 (4):** 字数统计、去空格换行、大小写转换、正则测试
**编码加密 (5):** Base64、URL编解码、Unicode互转、JWT解析、哈希生成
**数据格式 (4):** JSON格式化、JSON编辑器、JSON↔CSV、JSON↔YAML
**时间日期 (3):** 时间戳转换、日期计算器、Cron生成器
**网络工具 (3):** HTTP测试、IP查询、User-Agent解析
**图像工具 (3):** 图片压缩、图片格式转换、Base64图片转换
**代码工具 (2):** 代码格式化、HTML↔Markdown
