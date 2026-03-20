// src/tools/registry.ts
// 工具注册表 — 每个工具模块在此注册

import { lazy } from 'react'
import type { ToolManifest } from '../types/tool'

// ============================================================
// 注册区 — 每新增一个工具，在这里加一行
// 格式：{ id, name, description, category, icon, keywords, path, component }
// ============================================================

const toolModules: ToolManifest[] = [
  // ── 常用工具 ──
  {
    id: 'qr-generator',
    name: '二维码生成',
    description: '文本/URL 生成二维码图片',
    category: 'common',
    icon: 'QrCode',
    keywords: ['二维码', 'qr', 'qrcode', 'url'],
    path: '/common/qr-generator',
    component: lazy(() => import('./common/QrGenerator')),
  },
  {
    id: 'password-generator',
    name: '随机密码生成',
    description: '自定义长度和字符集，生成强随机密码',
    category: 'common',
    icon: 'KeyRound',
    keywords: ['密码', 'password', '随机', 'random'],
    path: '/common/password-generator',
    component: lazy(() => import('./common/PasswordGenerator')),
  },
  {
    id: 'uuid-generator',
    name: 'UUID 生成器',
    description: '生成 UUID v1/v4/v5 唯一标识',
    category: 'common',
    icon: 'Fingerprint',
    keywords: ['uuid', 'guid', '唯一标识'],
    path: '/common/uuid-generator',
    component: lazy(() => import('./common/UuidGenerator')),
  },
  {
    id: 'unit-converter',
    name: '单位转换',
    description: '长度、重量、温度、面积等单位换算',
    category: 'common',
    icon: 'ArrowLeftRight',
    keywords: ['单位', '转换', '换算', 'unit'],
    path: '/common/unit-converter',
    component: lazy(() => import('./common/UnitConverter')),
  },
  {
    id: 'base-converter',
    name: '进制转换',
    description: '二进制、八进制、十进制、十六进制互转',
    category: 'common',
    icon: 'Binary',
    keywords: ['进制', '二进制', '十六进制', 'binary', 'hex'],
    path: '/common/base-converter',
    component: lazy(() => import('./common/BaseConverter')),
  },
  {
    id: 'countdown',
    name: '计时器 / 倒计时',
    description: '秒表计时和倒计时功能',
    category: 'common',
    icon: 'Timer',
    keywords: ['计时', '倒计时', '秒表', 'timer'],
    path: '/common/countdown',
    component: lazy(() => import('./common/Countdown')),
  },

  // ── 文本处理 ──
  {
    id: 'word-counter',
    name: '字数统计',
    description: '统计字符数、词数、行数、段落数',
    category: 'text',
    icon: 'AlignLeft',
    keywords: ['字数', '统计', '字符', 'word count'],
    path: '/text/word-counter',
    component: lazy(() => import('./text/WordCounter')),
  },
  {
    id: 'text-cleaner',
    name: '文本去空格换行',
    description: '去除多余空格、换行，支持多种清洗模式',
    category: 'text',
    icon: 'Eraser',
    keywords: ['去空格', '去换行', '清洗', 'clean'],
    path: '/text/text-cleaner',
    component: lazy(() => import('./text/TextCleaner')),
  },
  {
    id: 'case-converter',
    name: '大小写转换',
    description: 'UPPER/lower/CamelCase/snake_case 等格式互转',
    category: 'text',
    icon: 'CaseSensitive',
    keywords: ['大小写', '驼峰', '下划线', 'case'],
    path: '/text/case-converter',
    component: lazy(() => import('./text/CaseConverter')),
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试',
    description: '实时验证正则匹配，高亮匹配结果',
    category: 'text',
    icon: 'Search',
    keywords: ['正则', 'regex', '匹配', 'match'],
    path: '/text/regex-tester',
    component: lazy(() => import('./text/RegexTester')),
  },

  // ── 编码加密 ──
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: 'Base64 文本和图片的编码与解码',
    category: 'crypto',
    icon: 'FileCode',
    keywords: ['base64', '编码', '解码'],
    path: '/crypto/base64',
    component: lazy(() => import('./crypto/Base64Tool')),
  },
  {
    id: 'url-encode',
    name: 'URL 编解码',
    description: 'URL 特殊字符的编码与解码',
    category: 'crypto',
    icon: 'Link',
    keywords: ['url', '编码', 'decode', 'encode'],
    path: '/crypto/url-encode',
    component: lazy(() => import('./crypto/UrlEncode')),
  },
  {
    id: 'unicode',
    name: 'Unicode 中文互转',
    description: 'Unicode 编码与中文字符互相转换',
    category: 'crypto',
    icon: 'Languages',
    keywords: ['unicode', '中文', '转码'],
    path: '/crypto/unicode',
    component: lazy(() => import('./crypto/UnicodeTool')),
  },
  {
    id: 'jwt-decoder',
    name: 'JWT 解析验证',
    description: '解码和验证 JSON Web Token',
    category: 'crypto',
    icon: 'ShieldCheck',
    keywords: ['jwt', 'token', '验证'],
    path: '/crypto/jwt-decoder',
    component: lazy(() => import('./crypto/JwtDecoder')),
  },
  {
    id: 'hash-generator',
    name: '哈希生成器',
    description: 'MD5 / SHA-1 / SHA-256 / SHA-512 等哈希计算',
    category: 'crypto',
    icon: 'Hash',
    keywords: ['hash', 'md5', 'sha', '哈希'],
    path: '/crypto/hash-generator',
    component: lazy(() => import('./crypto/HashGenerator')),
  },

  // ── 数据格式 ──
  {
    id: 'json-formatter',
    name: 'JSON 格式化',
    description: 'JSON 美化、压缩、验证',
    category: 'data',
    icon: 'Braces',
    keywords: ['json', '格式化', '美化', 'format'],
    path: '/data/json-formatter',
    component: lazy(() => import('./data/JsonFormatter')),
  },
  {
    id: 'json-to-csv',
    name: 'JSON ↔ CSV',
    description: 'JSON 数组与 CSV 互转',
    category: 'data',
    icon: 'Table',
    keywords: ['json', 'csv', '转换'],
    path: '/data/json-to-csv',
    component: lazy(() => import('./data/JsonToCsv')),
  },
  {
    id: 'json-to-yaml',
    name: 'JSON ↔ YAML',
    description: 'JSON 与 YAML 格式互转',
    category: 'data',
    icon: 'FileJson',
    keywords: ['json', 'yaml', '转换'],
    path: '/data/json-to-yaml',
    component: lazy(() => import('./data/JsonToYaml')),
  },

  // ── 时间日期 ──
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix 时间戳与日期时间互转',
    category: 'datetime',
    icon: 'Clock',
    keywords: ['时间戳', 'timestamp', 'unix'],
    path: '/datetime/timestamp',
    component: lazy(() => import('./datetime/Timestamp')),
  },
  {
    id: 'date-calculator',
    name: '日期计算器',
    description: '计算日期差值，日期加减天数',
    category: 'datetime',
    icon: 'CalendarDays',
    keywords: ['日期', '计算', '差值', 'date'],
    path: '/datetime/date-calculator',
    component: lazy(() => import('./datetime/DateCalculator')),
  },
  {
    id: 'cron-generator',
    name: 'Cron 表达式生成器',
    description: '可视化生成 Cron 表达式，预览最近执行时间',
    category: 'datetime',
    icon: 'CalendarClock',
    keywords: ['cron', '定时', '调度', 'schedule'],
    path: '/datetime/cron-generator',
    component: lazy(() => import('./datetime/CronGenerator')),
  },

  // ── 网络工具 ──
  {
    id: 'ip-lookup',
    name: 'IP 地址查询',
    description: '查询 IP 地址的地理位置和运营商信息',
    category: 'network',
    icon: 'MapPin',
    keywords: ['ip', '地址', '位置', 'location'],
    path: '/network/ip-lookup',
    component: lazy(() => import('./network/IpLookup')),
  },
  {
    id: 'ua-parser',
    name: 'User-Agent 解析',
    description: '解析 User-Agent 字符串，提取浏览器和系统信息',
    category: 'network',
    icon: 'Monitor',
    keywords: ['ua', 'user-agent', '浏览器'],
    path: '/network/ua-parser',
    component: lazy(() => import('./network/UaParser')),
  },

  // ── 图像工具 ──
  {
    id: 'image-compressor',
    name: '图片压缩',
    description: '纯前端图片压缩，支持质量调节',
    category: 'image',
    icon: 'Minimize2',
    keywords: ['图片', '压缩', 'compress'],
    path: '/image/image-compressor',
    component: lazy(() => import('./image/ImageCompressor')),
  },
  {
    id: 'base64-image',
    name: 'Base64 ↔ 图片',
    description: 'Base64 字符串与图片互转',
    category: 'image',
    icon: 'ImagePlus',
    keywords: ['base64', '图片', '转换'],
    path: '/image/base64-image',
    component: lazy(() => import('./image/Base64Image')),
  },

  // ── 代码工具 ──
  {
    id: 'code-formatter',
    name: '代码格式化',
    description: 'HTML / CSS / JS / JSON / SQL 代码美化',
    category: 'code',
    icon: 'Code2',
    keywords: ['格式化', '美化', 'format', 'prettier'],
    path: '/code/code-formatter',
    component: lazy(() => import('./code/CodeFormatter')),
  },
  {
    id: 'html-markdown',
    name: 'HTML ↔ Markdown',
    description: 'HTML 和 Markdown 格式互转',
    category: 'code',
    icon: 'FileText',
    keywords: ['html', 'markdown', '转换'],
    path: '/code/html-markdown',
    component: lazy(() => import('./code/HtmlMarkdown')),
  },

  // ── 常用工具（新增） ──
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum 生成器',
    description: '生成占位文本，支持英文和中文',
    category: 'common',
    icon: 'AlignJustify',
    keywords: ['lorem', '占位', '假文', 'dummy text'],
    path: '/common/lorem-ipsum',
    component: lazy(() => import('./common/LoremIpsum')),
  },

  // ── 文本处理（新增） ──
  {
    id: 'text-dedup',
    name: '文本去重',
    description: '按行、按词、按字符去除重复内容',
    category: 'text',
    icon: 'CopyMinus',
    keywords: ['去重', '重复', 'dedup', 'unique'],
    path: '/text/text-dedup',
    component: lazy(() => import('./text/TextDedup')),
  },
  {
    id: 'text-sort',
    name: '文本排序',
    description: '按行排序，支持升序/降序、数字/文本模式',
    category: 'text',
    icon: 'ArrowDownUp',
    keywords: ['排序', 'sort', '升序', '降序'],
    path: '/text/text-sort',
    component: lazy(() => import('./text/TextSort')),
  },
  {
    id: 'text-diff',
    name: '文本 Diff 对比',
    description: '逐行对比两段文本的差异',
    category: 'text',
    icon: 'GitCompare',
    keywords: ['diff', '对比', '比较', 'compare'],
    path: '/text/text-diff',
    component: lazy(() => import('./text/TextDiff')),
  },

  // ── 编码加密（新增） ──
  {
    id: 'hmac-generator',
    name: 'HMAC 生成器',
    description: '使用密钥计算 HMAC 哈希值',
    category: 'crypto',
    icon: 'KeySquare',
    keywords: ['hmac', '密钥', '签名'],
    path: '/crypto/hmac-generator',
    component: lazy(() => import('./crypto/HmacGenerator')),
  },
  {
    id: 'html-entity',
    name: 'HTML 实体编解码',
    description: 'HTML 特殊字符实体编码与解码',
    category: 'crypto',
    icon: 'Brackets',
    keywords: ['html', 'entity', '实体', '转义'],
    path: '/crypto/html-entity',
    component: lazy(() => import('./crypto/HtmlEntity')),
  },

  // ── 数据格式（新增） ──
  {
    id: 'sql-formatter',
    name: 'SQL 格式化',
    description: 'SQL 语句美化与格式化',
    category: 'data',
    icon: 'Database',
    keywords: ['sql', '格式化', '美化', 'database'],
    path: '/data/sql-formatter',
    component: lazy(() => import('./data/SqlFormatter')),
  },

  // ── 时间日期（新增） ──
  {
    id: 'timezone',
    name: '时区转换',
    description: '在不同时区之间转换时间',
    category: 'datetime',
    icon: 'Globe',
    keywords: ['时区', 'timezone', '转换'],
    path: '/datetime/timezone',
    component: lazy(() => import('./datetime/Timezone')),
  },
  {
    id: 'workday-calc',
    name: '工作日计算',
    description: '计算日期间工作日数，或加减工作日',
    category: 'datetime',
    icon: 'Briefcase',
    keywords: ['工作日', 'workday', '上班'],
    path: '/datetime/workday-calc',
    component: lazy(() => import('./datetime/WorkdayCalc')),
  },

  // ── 网络工具（新增） ──
  {
    id: 'http-tester',
    name: 'HTTP 请求测试',
    description: 'API 接口调试工具，支持多种请求方法',
    category: 'network',
    icon: 'Send',
    keywords: ['http', 'api', '请求', '接口'],
    path: '/network/http-tester',
    component: lazy(() => import('./network/HttpTester')),
  },
  {
    id: 'dns-lookup',
    name: 'DNS 查询',
    description: '通过 DNS over HTTPS 查询域名解析记录',
    category: 'network',
    icon: 'Server',
    keywords: ['dns', '域名', '解析', 'lookup'],
    path: '/network/dns-lookup',
    component: lazy(() => import('./network/DnsLookup')),
  },
  {
    id: 'url-parser',
    name: 'URL 解析器',
    description: '解析 URL 各组成部分和查询参数',
    category: 'network',
    icon: 'Link2',
    keywords: ['url', '解析', '参数', 'query'],
    path: '/network/url-parser',
    component: lazy(() => import('./network/UrlParser')),
  },

  // ── 图像工具（新增） ──
  {
    id: 'image-crop',
    name: '图片裁剪',
    description: '上传图片，指定区域裁剪',
    category: 'image',
    icon: 'Crop',
    keywords: ['裁剪', 'crop', '截图'],
    path: '/image/image-crop',
    component: lazy(() => import('./image/ImageCrop')),
  },

  // ── 前端开发（新增分类） ──
  {
    id: 'color-picker',
    name: '颜色工具',
    description: '颜色选择、格式转换、对比度检查',
    category: 'frontend',
    icon: 'Palette',
    keywords: ['颜色', 'color', '对比度', 'picker'],
    path: '/frontend/color-picker',
    component: lazy(() => import('./frontend/ColorPicker')),
  },
  {
    id: 'css-shadow',
    name: 'CSS 阴影生成器',
    description: '可视化生成 box-shadow 代码',
    category: 'frontend',
    icon: 'SquareShadow',
    keywords: ['阴影', 'shadow', 'box-shadow'],
    path: '/frontend/css-shadow',
    component: lazy(() => import('./frontend/CssShadow')),
  },
  {
    id: 'flexbox-playground',
    name: 'Flexbox 布局生成器',
    description: '可视化调整 Flexbox 属性，实时预览并生成代码',
    category: 'frontend',
    icon: 'LayoutGrid',
    keywords: ['flexbox', '布局', 'flex', 'css'],
    path: '/frontend/flexbox-playground',
    component: lazy(() => import('./frontend/FlexboxPlayground')),
  },
]

// ============================================================
// 注册表导出
// ============================================================

export const allTools: ToolManifest[] = toolModules

/** 按分类获取工具 */
export function getToolsByCategory(categoryId: string): ToolManifest[] {
  return toolModules.filter((t) => t.category === categoryId)
}

/** 通过 id 获取工具 */
export function getToolById(id: string): ToolManifest | undefined {
  return toolModules.find((t) => t.id === id)
}

/** 通过路径获取工具 */
export function getToolByPath(path: string): ToolManifest | undefined {
  return toolModules.find((t) => t.path === path)
}

/** 全局搜索 */
export function searchTools(query: string): ToolManifest[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return toolModules.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.toLowerCase().includes(q))
  )
}
