import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DuplicateService, DuplicateGroup } from '../services/duplicateService';
import { useLibrary } from '../stores/useLibraryStore';
import { useTheme } from '../components/ThemeProvider';
import TrackRow from '../components/TrackRow';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function DuplicatesScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks, removeTrack } = useLibrary();
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const found = DuplicateService.findDuplicates(tracks);
    setGroups(found);
    setIsScanning(false);
  }, [tracks]);

  const handleRemove = useCallback((trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeTrack(trackId);
  }, [removeTrack]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Duplicate Finder</Text>
      </View>

      {isScanning ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>Scanning for duplicates...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>✓ No duplicates found</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Your library is clean</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
          <View style={styles.summary}>
            <Text style={[styles.summaryText, { color: accentColor }]}>
              {groups.length} duplicate group{groups.length !== 1 ? 's' : ''} found
            </Text>
          </View>

          {groups.map((group, i) => (
            <View key={i} style={[styles.group, { backgroundColor: theme.surface }]}>
              <View style={styles.groupHeader}>
                <Text style={[styles.groupTitle, { color: theme.text }]}>
                  {group.tracks[0].title}
                </Text>
                <Text style={[styles.groupReason, { color: accentColor }]}>
                  {group.reason}
                </Text>
              </View>
              {group.tracks.map((track, j) => (
                <View key={track.id} style={styles.trackRow}>
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: theme.text }]}>{track.artist}</Text>
                    <Text style={[styles.trackPath, { color: theme.textSecondary }]} numberOfLines={1}>
                      {track.path}
                    </Text>
                  </View>
                  <Text style={[styles.duration, { color: theme.textSecondary }]}>
                    {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
                  </Text>
                  {j > 0 && (
                    <Pressable
                      onPress={() => handleRemove(track.id)}
                      style={[styles.removeBtn, { backgroundColor: '#FF444430' }]}
                    >
                      <Text style={{ color: '#FF4444', fontSize: 12, fontWeight: '700' }}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ))}
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
  summary: { paddingHorizontal: 20, marginBottom: 16 },
  summaryText: { fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  group: { marginHorizontal: 20, marginBottom: 12, borderRadius: 14, padding: 16 },
  groupHeader: { marginBottom: 12 },
  groupTitle: { fontSize: 16, fontWeight: '700' },
  groupReason: { fontSize: 12, marginTop: 2 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: '500' },
  trackPath: { fontSize: 11, marginTop: 2 },
  duration: { fontSize: 12, fontWeight: '500' },
  removeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
