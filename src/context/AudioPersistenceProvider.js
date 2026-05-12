import { AppState } from 'react-native'
import { useAudioPersistence } from './useAudioPersistence'
import { useLocalFallback } from './useLocalFallback'
import { useMMKVZustandSync } from './useMMKVZustandSync'

// Provider to ensure react-native-track-player remains active across all tabs
export const AudioPersistenceProvider = ({ children }) {
  const trackPlayer = useTrackPlayer()
  const { playbackState } = useAudioPersistence()
  
  // Keep the track player active and synced
  return (
    <TrackPlayerProvider>
      {children}
    </TrackPlayerProvider>
  )
}

export default AudioPersistenceProvider