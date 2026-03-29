import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '../../hooks/useLibrary';
import { useScan } from '../../hooks/useScan';
import { useAI } from '../../hooks/useAI';
import { useAudio } from '../../hooks/useAudio';
import { useTheme, Button, TrackRow, EmptyState, StatsSkeleton } from '../../components';
import { formatTotalDuration, getMoodColor } from '../../utils/helpers';
import { MOODS, MOOD_COLORS, GENRES, GENRE_COLORS } from '../../types';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();
  const {
    tracks,
    filteredTracks,
    stats,
    playlists,
    getRecentTracks,
    getTopPlayedTracks,
    getFavoriteTracks,
  } = useLibrary();
  const { startScan, isScanning, progress, percentage, tracksFound } = useScan();
  const { runAnalysis, isAnalyzing } = useAI();
  const { play, playQueue, togglePlayPause, isPlaying, currentTrack } = useAudio();

  const [refreshing, setRefreshing] = useState(false);
  const [showMoodBreakdown, setShowMoodBreakdown] = useState(true);

  const recentTracks = getRecentTracks(5);
  const topTracks = getTopPlayedTracks(5);
  const favoriteTracks = getFavoriteTracks();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startScan();
  };

  const handleRunAnalysis = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await runAnalysis();
  };

  const handleShuffleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  const handlePlayFavorites = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (favoriteTracks.length > 0) {
      playQueue(favoriteTracks, 0);
    }
  };

  const moodCounts = MOODS.map(mood => ({
    mood,
    count: tracks.filter(t => t.mood === mood).length,
    color: MOOD_COLORS[mood],
    percentage: tracks.length > 0 
      ? Math.round((tracks.filter(t => t.mood === mood).length / tracks.length) * 100)
      : 0,
  })).filter(m => m.count > 0).sort((a, b) => b.count - a.count);

  if (tracks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="🎵"
          title="Welcome to MusicScan AI"
          description="Scan your music library to get started with AI-powered insights and recommendations."
          actionLabel="Scan Library"
          onAction={handleScan}
        />
        {isScanning && (
          <View style={styles.scanProgress}>
            <Text style={styles.scanText}>Scanning... {progress.currentFile}</Text>
            <Text style={styles.scanPercentage}>{percentage}%</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={accentColor}
        />
      }
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.title}>MusicScan AI</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{stats.trackCount}</Text>
            <Text style={styles.statLabel}>Tracks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{stats.totalHours}h</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{stats.genreCount}</Text>
            <Text style={styles.statLabel}>Genres</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{playlists.length}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
        </View>

        {isScanning && (
          <View style={styles.scanProgressContainer}>
            <View style={styles.scanProgressBar}>
              <View
                style={[
                  styles.scanProgressFill,
                  { width: `${percentage}%`, backgroundColor: accentColor },
                ]}
              />
            </View>
            <Text style={styles.scanProgressText}>
              Scanning {progress.currentIndex} of {progress.totalFiles}
            </Text>
            <Text style={styles.scanProgressFile} numberOfLines={1}>
              {progress.currentFile}
            </Text>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.actions}>
        <Button
          title={isScanning ? `Scanning... ${percentage}%` : 'Scan Library'}
          onPress={handleScan}
          variant="primary"
          size="large"
          fullWidth
          disabled={isScanning}
          icon="🔍"
        />
        
        <Button
          title={isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          onPress={handleRunAnalysis}
          variant="secondary"
          size="large"
          fullWidth
          disabled={isAnalyzing || tracks.length === 0}
          icon="🤖"
        />
      </Animated.View>

      {moodCounts.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(400).delay(300)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mood Breakdown</Text>
            <Pressable onPress={() => setShowMoodBreakdown(!showMoodBreakdown)}>
              <Text style={styles.sectionAction}>
                {showMoodBreakdown ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>
          
          {showMoodBreakdown && (
            <View style={styles.moodBreakdown}>
              {moodCounts.map((item, index) => (
                <Animated.View
                  key={item.mood}
                  entering={FadeInRight.duration(300).delay(index * 50)}
                  style={styles.moodRow}
                >
                  <View style={styles.moodInfo}>
                    <View style={[styles.moodDot, { backgroundColor: item.color }]} />
                    <Text style={styles.moodLabel}>{item.mood}</Text>
                    <Text style={styles.moodCount}>{item.count}</Text>
                  </View>
                  <View style={styles.moodBarContainer}>
                    <View
                      style={[
                        styles.moodBar,
                        { width: `${item.percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable style={styles.quickAction} onPress={handleShuffleAll}>
            <Text style={styles.quickActionIcon}>🔀</Text>
            <Text style={styles.quickActionLabel}>Shuffle All</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={handlePlayFavorites}>
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionLabel}>Favorites</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionLabel}>Settings</Text>
          </Pressable>
        </View>
      </Animated.View>

      {recentTracks.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          {recentTracks.map((track, index) => (
            <Animated.View
              key={track.id}
              entering={FadeInUp.duration(300).delay(index * 50)}
              layout={Layout.springify()}
            >
              <TrackRow
                track={track}
                onPress={() => playQueue(recentTracks, index)}
                onLongPress={() => router.push(`/track-detail?id=${track.id}`)}
                isPlaying={currentTrack?.id === track.id && isPlaying}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {topTracks.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Most Played</Text>
          {topTracks.map((track, index) => (
            <Animated.View
              key={track.id}
              entering={FadeInUp.duration(300).delay(index * 50)}
              layout={Layout.springify()}
            >
              <TrackRow
                track={track}
                onPress={() => playQueue(topTracks, index)}
                onLongPress={() => router.push(`/track-detail?id=${track.id}`)}
                isPlaying={currentTrack?.id === track.id && isPlaying}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanProgressContainer: {
    marginTop: 16,
  },
  scanProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scanProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scanProgressText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  scanProgressFile: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 14,
    color: '#6366F1',
  },
  moodBreakdown: {
    gap: 12,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'capitalize',
    flex: 1,
  },
  moodCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  moodBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  moodBar: {
    height: '100%',
    borderRadius: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bottomPadding: {
    height: TAB_BAR_HEIGHT + 80,
  },
  scanProgress: {
    padding: 16,
    alignItems: 'center',
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  scanPercentage: {
    color: '#6366F1',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
});
