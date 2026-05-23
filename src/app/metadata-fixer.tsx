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
import { MetadataFixerService, MetadataFixResult } from '../services/metadataFixerService';
import { useLibrary } from '../stores/useLibraryStore';
import { useTheme } from '../components/ThemeProvider';
import { Track } from '../types';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function MetadataFixerScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { tracks, updateTrack } = useLibrary();

  const [brokenTracks, setBrokenTracks] = useState<Track[]>([]);
  const [results, setResults] = useState<MetadataFixResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [acceptedFixes, setAcceptedFixes] = useState<Set<string>>(new Set());

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const broken = MetadataFixerService.findBrokenTracks(tracks);
    setBrokenTracks(broken);

    setIsScanning(false);

    if (broken.length === 0) return;

    // Auto-analyze broken tracks
    setIsFixing(true);
    const fixResults = await MetadataFixerService.batchAnalyze(
      broken,
      (current, total, track) => {
        setProgress({ current, total });
      }
    );
    setResults(fixResults);
    setIsFixing(false);
  }, [tracks]);

  const handleToggleFix = useCallback((trackId: string, field: string) => {
    const key = `${trackId}:${field}`;
    setAcceptedFixes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleApplyAll = useCallback(() => {
    for (const result of results) {
      const acceptedFixesForTrack = result.fixes.filter(f =>
        acceptedFixes.has(`${f.trackId}:${f.field}`)
      );
      if (acceptedFixesForTrack.length > 0) {
        const updated = MetadataFixerService.applyFixes(result.track, acceptedFixesForTrack);
        updateTrack(updated.id, updated);
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [results, acceptedFixes, updateTrack, router]);

  const totalFixes = results.reduce((sum, r) => sum + r.fixes.length, 0);
  const acceptedCount = results.reduce((sum, r) =>
    sum + r.fixes.filter(f => acceptedFixes.has(`${f.trackId}:${f.field}`)).length, 0
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Metadata Fixer</Text>
      </View>

      {brokenTracks.length === 0 && !isScanning && !isFixing && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={{ color: theme.textSecondary }}>Scan your library to find tracks with missing metadata</Text>
          <Pressable onPress={handleScan} style={[styles.scanBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>🔍 Scan Library</Text>
          </Pressable>
        </View>
      )}

      {isScanning && (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Finding broken tracks...</Text>
        </View>
      )}

      {isFixing && (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={{ color: theme.textSecondary, marginTop: 12 }}>
            Analyzing {progress.current} of {progress.total}...
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: accentColor, width: `${(progress.current / progress.total) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {!isScanning && !isFixing && results.length > 0 && (
        <>
          <View style={styles.summary}>
            <Text style={[styles.summaryText, { color: accentColor }]}>
              {acceptedCount} of {totalFixes} fixes selected
            </Text>
            <Pressable onPress={handleApplyAll} style={[styles.applyBtn, { backgroundColor: accentColor }]}>
              <Text style={{ color: '#000', fontWeight: '700' }}>Apply Selected</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
            {results.map((result) => (
              <View key={result.track.id} style={[styles.resultCard, { backgroundColor: theme.surface }]}>
                <View style={styles.trackHeader}>
                  <Text style={[styles.trackTitle, { color: theme.text }]}>{result.track.title}</Text>
                  <Text style={[styles.trackArtist, { color: theme.textSecondary }]}>{result.track.artist}</Text>
                </View>

                {result.fixes.map((fix, i) => {
                  const key = `${fix.trackId}:${fix.field}`;
                  const isAccepted = acceptedFixes.has(key);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => handleToggleFix(fix.trackId, fix.field)}
                      style={[
                        styles.fixRow,
                        isAccepted && { backgroundColor: accentColor + '15' },
                      ]}
                    >
                      <View style={[styles.checkbox, isAccepted && { backgroundColor: accentColor }]}>
                        {isAccepted && <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                      </View>
                      <View style={styles.fixInfo}>
                        <Text style={[styles.fixField, { color: theme.text }]}>{fix.field}</Text>
                        <Text style={[styles.fixCurrent, { color: theme.textSecondary }]} numberOfLines={1}>
                          Current: {String(fix.currentValue) || '(empty)'}
                        </Text>
                        <Text style={[styles.fixProposed, { color: accentColor }]} numberOfLines={1}>
                          → {String(fix.proposedValue)}
                        </Text>
                      </View>
                      <View style={styles.confidenceContainer}>
                        <View
                          style={[
                            styles.confidenceBar,
                            { backgroundColor: accentColor + '30' },
                          ]}
                        >
                          <View
                            style={[
                              styles.confidenceFill,
                              {
                                backgroundColor: accentColor,
                                width: `${fix.confidence * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
                          {Math.round(fix.confidence * 100)}%
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {brokenTracks.length > 0 && results.length === 0 && !isScanning && !isFixing && (
        <View style={styles.empty}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600' }}>
            {brokenTracks.length} tracks need fixing
          </Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
            AI will analyze and suggest corrections
          </Text>
          <Pressable onPress={handleScan} style={[styles.scanBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>🔧 Start Fixing</Text>
          </Pressable>
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  scanBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  progressBar: {
    width: 200,
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryText: { fontSize: 14, fontWeight: '600' },
  applyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  resultCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
  },
  trackHeader: { marginBottom: 12 },
  trackTitle: { fontSize: 16, fontWeight: '700' },
  trackArtist: { fontSize: 13, marginTop: 2 },
  fixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderRadius: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixInfo: { flex: 1 },
  fixField: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  fixCurrent: { fontSize: 11, marginTop: 2 },
  fixProposed: { fontSize: 12, marginTop: 1, fontWeight: '500' },
  confidenceContainer: {
    width: 50,
    alignItems: 'center',
    gap: 4,
  },
  confidenceBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: { height: 4, borderRadius: 2 },
  confidenceText: { fontSize: 10 },
});
