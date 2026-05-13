import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../../src/stores/musicStore';
import { playTrack, pauseTrack, skipNext, skipPrev } from '../../src/services/playerService';

export default function PlayerScreen() {
  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player</Text>
      
      {currentTrack ? (
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{currentTrack.title}</Text>
          <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
        </View>
      ) : (
        <Text style={styles.noTrack}>No track selected</Text>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={skipPrev}>
          <Text style={styles.controlText}>⏮</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={isPlaying ? pauseTrack : playTrack}>
          <Text style={styles.controlText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={skipNext}>
          <Text style={styles.controlText}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  trackInfo: {
    marginBottom: 40,
    alignItems: 'center',
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  trackArtist: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  noTrack: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  controlButton: {
    padding: 15,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 30,
  },
});