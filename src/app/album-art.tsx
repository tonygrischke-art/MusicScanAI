import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlbumArtService } from '../services/albumArtService';
import { useLibrary } from '../stores/useLibraryStore';
import { useTheme } from '../components/ThemeProvider';
import {Track } from '../types';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function AlbumArtScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks, updateTrack } = useLibrary();

  const [missingArt, setMissingArt] = useState<Track[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<Map<string, { url: string; source: string }>>(new Map());

  const handleFetch = useCallback(async () => {
    setIsFetching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const withoutArt = AlbumArtService.getTracksWithoutArt(tracks);
    setMissingArt(withoutArt);

    const fetchResults = await AlbumArtService.batchFetch(
      withoutArt.slice(0, 50), // Limit to 50 to avoid rate limiting
      (current, total) => {
        setProgress({ current, total });
      }
    );

    setResults(fetchResults);
    setIsFetching(false);
  }, [tracks]);

  const handleApply = useCallback((trackId: string) => {
    const result = results.get(trackId);
    if (result) {
      updateTrack(trackId, { artwork: result.url });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [results, updateTrack]);

  const handleApplyAll = useCallback(() => {
    for (const [trackId, result] of results) {
      updateTrack(trackId, { artwork: result.url });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [results, updateTrack]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Album Art Fetcher</Text>
      </View>

      {missingArt.length === 0 && !isFetching && results.size === 0 && (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>
            All tracks already have album art
          </Text>
          <Pressable onPress={handleFetch} style={[styles.fetchBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>🔍 Re-scan</Text>
          </Pressable>
        </View>
      )}

      {!isFetching && results.size === 0 && missingArt.length === 0 && (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>Scan for tracks missing album art</Text>
          <Pressable onPress={handleFetch} style={[styles.fetchBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>🔍 Scan & Fetch</Text>
          </Pressable>
        </View>
      )}

      {isFetching && (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>
            Fetching art {progress.current} of {progress.total}...
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accentColor, width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>
      )}

      {!isFetching && results.size > 0 && (
        <>
          <View style={styles.summary}>
            <Text style={[styles.summaryText, { color: accentColor }]}>
              Found art for {results.size} tracks
            </Text>
            <Pressable onPress={handleApplyAll} style={[styles.applyAllBtn, { backgroundColor: accentColor }]}>
              <Text style={{ color: '#000', fontWeight: '700' }}>Apply All</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
            {Array.from(results.entries()).map(([trackId, result]) => {
              const track = tracks.find(t => t.id === trackId);
              if (!track) return null;
              return (
                <View key={trackId} style={[styles.card, { backgroundColor: theme.surface }]}>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: theme.text }]}>{track.title}</Text>
                    <Text style={[styles.trackArtist, { color: theme.textSecondary }]}>{track.artist}</Text>
                    <Text style={[styles.source, { color: accentColor }]}>via {result.source}</Text>
                  </View>
                  <Pressable onPress={() => handleApply(trackId)} style={[styles.applyBtn, { backgroundColor: accentColor + '20' }]}>
                    <Text style={{ color: accentColor, fontWeight: '700' }}>Apply</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12 },
  fetchBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  progressBar: { width: 200, height: 6, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  summaryText: { fontSize: 14, fontWeight: '600' },
  applyAllBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  card: { marginHorizontal: 20, marginBottom: 8, padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: '600' },
  trackArtist: { fontSize: 13, marginTop: 2, opacity: 0.7 },
  source: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  applyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
});
