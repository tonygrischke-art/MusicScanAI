import React, { memo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAudio } from '../hooks/useAudio';
import { useLibrary } from '../stores/useLibraryStore';
import { Track } from '../types';
import { formatDuration, getGenreColor, getMoodColor } from '../utils/helpers';
import { useTheme } from './ThemeProvider';

interface TrackRowProps {
  track: Track;
  onPress: () => void;
  onLongPress: () => void;
  isPlaying?: boolean;
  isSelected?: boolean;
  showArtwork?: boolean;
  showBadges?: boolean;
  showMood?: boolean;
}

const TrackRow = memo(({
  track,
  onPress,
  onLongPress,
  isPlaying = false,
  isSelected = false,
  showArtwork = true,
  showBadges = true,
  showMood = true,
}: TrackRowProps) => {
  const { accentColor } = useTheme();
  const { currentTrack } = useAudio();

  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(100)}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          isSelected && styles.selected,
        ]}
      >
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: accentColor }]} />
        )}
        
        {showArtwork && (
          <View style={styles.artworkContainer}>
            {track.blurhash ? (
              <View style={styles.artworkPlaceholder}>
                <Text style={styles.artworkText}>
                  {track.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={[styles.artworkPlaceholder, { backgroundColor: track.colors[0] || '#151520' }]}>
                <Text style={styles.artworkText}>
                  {track.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isCurrentTrack && isPlaying && (
              <View style={styles.playingIndicator}>
                <Text style={styles.playingText}>▶</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.info}>
          <Text
            style={[
              styles.title,
              isCurrentTrack && { color: accentColor },
            ]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
          
          {showBadges && (
            <View style={styles.badges}>
              {track.genre && (
                <View style={[styles.badge, { backgroundColor: getGenreColor(track.genre) + '30' }]}>
                  <Text style={[styles.badgeText, { color: getGenreColor(track.genre) }]}>
                    {track.genre}
                  </Text>
                </View>
              )}
              {showMood && track.mood && (
                <View style={[styles.badge, { backgroundColor: getMoodColor(track.mood) + '30' }]}>
                  <Text style={[styles.badgeText, { color: getMoodColor(track.mood) }]}>
                    {track.mood}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.right}>
          {track.isFavorite && (
            <Text style={styles.favoriteIcon}>♥</Text>
          )}
          <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  selected: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  selectedIndicator: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    borderRadius: 2,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#151520',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingText: {
    fontSize: 10,
    color: '#fff',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  favoriteIcon: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default TrackRow;
