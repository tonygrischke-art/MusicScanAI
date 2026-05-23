import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../components/ThemeProvider';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

const MENU_ITEMS = [
  { label: '🎵 Mood Search', route: '/mood-search', description: 'Find tracks by mood or feeling' },
  { label: '🎛️ Equalizer', route: '/equalizer', description: '10-band EQ with presets' },
  { label: '⏱️ Sleep Timer', route: '/sleep-timer', description: 'Auto-stop playback' },
  { label: '🔍 Find Duplicates', route: '/duplicates', description: 'Find duplicate tracks' },
  { label: '💀 Dead Files', route: '/dead-files', description: 'Find missing files' },
  { label: '🎶 Genre Playlists', route: '/genre-playlists', description: 'Auto-group by genre + pie chart' },
  { label: '✨ Smart Playlist', route: '/smart-playlist', description: 'Natural language playlist builder' },
  { label: '🔧 Metadata Fixer', route: '/metadata-fixer', description: 'Fix missing/bad metadata with AI' },
  { label: '🖼️ Album Art Fetcher', route: '/album-art', description: 'Fetch missing album art' },
];

export default function MoreScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>More</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => handlePress(item.route)}
            style={[styles.card, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.cardLabel, { color: theme.text }]}>{item.label}</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{item.description}</Text>
            <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
    position: 'absolute',
    bottom: 8,
    left: 18,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
});
