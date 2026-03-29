import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../hooks/useAudio';
import { useAI } from '../hooks/useAI';
import { useLibrary } from '../hooks/useLibrary';
import { useUIStore } from '../stores/useUIStore';
import { useTheme, Button } from '../components';
import { formatDuration, formatTotalDuration, getGenreColor, getMoodColor } from '../utils/helpers';

export default function TrackDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, accentColor } = useTheme();
  const { play, addToQueue } = useAudio();
  const { getInsight, isAnalyzing } = useAI();
  const { getTrackById, toggleFavorite, updateRating, incrementPlayCount, tracks } = useLibrary();
  const { showNotification } = useUIStore();

  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const track = getTrackById(id || '');

  useEffect(() => {
    if (track) {
      loadInsight();
    }
  }, [track?.id]);

  const loadInsight = async () => {
    if (!track) return;
    setLoadingInsight(true);
    const result = await getInsight(track);
    setInsight(result);
    setLoadingInsight(false);
  };

  if (!track) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.errorText}>Track not found</Text>
      </View>
    );
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    play(track);
    router.back();
  };

  const handleAddToQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToQueue(track);
    showNotification('Added to queue', 'success');
  };

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(track.id);
    showNotification(
      track.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      'success'
    );
  };

  const handleRating = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateRating(track.id, rating);
  };

  const similarTracks = tracks
    .filter(t => t.id !== track.id && (t.genre === track.genre || t.mood === track.mood))
    .slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={[styles.backgroundGradient, { backgroundColor: track.colors[0] || '#151520' }]} />

      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Track Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={ZoomIn.duration(300)} style={styles.artworkContainer}>
          <View style={[styles.artwork, { backgroundColor: track.colors[1] || track.colors[0] }]}>
            <Text style={styles.artworkText}>{track.title.charAt(0).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(100)} style={styles.trackInfo}>
          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.artist}>{track.artist}</Text>
          {track.album && <Text style={styles.album}>{track.album}</Text>}

          <View style={styles.badges}>
            {track.mood && (
              <View style={[styles.badge, { backgroundColor: getMoodColor(track.mood) + '30' }]}>
                <Text style={[styles.badgeText, { color: getMoodColor(track.mood) }]}>
                  {track.mood}
                </Text>
              </View>
            )}
            {track.genre && (
              <View style={[styles.badge, { backgroundColor: getGenreColor(track.genre) + '30' }]}>
                <Text style={[styles.badgeText, { color: getGenreColor(track.genre) }]}>
                  {track.genre}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(200)} style={styles.actions}>
          <Button
            title="Play"
            onPress={handlePlay}
            variant="primary"
            size="large"
            icon="▶"
            fullWidth
          />
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton} onPress={handleToggleFavorite}>
              <Text style={styles.actionIcon}>{track.isFavorite ? '❤️' : '🤍'}</Text>
              <Text style={styles.actionLabel}>Favorite</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleAddToQueue}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Queue</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => router.push('/playlists')}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionLabel}>Playlist</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(300)} style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => handleRating(star)}>
                <Text style={[
                  styles.star,
                  star <= track.rating && { color: '#F59E0B' }
                ]}>
                  {star <= track.rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(400)} style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Track Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{track.bpm}</Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{track.key || 'N/A'}</Text>
              <Text style={styles.statLabel}>Key</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(track.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{track.bitrate || 'N/A'}</Text>
              <Text style={styles.statLabel}>Bitrate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{track.playCount}</Text>
              <Text style={styles.statLabel}>Plays</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{track.sampleRate ? `${track.sampleRate / 1000}kHz` : 'N/A'}</Text>
              <Text style={styles.statLabel}>Sample Rate</Text>
            </View>
          </View>

          <View style={styles.energySection}>
            <Text style={styles.energyLabel}>Energy</Text>
            <View style={styles.energyBar}>
              <View style={[styles.energyFill, { width: `${track.energy * 100}%` }]} />
            </View>
            <Text style={styles.energyValue}>{Math.round(track.energy * 100)}%</Text>
          </View>

          <View style={styles.energySection}>
            <Text style={styles.energyLabel}>Valence</Text>
            <View style={styles.energyBar}>
              <View style={[styles.energyFill, { width: `${track.valence * 100}%` }]} />
            </View>
            <Text style={styles.energyValue}>{Math.round(track.valence * 100)}%</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(500)} style={styles.insightSection}>
          <Text style={styles.sectionTitle}>AI Insight</Text>
          {loadingInsight ? (
            <Text style={styles.insightLoading}>Analyzing...</Text>
          ) : insight ? (
            <Text style={styles.insightText}>{insight}</Text>
          ) : (
            <Text style={styles.insightText}>No insight available.</Text>
          )}
        </Animated.View>

        {similarTracks.length > 0 && (
          <Animated.View entering={FadeInUp.duration(300).delay(600)} style={styles.similarSection}>
            <Text style={styles.sectionTitle}>Similar Tracks</Text>
            {similarTracks.map((t) => (
              <Pressable
                key={t.id}
                style={styles.similarTrack}
                onPress={() => router.replace(`/track-detail?id=${t.id}`)}
              >
                <View style={[styles.similarArtwork, { backgroundColor: t.colors[0] }]}>
                  <Text style={styles.similarArtworkText}>{t.title.charAt(0)}</Text>
                </View>
                <View style={styles.similarInfo}>
                  <Text style={styles.similarTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.similarArtist} numberOfLines={1}>{t.artist}</Text>
                </View>
                <Text style={styles.similarDuration}>{formatDuration(t.duration)}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  artworkText: {
    fontSize: 80,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  album: {
    fontSize: 14,
    color: '#6B7280',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actions: {
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ratingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 36,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  energySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  energyLabel: {
    width: 80,
    fontSize: 14,
    color: '#9CA3AF',
  },
  energyBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  energyValue: {
    width: 50,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  insightSection: {
    marginBottom: 32,
  },
  insightLoading: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  insightText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  similarSection: {
    marginBottom: 32,
  },
  similarTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  similarArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarArtworkText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  similarInfo: {
    flex: 1,
  },
  similarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  similarArtist: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  similarDuration: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
