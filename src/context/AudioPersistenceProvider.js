import React, { useEffect } from 'react'
import { AppState } from 'react-native'
import { useAudioPersistence } from './useAudioPersistence'
import { useLocalFallback } from './useLocalFallback'
import { useMMKVZustandSync } from './useMMKVZustandSync'
import TrackPlayer, {
  Capability,
  Event,
  TrackPlayerProvider,
} from 'react-native-track-player'

// Provider to ensure react-native-track-player remains active across all tabs
export const AudioPersistenceProvider = ({ children }) => {
  const { playbackState } = useAudioPersistence()
  const { syncState } = useMMKVZustandSync()

  // Track app state changes to keep playback alive
  useEffect(() => {
    const handleAppStateChange = (nextState) => {
      if (nextState === 'active') {
        syncState()
      }
    }
    const unsubscribe = AppState.addEventListener('change', handleAppStateChange)
    return () => unsubscribe()
  }, [])

  // Keep the track player active and synced on mount
  useEffect(() => {
    syncState()
  }, [])

  return (
    <TrackPlayerProvider>
      {children}
    </TrackPlayerProvider>
  )
}

export default AudioPersistenceProvider