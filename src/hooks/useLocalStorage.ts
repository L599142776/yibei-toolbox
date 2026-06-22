import { useState, useCallback } from 'react'
import { getStorageItem, setStorageItem } from '../utils/storage'

/**
 * 持久化 state，底层用 localStorage
 * 自动序列化/反序列化，内置 try-catch
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => getStorageItem(key, initialValue))

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value
        setStorageItem(key, nextValue)
        return nextValue
      })
    },
    [key]
  )

  return [storedValue, setValue]
}
