// src/App.tsx
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Router } from './utils/router'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CursorProvider } from './contexts/CursorContext'
import TitleBar from './components/TitleBar'
import SearchBar from './components/SearchBar'
import ThemeToggle from './components/ThemeToggle'
import Sidebar from './components/Sidebar'
import CustomCursor from './components/CustomCursor'
import CursorSettings from './components/CursorSettings'
import GlobalLoading from './components/GlobalLoading'
import Home from './pages/Home'
import Category from './pages/Category'
import { allTools } from './tools/registry'
import { isElectron } from './utils/platform'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <CursorProvider>
        <FavoritesProvider>
          <Router>
            <div className={`app ${isElectron ? 'electron' : ''}`}>
              <CustomCursor />
              
              {/* Electron 标题栏 */}
              <TitleBar />
              
              {/* 顶部导航栏 */}
              <header className="header">
                <div className="header-inner">
                  <button 
                    className="menu-btn"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="菜单"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                  
                  <a href="/" className="logo">
                    <div className="logo-icon">🧰</div>
                    <span className="logo-text">艺北工具箱</span>
                  </a>
                  
                  <SearchBar />
                  <CursorSettings />
                  <ThemeToggle />
                </div>
              </header>

            {/* 侧边栏 + 主内容区 */}
            <div className="layout">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              
              <main className="main">
                <Suspense fallback={<GlobalLoading message="页面加载中..." />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/:categoryId" element={<Category />} />
                    {allTools.map((tool) => (
                      <Route
                        key={tool.id}
                        path={tool.path}
                        element={<tool.component />}
                      />
                    ))}
                  </Routes>
                </Suspense>
              </main>
            </div>

            {/* 移动端底部导航 */}
            <nav className="bottom-nav">
              <button 
                className="bottom-nav-item active"
                onClick={() => window.location.href = '/'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
                <span>首页</span>
              </button>
              <button 
                className="bottom-nav-item"
                onClick={() => window.location.href = '/?tab=all'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>工具</span>
              </button>
              <button 
                className="bottom-nav-item"
                onClick={() => window.location.href = '/?tab=favorites'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span>收藏</span>
              </button>
              <button 
                className="bottom-nav-item"
                onClick={() => setSidebarOpen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span>菜单</span>
              </button>
            </nav>
          </div>
        </Router>
      </FavoritesProvider>
    </CursorProvider>
  </ThemeProvider>
  )
}

export default App