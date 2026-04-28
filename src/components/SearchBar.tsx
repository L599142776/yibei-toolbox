// src/components/SearchBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchTools } from '../tools/registry'
import { categories } from '../tools/categories'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const results = query.length > 0 ? searchTools(query) : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || catId

  return (
    <div ref={ref} className="search-bar">
      <div className="search-input-wrap">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="搜索工具..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {query ? (
          <button className="search-clear" onClick={() => { setQuery(''); setOpen(false) }}>
            <X size={16} />
          </button>
        ) : (
          <kbd className="search-kbd">⌘K</kbd>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((tool) => (
            <button
              key={tool.id}
              className="search-result-item"
              onClick={() => { navigate(tool.path); setQuery(''); setOpen(false) }}
            >
              <span className="search-result-name">{tool.name}</span>
              <span className="search-result-category">{getCategoryName(tool.category)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
