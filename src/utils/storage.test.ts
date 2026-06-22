import { describe, it, expect, beforeEach } from 'vitest'
import { getStorageItem, setStorageItem, removeStorageItem, getStorageString, setStorageString } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('getStorageItem / setStorageItem', () => {
  it('returns fallback when key does not exist', () => {
    expect(getStorageItem('missing', 42)).toBe(42)
  })

  it('stores and retrieves a value', () => {
    setStorageItem('count', 10)
    expect(getStorageItem('count', 0)).toBe(10)
  })

  it('handles objects', () => {
    const obj = { name: 'test', tags: ['a', 'b'] }
    setStorageItem('obj', obj)
    expect(getStorageItem('obj', {})).toEqual(obj)
  })

  it('handles arrays', () => {
    setStorageItem('arr', [1, 2, 3])
    expect(getStorageItem('arr', [])).toEqual([1, 2, 3])
  })

  it('returns fallback on invalid JSON', () => {
    localStorage.setItem('bad', '{invalid json')
    expect(getStorageItem('bad', 'default')).toBe('default')
  })
})

describe('removeStorageItem', () => {
  it('removes a stored item', () => {
    setStorageItem('key', 'value')
    removeStorageItem('key')
    expect(getStorageItem('key', null)).toBeNull()
  })
})

describe('getStorageString / setStorageString', () => {
  it('stores and retrieves raw string', () => {
    setStorageString('greeting', 'hello')
    expect(getStorageString('greeting')).toBe('hello')
  })

  it('returns fallback when missing', () => {
    expect(getStorageString('nope', 'fallback')).toBe('fallback')
  })

  it('returns empty string as default fallback', () => {
    expect(getStorageString('nope')).toBe('')
  })
})
