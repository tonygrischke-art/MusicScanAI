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
import * as Haptics from 'expo-haptics';
import { SmartPlaylistService } from '../services/smartPlaylistService';
import { useLibrary } from '../stores/useLibraryStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useTheme } from '../components/ThemeProvider';
import { TAB_BAR_HEIGHT } from '../utils/constants';

const EXAMPLE_PROMPTS = [
  'Chill Hip Hop from the 90s under 90 BPM',
  'High energy rock from the 2000s',
  'Romantic jazz for a dinner date',
  '90s pop bangers with high energy',
  'Ambient focus music for studying',
  'Aggressive metal for working out',
];

export default function SmartPlaylistScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks } = useLibrary();
  const { setQueue } = useAudioStore();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    matchCount: number;
    explanation: string;
    trackIds: string[];
  } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { playlist, matchCount, explanation } =
        await SmartPlaylistService.generateFromNaturalLanguage(prompt, tracks);

      if (playlist) {
        setResult({
          name: playlist.name,
          matchCount,
          explanation,
          trackIds: playlist.trackIds,
        });
      } else {
        setResult({
          name: prompt,
          matchCount: 0,
          explanation: 'No tracks match your request',
          trackIds: [],
        });
      }
    } catch {
      setResult({
        name: prompt,
        matchCount: 0,
        explanation: 'Error generating playlist',
        trackIds: [],
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, tracks]);

  const handlePlay = useCallback(() => {
    if (!result || result.trackIds.length === 0) return;
    const matchingTracks = tracks.filter(t => result.trackIds.includes(t.id));
    if (matchingTracks.length > 0) {
      setQueue(matchingTracks);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  }, [result, tracks, setQueue, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Smart Playlist</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: accentColor + '40' }]}
          placeholder="Describe your playlist... e.g. Chill Hip Hop from the 90s"
          placeholderTextColor={theme.textSecondary}
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={handleGenerate}
          returnKeyType="search"
          multiline
        />
        <Pressable
          onPress={handleGenerate}
          style={[styles.generateBtn, { backgroundColor: accentColor }]}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={{ color: '#000', fontWeight: '700' }}>✨</Text>
          )}
        </Pressable>
      </View>

      {/* Example prompts */}
      {!result && !isGenerating && (
        <View style={styles.examplesSection}>
          <Text style={[styles.examplesTitle, { color: theme.textSecondary }]}>Try:</Text>
          <View style={styles.examples}>
            {EXAMPLE_PROMPTS.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => {
                  setPrompt(ex);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.exampleChip, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.exampleText, { color: theme.text }]}>{ex}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Result */}
      {result && !isGenerating && (
        <View style={styles.resultSection}>
          <View style={[styles.resultCard, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.resultName, { color: theme.text }]}>{result.name}</Text>
            <Text style={[styles.resultCount, { color: accentColor }]}>
              {result.matchCount} tracks match
            </Text>
            <Text style={[styles.resultExplanation, { color: theme.textSecondary }]}>
              {result.explanation}
            </Text>
          </View>

          <View style={styles.resultActions}>
            {result.trackIds.length > 0 && (
              <Pressable onPress={handlePlay} style={[styles.playBtn, { backgroundColor: accentColor }]}>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>
                  ▶ Play ({result.matchCount})
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { setResult(null); setPrompt(''); }}
              style={[styles.newBtn, { backgroundColor: theme.surface }]}
            >
              <Text style={{ color: theme.text }}>New Search</Text>
            </Pressable>
          </View>
        </View>
      )}

      {isGenerating && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Generating smart playlist...
          </Text>
        </View>
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
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  generateBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examplesSection: {
    paddingHorizontal: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  examples: {
    gap: 8,
  },
  exampleChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  resultName: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultCount: {
    fontSize: 28,
    fontWeight: '800',
  },
  resultExplanation: {
    fontSize: 14,
    marginTop: 4,
  },
  resultActions: {
    gap: 8,
  },
  playBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  newBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
});
