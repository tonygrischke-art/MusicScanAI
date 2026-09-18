import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLibrary } from '../stores/useLibraryStore';
import { useRouter } from 'expo-router';
import { JourneyBuilder } from '../components/JourneyBuilder';
import { useUIStore } from '../stores/useUIStore';
import { DreamJourney } from '../types/journey';

export default function JourneyBuilderScreen() {
  const { tracks } = useLibrary();
  const router = useRouter();
  const { showNotification } = useUIStore();

  const handleJourneyCreated = (journey: DreamJourney) => {
    showNotification(`Journey "${journey.name}" created with ${journey.tracks.length} tracks!`, 'success');
    router.push(`/journey-player?journeyId=${journey.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <JourneyBuilder
        library={tracks}
        onJourneyCreated={handleJourneyCreated}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});