// src/types/tool.ts
// 工具系统的统一类型定义

export interface ToolManifest {
  id: string
  name: string
  description: string
  category: string
  icon: string
  keywords: string[]
  path: string
  component: React.LazyExoticComponent<React.ComponentType>
}

export interface Category {
  id: string
  name: string
  icon: string
  description: string
  color: string
}
