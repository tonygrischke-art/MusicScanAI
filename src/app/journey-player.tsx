import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useJourneyStore } from '../store/journeyStore';
import { useAudioStore } from '../stores/useAudioStore';
import { JourneyPlayer } from '../components/JourneyPlayer';
import { DreamJourney } from '../types/journey';
import TrackPlayer, { Event } from 'react-native-track-player';

export default function JourneyPlayerScreen() {
  const { journeyId } = useLocalSearchParams<{ journeyId: string }>();
  const { journeys, setCurrentJourney, incrementPlayCount } = useJourneyStore();
  const { queue, setQueue, setCurrentTrack, currentTrack } = useAudioStore();
  const router = useRouter();

  const [journey, setJourney] = useState<DreamJourney | null>(null);
  const [localTrackIndex, setLocalTrackIndex] = useState(0);
  const [isPlaying, setIsPlayingState] = useState(false);

  // Load journey when journeyId changes
  useEffect(() => {
    if (journeyId) {
      const found = journeys.find(j => j.id === journeyId);
      if (found) {
        setJourney(found);
        setCurrentJourney(found);
        incrementPlayCount(found.id);
        
        // Set up audio queue
        const trackQueue = found.tracks.map(jt => jt.track);
        setQueue(trackQueue);
        setCurrentTrack(trackQueue[0]);
        setLocalTrackIndex(0);
        
        // Start playback via TrackPlayer
        initializePlayback(trackQueue);
      } else {
        router.back();
      }
    }
  }, [journeyId]);

  const initializePlayback = async (tracks: typeof queue) => {
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(tracks.map(t => ({
        id: t.id,
        url: `file://${t.path}`,
        title: t.title,
        artist: t.artist,
        album: t.album || '',
        artwork: t.artwork || undefined,
        duration: t.duration,
      })));
      await TrackPlayer.skip(0);
      await TrackPlayer.play();
      setIsPlayingState(true);
    } catch (error) {
      console.error('Failed to initialize playback:', error);
    }
  };

  // Sync with audio store currentTrack
  useEffect(() => {
    if (currentTrack && journey) {
      const index = journey.tracks.findIndex(jt => jt.track.id === currentTrack.id);
      if (index !== -1 && index !== localTrackIndex) {
        setLocalTrackIndex(index);
      }
    }
  }, [currentTrack]);

  const handleTrackSelect = async (index: number) => {
    try {
      await TrackPlayer.skip(index);
      setLocalTrackIndex(index);
      setIsPlayingState(true);
      setCurrentTrack(journey!.tracks[index].track);
    } catch (error) {
      console.error('Failed to skip to track:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Handle hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  // Listen for track changes from TrackPlayer
  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackTrackChanged, (event) => {
      const nextTrackId = event.nextTrack;
      if (nextTrackId !== null && journey) {
        const index = journey.tracks.findIndex(jt => jt.track.id === String(nextTrackId));
        if (index !== -1) {
          setLocalTrackIndex(index);
          setCurrentTrack(journey.tracks[index].track);
        }
      }
    });

    const playbackStateSubscription = TrackPlayer.addEventListener(Event.PlaybackState, (state) => {
      setIsPlayingState(state.state === 'playing');
    });

    return () => {
      subscription.remove();
      playbackStateSubscription.remove();
    };
  }, [journey]);

  if (!journey) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading journey...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <JourneyPlayer
        journey={journey}
        currentTrackIndex={localTrackIndex}
        onTrackSelect={handleTrackSelect}
        onBack={handleBack}
        isPlaying={isPlaying}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});