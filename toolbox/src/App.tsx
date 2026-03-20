// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import { Router } from './utils/router'
import { FavoritesProvider } from './contexts/FavoritesContext'
import SearchBar from './components/SearchBar'
import Home from './pages/Home'
import Category from './pages/Category'
import { allTools } from './tools/registry'
import './App.css'

function App() {
  return (
    <FavoritesProvider>
      <Router>
        <div className="app">
          <header className="header">
            <div className="header-inner">
              <a href="/" className="logo">
                🧰 艺北工具箱
              </a>
              <SearchBar />
            </div>
          </header>
          <main className="main">
            <Suspense fallback={<div className="loading">加载中...</div>}>
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
          <footer className="footer">
            <p>艺北工具箱 · 纯前端 · 无需后端 · 所有数据本地处理</p>
          </footer>
        </div>
      </Router>
    </FavoritesProvider>
  )
}

export default App
