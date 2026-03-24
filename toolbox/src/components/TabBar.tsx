// src/components/TabBar.tsx
import { useState } from 'react'
import { Home, Grid3X3, List, Star } from 'lucide-react'

type Tab = 'home' | 'categories' | 'all' | 'favorites'

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, label: '首页', icon: Home },
    { id: 'categories' as const, label: '分类', icon: Grid3X3 },
    { id: 'all' as const, label: '全部', icon: List },
    { id: 'favorites' as const, label: '收藏', icon: Star },
  ]

  return (
    <div className="tab-bar">
      <div className="tab-bar-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type { Tab }