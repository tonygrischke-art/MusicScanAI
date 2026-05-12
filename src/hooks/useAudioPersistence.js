import { useEffect, useCallback } from 'react'
import TrackPlayer from 'react-native-track-player'
import { useStore } from 'zustand'

// Hook to ensure audio persists across all tabs
export const useAudioPersistence = () => {
  const setupPlayer = useCallback(async () => {
    await TrackPlayer.setupPlayer({
      waitForBuffer: true,
      maxCacheSize: 100000, // 100MB cache
      maxBuffer: 1000, // 1 second
    })
  }, [])

  useEffect(() => {
    setupPlayer()
  }, [setupPlayer])

  return {
    setupPlayer,
  }
}