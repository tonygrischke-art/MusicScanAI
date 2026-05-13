import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useStore } from '../../src/stores/musicStore';
import TrackCard from '../../src/components/TrackCard';

export default function LibraryScreen() {
  const tracks = useStore(state => state.tracks);
  const isScanning = useStore(state => state.isScanning);
  
  if (tracks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Scan your first album</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={tracks}
      renderItem={({ item }) => <TrackCard track={item} />}
      keyExtractor={(item) => item.id}
      estimatedItemSize={100}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});