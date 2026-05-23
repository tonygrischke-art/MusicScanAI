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
import { DeadFileService, DeadFile } from '../services/deadFileService';
import { useLibrary } from '../stores/useLibraryStore';
import { useTheme } from '../components/ThemeProvider';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function DeadFilesScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks, removeTrack } = useLibrary();
  const [deadFiles, setDeadFiles] = useState<DeadFile[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    DeadFileService.findDeadFiles(tracks).then((found) => {
      setDeadFiles(found);
      setIsScanning(false);
    });
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
        <Text style={[styles.title, { color: theme.text }]}>Dead File Detector</Text>
      </View>

      {isScanning ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>Scanning library...</Text>
        </View>
      ) : deadFiles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>✓ All files healthy</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>No dead or missing files found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
          <View style={styles.summary}>
            <Text style={[styles.summaryText, { color: accentColor }]}>
              {deadFiles.length} dead file{deadFiles.length !== 1 ? 's' : ''} found
            </Text>
          </View>

          {deadFiles.map((item, i) => (
            <View key={i} style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: theme.text }]}>{item.track.title}</Text>
                <Text style={[styles.trackArtist, { color: theme.textSecondary }]}>{item.track.artist}</Text>
                <Text style={[styles.trackPath, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.track.path}
                </Text>
                <Text style={[styles.reason, { color: accentColor }]}>{item.reason}</Text>
              </View>
              <Pressable
                onPress={() => handleRemove(item.track.id)}
                style={[styles.removeBtn, { backgroundColor: '#FF444430' }]}
              >
                <Text style={{ color: '#FF4444', fontWeight: '700' }}>Remove</Text>
              </Pressable>
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
  card: { marginHorizontal: 20, marginBottom: 12, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 16, fontWeight: '700' },
  trackArtist: { fontSize: 14, marginTop: 2 },
  trackPath: { fontSize: 11, marginTop: 4 },
  reason: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  removeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
