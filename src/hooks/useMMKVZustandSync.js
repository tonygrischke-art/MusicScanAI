import { useEffect, useState } from 'react'
import { MMKV } from 'react-native-mmkv'
import { useStore } from 'zustand'

// Hook to sync Zustand store with MMKV persistence
export const useMMKVZustandSync = (store) => {
  const [storage] = useState(() => new MMKV())
  const storeKey = 'zustand-store'

  // Load state from MMKV on app start
  useEffect(() => {
    const savedState = storage.getString(storeKey)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        store.setState(parsed)
      } catch (e) {
        console.warn('Failed to parse saved state:', e)
      }
    }
  }, [storage, store])

  // Save state to MMKV whenever store changes
  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      try {
        storage.set(storeKey, JSON.stringify(state))
      } catch (e) {
        console.warn('Failed to save state:', e)
      }
    })

    return unsubscribe
  }, [storage, store])

  return storage
}