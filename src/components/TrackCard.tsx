import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Track } from '../types';

interface TrackCardProps {
  track: Track;
  onPress?: () => void;
}

export default function TrackCard({ track, onPress }: TrackCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.artworkContainer}>
        <Image 
          source={{ uri: track.artwork || 'https://via.placeholder.com/60x60/151520/6366F1?text=No+Art' }} 
          style={styles.artwork}
          resizeMode="cover"
        />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151520',
    padding: 12,
    marginVertical: 4,
    borderRadius: 10,
  },
  artworkContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});