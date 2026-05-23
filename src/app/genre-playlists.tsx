import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GenreService } from '../services/genreService';
import { useLibrary } from '../stores/useLibraryStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useTheme } from '../components/ThemeProvider';
import { Track } from '../types';
import { TAB_BAR_HEIGHT } from '../utils/constants';

const PIE_COLORS = ['#FF6B9D', '#C92A2A', '#9B59B6', '#00D9FF', '#F4D03F', '#E67E22', '#8E44AD', '#D35400', '#2C3E50', '#1ABC9C', '#27AE60', '#3498DB', '#2ECC71', '#E74C3C', '#95A5A6', '#666'];

export default function GenrePlaylistsScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks } = useLibrary();
  const { setQueue } = useAudioStore();

  const [stats, setStats] = useState<{ genre: string; count: number; percentage: number }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    const genreStats = GenreService.getGenreStats(tracks);
    setStats(genreStats);
  }, [tracks]);

  const handleCreatePlaylist = useCallback((genre: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const playlist = GenreService.createGenrePlaylist(genre, tracks);
    const genreTracks = tracks.filter(t =>
      (GenreService.detectGenre(t) || 'unknown') === genre
    );
    if (genreTracks.length > 0) {
      setQueue(genreTracks);
      router.back();
    }
  }, [tracks, setQueue, router]);

  // Simple pie chart rendering
  const renderPieChart = () => {
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return null;

    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieChart}>
          {stats.slice(0, 8).map((stat, i) => {
            const size = Math.max(20, (stat.count / total) * 120);
            return (
              <Pressable
                key={stat.genre}
                onPress={() => setSelectedGenre(stat.genre)}
                style={[
                  styles.pieSlice,
                  {
                    width: size,
                    height: size,
                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    borderRadius: size / 2,
                    opacity: selectedGenre === stat.genre ? 1 : 0.7,
                    borderWidth: selectedGenre === stat.genre ? 2 : 0,
                    borderColor: '#fff',
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.legend}>
          {stats.slice(0, 8).map((stat, i) => (
            <Pressable
              key={stat.genre}
              onPress={() => setSelectedGenre(stat.genre)}
              style={styles.legendItem}
            >
              <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {stat.genre} ({stat.count})
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Genre Playlists</Text>
      </View>

      {stats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>No genre data available</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
          {renderPieChart()}

          <View style={styles.genreList}>
            {stats.map((stat) => (
              <Pressable
                key={stat.genre}
                onPress={() => setSelectedGenre(stat.genre)}
                style={[
                  styles.genreCard,
                  { backgroundColor: theme.surface },
                  selectedGenre === stat.genre && { borderColor: accentColor, borderWidth: 1 },
                ]}
              >
                <View style={styles.genreInfo}>
                  <View
                    style={[styles.genreDot, { backgroundColor: GenreService.getGenreColor(stat.genre) }]}
                  />
                  <View>
                    <Text style={[styles.genreName, { color: theme.text }]}>
                      {stat.genre === 'unknown' ? 'Unknown' : stat.genre.charAt(0).toUpperCase() + stat.genre.slice(1)}
                    </Text>
                    <Text style={[styles.genreCount, { color: theme.textSecondary }]}>
                      {stat.count} tracks • {stat.percentage}%
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleCreatePlaylist(stat.genre)}
                  style={[styles.playBtn, { backgroundColor: accentColor + '20' }]}
                >
                  <Text style={{ color: accentColor, fontWeight: '700' }}>▶</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pieContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pieChart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  pieSlice: {
    margin: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: { fontSize: 12 },
  genreList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  genreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  genreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  genreName: { fontSize: 16, fontWeight: '700' },
  genreCount: { fontSize: 12, marginTop: 2 },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
