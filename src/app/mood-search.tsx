import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MoodService } from '../services/moodService';
import { useLibrary } from '../stores/useLibraryStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useTheme } from '../components/ThemeProvider';
import { TrackRow } from '../components/TrackRow';
import { Track } from '../types';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function MoodSearchScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks } = useLibrary();
  const { setQueue } = useAudioStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [analysis, setAnalysis] = useState<{ mood: string; confidence: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { tracks: matchedTracks, analysis: moodAnalysis } =
        await MoodService.generateMoodPlaylist(query, tracks, 50);
      setResults(matchedTracks);
      setAnalysis({ mood: moodAnalysis.mood, confidence: moodAnalysis.confidence });
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, tracks]);

  const handlePlayAll = useCallback(() => {
    if (results.length > 0) {
      setQueue(results);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [results, setQueue]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Mood Search</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { color: theme.text, borderColor: accentColor + '40' }]}
          placeholder="How are you feeling? e.g. driving at night..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable
          onPress={handleSearch}
          style={[styles.searchBtn, { backgroundColor: accentColor }]}
        >
          <Text style={{ color: '#000', fontWeight: '700' }}>🔍</Text>
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing mood...</Text>
        </View>
      )}

      {analysis && !isLoading && (
        <View style={[styles.analysisCard, { backgroundColor: accentColor + '15' }]}>
          <Text style={[styles.analysisText, { color: accentColor }]}>
            Mood: {analysis.mood} • {Math.round(analysis.confidence * 100)}% confidence
          </Text>
          <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
            {results.length} tracks found
          </Text>
        </View>
      )}

      {results.length > 0 && !isLoading && (
        <Pressable onPress={handlePlayAll} style={[styles.playAllBtn, { backgroundColor: accentColor }]}>
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>
            ▶ Play All ({results.length})
          </Text>
        </Pressable>
      )}

      <ScrollView style={styles.results} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
        {results.map((track) => (
          <TrackRow key={track.id} track={track} />
        ))}
        {hasSearched && !isLoading && results.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary }}>No tracks match this mood</Text>
          </View>
        )}
      </ScrollView>
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
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  analysisCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCount: {
    fontSize: 13,
    marginTop: 4,
  },
  playAllBtn: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  results: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
