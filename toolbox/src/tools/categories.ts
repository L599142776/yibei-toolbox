// src/tools/categories.ts
// 所有工具分类定义

import type { Category } from '../types/tool'

export const categories: Category[] = [
  {
    id: 'common',
    name: '常用工具',
    icon: 'Star',
    description: '高频使用的日常工具集合',
    color: '#f59e0b',
  },
  {
    id: 'text',
    name: '文本处理',
    icon: 'Type',
    description: '文本统计、转换、清洗等处理工具',
    color: '#3b82f6',
  },
  {
    id: 'crypto',
    name: '编码加密',
    icon: 'Lock',
    description: '编解码、哈希、加解密工具',
    color: '#ef4444',
  },
  {
    id: 'data',
    name: '数据格式',
    icon: 'Braces',
    description: 'JSON、CSV、YAML 等数据格式处理',
    color: '#8b5cf6',
  },
  {
    id: 'datetime',
    name: '时间日期',
    icon: 'Clock',
    description: '时间戳、日期计算、时区转换',
    color: '#10b981',
  },
  {
    id: 'network',
    name: '网络工具',
    icon: 'Globe',
    description: 'HTTP、IP、DNS 等网络相关工具',
    color: '#06b6d4',
  },
  {
    id: 'image',
    name: '图像工具',
    icon: 'Image',
    description: '图片压缩、转换、处理工具',
    color: '#ec4899',
  },
  {
    id: 'code',
    name: '代码工具',
    icon: 'Code2',
    description: '代码格式化、转换、高亮工具',
    color: '#f97316',
  },
  {
    id: 'frontend',
    name: '前端开发',
    icon: 'Layout',
    description: 'CSS 生成器、布局工具、颜色工具',
    color: '#14b8a6',
  },
  {
    id: 'gis',
    name: 'GIS 地图',
    icon: 'Map',
    description: '地图文件解析、空间计算、坐标转换等 GIS 工具',
    color: '#059669',
  },
  {
    id: 'entertainment',
    name: '休闲娱乐',
    icon: 'Gamepad2',
    description: '经典小游戏，消遣放松',
    color: '#a855f7',
  },
  {
    id: 'ai',
    name: 'AI 对话',
    icon: 'Bot',
    description: 'AI 对话、模型选择、流式输出',
    color: '#6366f1',
  },
]
