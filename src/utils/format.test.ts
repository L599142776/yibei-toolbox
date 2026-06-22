import { describe, it, expect } from 'vitest'
import { formatNumber, truncate, formatFileSize, formatRelativeTime, escapeHtml, sleep } from './format'

describe('formatNumber', () => {
  it('formats with thousand separators', () => {
    expect(formatNumber(1234567)).toMatch(/1[,.]234[,.]567/)
  })
  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })
  it('handles negative numbers', () => {
    expect(formatNumber(-42)).toContain('42')
  })
})

describe('truncate', () => {
  it('returns original if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })
  it('truncates with suffix', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })
  it('uses custom suffix', () => {
    expect(truncate('hello world', 5, '…')).toBe('hello…')
  })
})

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })
  it('formats KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })
  it('formats MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })
  it('formats GB', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })
})

describe('formatRelativeTime', () => {
  it('says "刚刚" for recent time', () => {
    expect(formatRelativeTime(Date.now() - 5000)).toBe('刚刚')
  })
  it('says minutes ago', () => {
    expect(formatRelativeTime(Date.now() - 120000)).toBe('2 分钟前')
  })
  it('says hours ago', () => {
    expect(formatRelativeTime(Date.now() - 7200000)).toBe('2 小时前')
  })
  it('says days ago', () => {
    expect(formatRelativeTime(Date.now() - 172800000)).toBe('2 天前')
  })
})

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })
})

describe('sleep', () => {
  it('resolves after delay', async () => {
    const start = Date.now()
    await sleep(50)
    expect(Date.now() - start).toBeGreaterThanOrEqual(40)
  })
})
