import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('useLocalStorage', () => {
  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42))
    expect(result.current[0]).toBe(42)
  })

  it('returns stored value when localStorage has data', () => {
    localStorage.setItem('test-key', JSON.stringify(100))
    const { result } = renderHook(() => useLocalStorage('test-key', 42))
    expect(result.current[0]).toBe(100)
  })

  it('updates value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0))

    act(() => {
      result.current[1](99)
    })

    expect(result.current[0]).toBe(99)
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe(99)
  })

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10))

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
  })

  it('handles objects', () => {
    const initial = { name: 'test', count: 0 }
    const { result } = renderHook(() => useLocalStorage('obj-key', initial))

    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
  })

  it('returns fallback on corrupted JSON', () => {
    localStorage.setItem('bad', '{invalid')
    const { result } = renderHook(() => useLocalStorage('bad', 'default'))
    expect(result.current[0]).toBe('default')
  })
})
